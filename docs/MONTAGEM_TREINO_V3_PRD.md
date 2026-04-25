# Montagem de Treino V3 — PRD

**Status:** proposto (2026-04-25), aguardando aprovação para iniciar Wave 1.
**Autor:** redesign do CEO em sessão 2026-04-25, baseado no design package
`Montagem de Treino` (Claude Design).
**Depende de:** TreinoV2 atual em produção (governance, V2 endpoints).
**Prioridade:** alta — UX redesign completo do módulo de treino + nova
capacidade de customização por aluno (instance overlay).
**Estimativa:** ~3.5 sprints (7 waves).

---

## Contexto

O módulo atual (V2) tem uma base sólida:

- 7 rotas (`/treinos`, editor, exercícios, prescrição, atribuídos,
  grupos musculares, `/meus-treinos` cliente).
- API V2 robusta com workflow `RASCUNHO → EM_REVISAO → PUBLICADO →
  ARQUIVADO`.
- Domain types bem modelados (`TreinoV2Block`, `TreinoV2Technique`).
- Editor form-based com permissões finas.

O design package `Montagem de Treino` propõe:

- **6 telas integradas** (templates, editor, biblioteca, detalhe ex.,
  atribuir, progresso).
- **Editor inline tipo planilha** (tabela de 7 colunas editáveis).
- **Drag & drop** para reordenar exercícios.
- **Modo "instance"**: customizar template para aluno específico com
  diff visual em amarelo.
- Stats por sessão, código de cor por grupo muscular, modal de
  biblioteca multi-select.

A pergunta central: **como casar a UX nova com a base V2 existente
sem perder governance, permissões e histórico?**

Resposta deste PRD: **renomear** parte do schema, **promover** 2
campos, **adicionar 1 entity nova** (instance overlay) e **substituir**
o editor + listagens. Tudo o resto (V2 governance + assignment jobs +
catálogo + cliente view) **fica intocado**.

## Decisões ancoradas (CEO 2026-04-25)

### D1 — Rename `Block` → `Sessao` no backend

Padrão de domínio do produto = "sessão" (label livre A/B/C, Dia 1/2/3).
"Block" é jargão técnico que não bate com a fala do personal. Decisão:
**rename atomicamente em todo o stack** (DB + Java + DTOs + endpoints
+ FE), zero data loss.

### D2 — Modo instance via nova entity (Opção A)

Nova tabela `treino_v2_instancia_customizada`. Cada instância vincula
um `(template_id, aluno_id)` e armazena `overrides` em JSONB.

Modelo conceitual:
- Template é **imutável a partir do PUBLICADO** (já é regra V2).
- Atribuir → cria instância vazia (zero overrides) → exibe template
  como está.
- Personal customiza no editor → cada mudança vira override
  persistido.
- Cliente abre `/meus-treinos` → backend renderiza template + overlay
  da instância. Diff visual no FE marca células com `_isCustom: true`.
- Botão "Resetar" zera overrides (volta a ver template puro).
- Deletar template → CASCADE deleta instâncias.

### D3 — Cadência e RIR como campos de primeira classe

Hoje vivem em string livre (`descricao`). Promover para colunas:

- `cadencia varchar(16)` (ex.: `"2-0-1"`, `"explosivo"`)
- `rir smallint` (0–10, default null)

Ganhos: relatórios estruturados, progressão automática (RIR baixando
ao longo do tempo é sinal de adaptação), filtros futuros.

### D4 — Tema segue o sistema corrente do app

Não introduzir paleta nova nem opção de tema isolada do treino. Reusar
tokens já ativos do app (`bg-secondary`, `border-border`,
`text-muted-foreground`, `gym-accent`, etc.). O design propunha lime
`#c8f135` mas isso já é coerente com o tema do app.

### D5 — Escopo: TUDO (todas as 6 telas)

Comprometimento integral com o redesign. As 7 waves cobrem desde
backend até atribuir + progresso.

## Modelo de dados — schema completo

### Migração M1 — Rename Block → Sessao

```sql
-- Convenção do projeto: V202604NNNNNN__convenio_xxx.sql
-- modulo-academia/src/main/resources/db/migration/

ALTER TABLE treino_v2_block RENAME TO treino_v2_sessao;
ALTER TABLE treino_v2_block_item RENAME TO treino_v2_sessao_item;

ALTER TABLE treino_v2_sessao_item RENAME COLUMN bloco_id TO sessao_id;

-- Renomear constraints
ALTER TABLE treino_v2_sessao
    RENAME CONSTRAINT treino_v2_block_pkey TO treino_v2_sessao_pkey;
ALTER TABLE treino_v2_sessao
    RENAME CONSTRAINT treino_v2_block_template_fk TO treino_v2_sessao_template_fk;
ALTER TABLE treino_v2_sessao_item
    RENAME CONSTRAINT treino_v2_block_item_pkey TO treino_v2_sessao_item_pkey;
ALTER TABLE treino_v2_sessao_item
    RENAME CONSTRAINT treino_v2_block_item_block_fk TO treino_v2_sessao_item_sessao_fk;

-- Renomear índices
ALTER INDEX treino_v2_block_template_idx
    RENAME TO treino_v2_sessao_template_idx;
ALTER INDEX treino_v2_block_item_block_idx
    RENAME TO treino_v2_sessao_item_sessao_idx;
```

