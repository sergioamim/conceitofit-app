# PRD — Template vs Atribuição vs Customização (Wave C)

**Status:** Wave C.1 entregue (2026-04-27) · Wave C.2 backlog
**Origem:** sessão 2026-04-27 — diretriz do PO sobre separação conceitual

## Modelo conceitual

| Conceito | Escopo | Onde mora hoje |
|---|---|---|
| **Template** | Genérico, recomendado para todos. Define apenas estrutura (nome, sessões A/B/C, exercícios, foco/perfil, descrição genérica). NÃO carrega dados de período do aluno. | `Treino` com `tipoTreino="PRE_MONTADO"`. Editor: `treino-v3-editor.tsx` em modo `template`. |
| **Atribuição** | Personalizada por aluno. Adiciona ao template: `dataInicio`, `frequenciaSemanal`, `quantidadePrevista` (sessões a concluir), `dataFim` (derivada), e contexto pessoal (objetivo, restrições, notas). | `Treino` com `tipoTreino="CUSTOMIZADO"` + `treinoBaseId`. Modal: `AssignmentDialog`. |
| **Customização** | Overrides por aluno sobre o template (alterar séries/reps/carga/descanso/cadência/RIR/observações de exercícios específicos; adicionar, remover ou substituir exercício). Não afeta o template original. | `treino_instancia_customizada` (JSONB de `overrides[]`). API: `treino-instancia.ts`. Editor V3 em modo `instance`. |

## Wave C.1 — Front-only (entregue 2026-04-27)

### Mudanças
1. **Editor V3 header** (`editor-v3/editor-header.tsx`): no modo template, freq aparece como `(sugerida)` para indicar que é apenas default herdado pela atribuição.
2. **AssignmentDialog** (`treinos-dialogs.tsx`): substitui o textarea único "Observações" por 3 sub-campos:
   - **Objetivo individual** — meta específica do aluno (ex.: "perder 5kg em 8 semanas").
   - **Restrições / Lesões** — limitações físicas a respeitar.
   - **Notas do professor** — orientações livres.
3. **Persistência**: serializados em markdown estruturado dentro do mesmo campo `observacoes` do payload, preservando compatibilidade com o backend atual:

   ```
   ## Objetivo
   ...

   ## Restrições
   ...

   ## Notas do professor
   ...
   ```

   Helpers `parseAssignmentNotes` / `serializeAssignmentNotes` em `lib/tenant/treinos/assignment-notes.ts`. Observações antigas (sem headers) são tratadas como conteúdo de "Notas do professor".

### Por que não tocou o backend
Adicionar 3 colunas em `treino_atribuicao` (ou usar JSONB) é mudança de domínio + migration coordenada. O markdown estruturado entrega valor imediato e migra naturalmente para a Wave C.2 quando os campos virarem primeiro-classe.

## Wave C.2 — Backend (backlog)

| Item | Esforço |
|---|---|
| Migration: 3 colunas em `treino_atribuicao` (ou JSONB `metadados`) | M |
| `AtribuirTemplateRequest` + DTOs aceitam novos campos | M |
| Migrar leitura: parser markdown → primitivos | S |
| Editor V3 instance mode: card "Personalização do aluno" com os 3 campos (lê do treino atribuído, edita via PATCH) | M |

## Decisões pendentes
- **Onde armazenar observações de instance**: `Treino.observacoes` (do treino atribuído) ou `TreinoInstanciaCustomizada` (do overlay)? Recomendação: `Treino.observacoes` — instância é apenas overlay sobre exercícios; contexto pessoal pertence ao treino atribuído.
- **Tags de Foco multi-valor**: hoje `perfilIndicacao` é singular (Wave A entregou pill colorida). Se multi-valor for necessário, requer schema novo.