**Verify pós-migration**:
- `SELECT count(*) FROM treino_v2_sessao` deve bater com count antigo
  de `treino_v2_block`.
- App roda smoke test (criar template, listar) sem erro.
- JPA reconhece tabelas (entities recompiladas).

### Migração M2 — Promover cadencia e rir

```sql
ALTER TABLE treino_v2_sessao_item
    ADD COLUMN cadencia varchar(16) NULL,
    ADD COLUMN rir smallint NULL;

ALTER TABLE treino_v2_sessao_item
    ADD CONSTRAINT treino_v2_sessao_item_rir_check
        CHECK (rir IS NULL OR rir BETWEEN 0 AND 10);
```

Dados existentes: `NULL` em ambos. Migração best-effort opcional pode
parsear `descricao` por regex (ex.: `"3x10 - 2-0-1 - RIR 2"`) — mas
manter conservador, deixar NULL e personal preenche.

### Migração M3 — Tabela de instância customizada

```sql
CREATE TABLE treino_v2_instancia_customizada (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    template_id uuid NOT NULL REFERENCES treino_v2_template(id) ON DELETE CASCADE,
    aluno_id uuid NOT NULL,
    atribuicao_id uuid NULL REFERENCES treino_v2_assigned_workout(id) ON DELETE SET NULL,
    overrides jsonb NOT NULL DEFAULT '[]'::jsonb,
    autor_id uuid NOT NULL,
    criado_em timestamptz NOT NULL DEFAULT now(),
    atualizado_em timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT treino_v2_instancia_unique_aluno UNIQUE (template_id, aluno_id)
);

CREATE INDEX treino_v2_instancia_aluno_idx
    ON treino_v2_instancia_customizada (aluno_id);
CREATE INDEX treino_v2_instancia_tenant_idx
    ON treino_v2_instancia_customizada (tenant_id);
CREATE INDEX treino_v2_instancia_template_idx
    ON treino_v2_instancia_customizada (template_id);
```

**Shape do `overrides` (JSONB)**:

```json
[
  {
    "tipo": "MODIFY",
    "sessaoId": "uuid",
    "exercicioItemId": "uuid",
    "campo": "carga|reps|series|descanso|cadencia|rir|obs",
    "valor": "85kg"
  },
  {
    "tipo": "ADD",
    "sessaoId": "uuid",
    "afterItemId": "uuid|null",
    "exercicio": { "exercicioCatalogoId": "uuid", "series": 3, "reps": "10-12", ... }
  },
  {
    "tipo": "REMOVE",
    "sessaoId": "uuid",
    "exercicioItemId": "uuid"
  },
  {
    "tipo": "REPLACE",
    "sessaoId": "uuid",
    "exercicioItemId": "uuid",
    "novoExercicioCatalogoId": "uuid"
  }
]
```

**Operações suportadas**:
- MODIFY: campo único alterado (carga, reps, etc.)
- ADD: exercício novo inserido na sessão
- REMOVE: exercício do template excluído nesta instância
- REPLACE: trocar exercício mantendo configuração (ex.: agachamento
  livre → leg press)

## Backend — endpoints e serviços

### Endpoints novos (instância)

```
GET    /api/v2/treinos/instancias?alunoId=X&templateId=Y
GET    /api/v2/treinos/instancias/{id}
POST   /api/v2/treinos/templates/{templateId}/instancias
       body: { alunoId, atribuicaoId? }
PATCH  /api/v2/treinos/instancias/{id}/overrides
       body: { overrides: [...] }  // replace completo, frontend
                                   // recalcula diff a cada save
DELETE /api/v2/treinos/instancias/{id}
```

### Endpoint estendido — render do treino do cliente

`GET /api/v2/treinos/cliente/{alunoId}/treino-atual` retorna o template
**já mergeado com a instância**, com flag `_isCustom` por campo.
Backend faz o merge (não o cliente) — cliente confia.

### Resolução de conflito

Se template é **republicado** (versão nova) enquanto instância existe:
- Tag `versao_template` na instância (snapshot).
- Ao detectar drift, exibir aviso ao personal: "Template foi
  atualizado. Revise os overrides desta instância."
- Personal pode aceitar drift ou regenerar instância vazia.

## Frontend — 6 telas

### T1 — Templates list (`/treinos`)

**Mantém**: workflow `RASCUNHO/EM_REVISAO/PUBLICADO`, governance.

**Redesign**:
- Grid de cards (vs tabela atual).
- Card: thumb (placeholder visual), nome, objetivo, nível, N sessões,
  badge de status, contador de "atribuído a N alunos".
- Filtros: objetivo (chips), favoritos, busca.
- Ações: ver, editar, duplicar, atribuir, arquivar.

### T2 — Editor (`/treinos/[id]`)

**Mantém**: governance (campo `status` no header), permissões finas.

**Redesign completo**:
- Header: voltar + título editável inline + meta (objetivo · nível ·
  N sessões) + ações (Pré-visualizar, Salvar).
- Sidebar (220px): lista de sessões A/B/C com label, exercícios count,
  duração; botão "+ Nova sessão"; observações gerais.
- Main: tabela inline 7 colunas (#, Exercício, Séries × Reps, Carga,
  Descanso, Cadência, RIR) + drag handles + ações por linha
  (duplicar, remover) + obs expandido.
- Stats da sessão ativa: total de séries, total de exercícios, chips
  de grupos musculares cobertos.
- Modal Biblioteca (multi-select) ao clicar "+ Adicionar exercício".

**Modo `instance`** (`/treinos/[templateId]/aluno/[alunoId]`):
- Header ganha pill do aluno + badge "X custom" + botão "Resetar".
- CTA muda: "Salvar template" → "Salvar para [Nome]".
- Células com override: `data-custom="true"` aplica destaque amarelo.
- Subtítulo: "↳ baseado em [template]".

### T3 — Biblioteca de exercícios (`/treinos/exercicios`)

**Mantém**: CRUD de exercícios, filtros por tipo
(MUSCULACAO/CARDIO/MOBILIDADE/ALONGAMENTO/FUNCIONAL), modal create/edit.

**Redesign**:
- Grid de cards (3-4 colunas) em vez de tabela.
- Card: thumb (vídeo placeholder se não houver), nome, aparelho,
  dificuldade, chip do grupo muscular.
- Filtros laterais: grupo (com cor), aparelho, nível.
- Click no card → tela detalhe T4.

### T4 — Detalhe do exercício (`/treinos/exercicios/[id]`)

**Tela nova**.

- Header: voltar + nome + ações (editar, arquivar).
- Bloco principal: vídeo (placeholder) + descrição.
- Seções: instruções de execução, erros comuns, dicas, "usado em N
  templates" (lista clicável).
- Sidebar: grupo muscular (chip colorido grande), aparelho, dificuldade,
  duração média, biomecânica.

### T5 — Atribuir treino (`/treinos/atribuidos`)

**Redesign do existente**.

- Tabela de alunos com colunas: nome, template atual, % adesão, próxima
  sessão, customizações (badge "X custom"), ações.
- Resumo de customs por linha: "Sub. Agachamento → Leg press; -10kg
  supino" (gerado do JSONB de overrides).
- Botões: **Customizar** (abre editor em modo instance), **Progresso**
  (abre T6).
- Modal de atribuição em 3 passos: escolher template → selecionar
  alunos → confirmar (com opção de "criar instâncias vazias").

### T6 — Progresso do aluno (`/treinos/progresso/[alunoId]`)

**Tela nova**.

- Header: aluno + objetivo + adesão geral.
- Gráfico de progressão de carga (linha) por exercício (filtrável).
- Heatmap de adesão (calendar heatmap, GitHub-style).
- Histórico em lista: data, sessão executada, volume total (kg×reps),
  PRs marcados.
- Sidebar: estatísticas (total séries, total volume, dias treinados).

## Plano de waves

### Wave 1 — Rename Block → Sessao (backend + FE)
**Conteúdo**: M1 + entity rename + DTO rename + endpoint paths e payloads
+ FE types/hooks/components atualizados.
**Risco**: alto. Atinge muita coisa, mas é puro rename — comportamento
zero-breakage.
**Validação**: smoke test (criar/editar/listar template) + verify counts
pré/pós migration.
**Estimativa**: 1 sprint.

### Wave 2 — Promote cadencia + rir (backend + FE)
**Conteúdo**: M2 + colunas em entity + DTO + form fields no editor (mas
ainda no editor V2).
**Risco**: baixo. Campos novos nullable.
**Estimativa**: 0.5 sprint.

### Wave 3 — Editor V3 tabela inline (FE)
**Conteúdo**: novo `TreinoV3Editor.tsx` com tabela inline + drag&drop +
sidebar de sessões + modal biblioteca multi-select + stats + cores de
grupo muscular. Modo `template` apenas (sem instance ainda).
**Feature flag**: `treino.editor.v3.enabled`. Co-existe com V2.
**Risco**: médio. UX nova que personals usam diariamente — opt-in.
**Dependência**: `@dnd-kit/core` (instalar).
**Estimativa**: 1 sprint.

### Wave 4 — Modo instance (backend + FE)
**Conteúdo**: M3 + entity `TreinoV2InstanciaCustomizada` + 5 endpoints
novos + serviço de merge template+overrides + modo `instance` no editor
V3 (header com aluno, diff amarelo, botão Resetar) + endpoint do cliente
estendido pra renderizar mergeado.
**Risco**: médio. Conceito novo de produto.
**Estimativa**: 1 sprint.

### Wave 5 — Templates list + Biblioteca + Detalhe ex. (FE)
**Conteúdo**: T1, T3, T4 redesign visual.
**Risco**: baixo. Sem mudança de schema.
**Estimativa**: 0.5 sprint.

### Wave 6 — Atribuir + Progresso (FE)
**Conteúdo**: T5 redesign + T6 nova com gráficos.
**Dependência**: `recharts` (já existe?) ou similar.
**Risco**: médio (T6 tem charts). 
**Estimativa**: 0.5 sprint.

### Wave 7 — Cutover
**Conteúdo**: remove flag `treino.editor.v3.enabled`, deleta
`treino-v2-editor.tsx`, arquiva V1 endpoints legacy se ainda existem,
documentação final.
**Risco**: baixo.
**Estimativa**: 0.25 sprint.

**Total**: ~3.75 sprints (~7-8 semanas).

## Riscos

| Risco | Severidade | Mitigação |
|---|---|---|
| Rename Block→Sessao quebra prod | Alta | Migration atomic; smoke test pre-prod com dados reais; deploy em janela controlada |
| Drift de versão entre template e instância | Média | Snapshot `versao_template` na instância + aviso de drift no editor |
| `@dnd-kit/core` não acessível com teclado | Média | Confirmar antes da Wave 3; fallback botões reorder |
| Volume de overrides cresce sem controle (ex.: 100 customs por aluno) | Baixa | Limit de 200 overrides por instância; UI pede "duplique o template" se passar |
| Cliente vê treino com flicker durante merge backend | Baixa | Backend retorna mergeado em 1 request; sem split client-side |
| Conflito de regra: aluno tem instância, template arquivado | Média | Política: arquivar template ⇒ congelar instâncias; aviso no editor |

## Métricas pós-release

- **Tempo médio para montar template** (deve cair com tabela inline).
- **Tempo médio para atribuir + customizar para aluno** (deve cair).
- **% de instâncias com customizações > 0** (sinal de adoção real).
- **Adesão média dos alunos** (% de sessões executadas).
- **Bounce rate** no editor V3 vs V2 durante coexistência (telemetria
  da feature flag).

## Dependências

- `@dnd-kit/core` — drag & drop com a11y. Instalar.
- Charts library — verificar se `recharts` já está no projeto. Se não,
  decisão técnica entre `recharts`, `visx`, `nivo` — recomendar
  `recharts` (familiaridade do time).
- Calendar heatmap — `react-calendar-heatmap` ou implementação custom.
- `next-themes` — já existe no app, reaproveitar.

## Compatibilidade durante coexistência

Wave 3-7 introduzem feature flag `treino.editor.v3.enabled`. Durante
co-existência (Waves 3-6, ~2 sprints):

- Personals com flag OFF: vêem editor V2 (form-based), salvam normal.
- Personals com flag ON: vêem editor V3 (tabela inline). Mesmos
  endpoints V2 backend, payload idêntico (Wave 3 não muda schema).

Cutover (Wave 7): flag flipped on globally, V2 deletado.

## Aprovação

- [x] CEO — sessão 2026-04-25, decisões D1-D5 confirmadas.
- [ ] @data-engineer — review M1 (rename), M3 (instância) e estratégia
  de migration atomic.
- [ ] @architect — review do impacto no v2-runtime, snapshots,
  governance, assignment jobs.
- [ ] @qa — checklist de testes de migration + diff visual + drift de
  versão.

Só depois de OKs: @sm drafta as 7 waves como stories no Epic.

## Fora de escopo (Phase 4 explicitamente)

- **Versionamento de instância** (timeline de overrides) — só estado
  atual.
- **Sugestão de progressão automática** baseada em RIR baixando.
- **PRs detectados automaticamente** vs marcados pelo personal.
- **Comparador A/B de templates** (ex.: "qual template gerou mais
  adesão?").
- **Exercícios com bibliografia/referências científicas** — fica só
  com instruções/erros comuns.
- **Treino livre** (aluno cria seu próprio sem template) — não cabe
  no fluxo personal-driven.

## Histórico de revisão

- 2026-04-25 — versão inicial criada após decisões D1-D5 do CEO em
  sessão. Aguarda revisão técnica.
