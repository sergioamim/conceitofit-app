# Epic 2 — Perfil do Cliente v3 (Adoção do novo layout)

**Criado por:** @po (Pax, the Balancer)
**Data:** 2026-04-20
**Status:** Ready for `@sm *draft`
**PRD de referência:** [`../PERFIL_CLIENTE_V3_ADOCAO_PRD.md`](../PERFIL_CLIENTE_V3_ADOCAO_PRD.md)
**Predecessor:** Perfil v2 (Waves 1-3, entregue em 2026-04-19)
**Escopo:** `academia-app/src/app/(portal)/clientes/[id]/`

---

## Objetivo do épico

Adotar o layout V1/V6 do diretório `design perfil/` sobre o perfil do cliente atual, preservando o theme default do sistema. Entrega em 4 waves sequenciais com feature flag `perfil.drawerAcoes` para rollout gradual. V2 Editorial descartado; RiskPanel integrado ao card do Resumo via heurística determinística.

## Premissas e restrições

- Theme default do sistema é **mandatório** — tokens `--gym-*`; sem hero escuro.
- Constitution Artigo IV (No Invention): nenhum dado fabricado; estados vazios quando backend não existir.
- Rollout wave a wave com feature flag. Perfil v2 está em produção há 7 dias — qualquer regressão P0/P1 bloqueia merge.
- Abas `Mensagens` e `Notas` ficam para iterações seguintes (dependem de integração CRM e backend de notas).

---

## Stories

Cada story abaixo está pronta para `@sm *draft`. O @sm deve expandir title, descrição detalhada, tasks técnicas e File List a partir dos ACs do PRD.

### Wave 1 — Rail de sinais + HeroAvatar com halo

| ID | Título curto | ACs do PRD | Tamanho | Dependências |
|----|--------------|------------|---------|--------------|
| **2.1** | HeroAvatar com halo de status no `ClienteHeader` | AC1.1 | XS | — |
| **2.2** | Rail de 6 sinais abaixo do header | AC1.2, 1.3, 1.4 | S | 2.1 |
| **2.3** | Rail responsivo (scroll horizontal em mobile) | AC1.5 | XS | 2.2 |
| **2.4** | Preservar banners de status atuais junto ao rail | AC1.6 | XS | 2.2 |

### Wave 2 — Drawer "Próximas Ações"

| ID | Título curto | ACs do PRD | Tamanho | Dependências |
|----|--------------|------------|---------|--------------|
| **2.5** | Hook `use-sugestoes-cliente.ts` com 8 regras determinísticas | AC2.3 | M | — |
| **2.6** | Botão "Ações" com badge de contagem no `ClienteHeader` | AC2.1, 2.6 | S | 2.5 |
| **2.7** | Drawer lateral com lista priorizada e CTAs funcionais | AC2.2, 2.4, 2.5 | M | 2.5, 2.6 |
| **2.8** | Feature flag `perfil.drawerAcoes` | AC2.7 | XS | 2.7 |

### Wave 3 — FrequenciaBars + Plano countdown + Risco de evasão

| ID | Título curto | ACs do PRD | Tamanho | Dependências |
|----|--------------|------------|---------|--------------|
| **2.9** | Card "Frequência (14 dias)" com mini-bars no Resumo | AC3.1, 3.4 | S | Spike de frequência |
| **2.10** | Card "Plano ativo" com countdown + próxima cobrança | AC3.2, 3.3 | S | — |
| **2.11** | `lib/domain/risco-evasao.ts` com heurística + testes | AC3.6 | M | — |
| **2.12** | Card "Risco de evasão" no Resumo (score + rótulo + top 3 fatores) | AC3.5, 3.8, 3.9 | M | 2.11 |
| **2.13** | Sparkline de tendência 7 semanas (condicional a dados) | AC3.5 | S | 2.12, spike histórico |
| **2.14** | Painel lateral "Ver detalhes" do risco | AC3.7 | S | 2.12 |

### Wave 4 (opcional — a validar após 1-3 estabilizadas) — Reorganização de abas

| ID | Título curto | ACs do PRD | Tamanho | Dependências |
|----|--------------|------------|---------|--------------|
| **2.15** | Renomear label "Dashboard" → "Resumo" | AC4.4 | XS | — |
| **2.16** | Remover aba "Edição"; consolidar via `ClienteEditDrawer` | AC4.5 | XS | — |
| **2.17** | Mover "Cartões" do TabBar para `ActionMenu` | AC4.6 | S | — |
| **2.18** | Dissolver aba "Atividades" (placeholder) | AC4.1 | XS | 2.19, 2.20, 2.21 |
| **2.19** | Aba nova "Frequência" (histórico completo) | AC4.1, 4.2 | M | Spike frequência |
| **2.20** | Aba nova "Treinos" | AC4.1, 4.2 | M | Treinos v2 existente |
| **2.21** | Aba nova "Avaliações" | AC4.1, 4.2 | M | Spike avaliações |
| **2.22** | Aba nova "Fidelidade" | AC4.1, 4.2 | M | Spike fidelidade |
| **2.23** | Aba nova "Documentos" | AC4.1, 4.2 | M | Spike documentos |
| **2.24** | `HistoricoItem` unificado + filtro por tipo em Relacionamento | AC4.3 | S | — |
| **2.25** | Aliases de URL `?tab=cartoes|editar|atividades` por 1 sprint | AC4.7 (antigo) | XS | 2.17, 2.16, 2.18 |

### Reservadas para iterações seguintes (fora deste épico)

- Aba **Mensagens** + integração perfil ↔ módulo CRM interno.
- Aba **Notas** + backend dedicado.
- Modelo de churn via ML (substituiria heurística de 2.11).

---

## Spikes técnicos pré-épico (@dev)

Antes de abrir Wave 3 e Wave 4, um spike curto deve confirmar a disponibilidade de cada dado listado. Resultado vai em nota técnica anexa a este épico.

| Spike | Pergunta a responder | Bloqueia |
|-------|----------------------|----------|
| **SP-1** Frequência | `useClienteWorkspace` já retorna check-ins dos últimos 14/30 dias? Existe endpoint para histórico semanal de 7 sem? | 2.9, 2.13, 2.19 |
| **SP-2** Avaliações | Backend retorna histórico de avaliações físicas do cliente? | 2.21 |
| **SP-3** Fidelidade | Existe backend de saldo/nível/histórico de pontos? | 2.22 |
| **SP-4** Documentos | Repositório de arquivos por cliente está acessível via API? | 2.23 |
| **SP-5** NPS / Survey | Existe dado de NPS para alimentar a heurística de risco (AC3.6)? | 2.11 (fator NPS opcional) |

Se um spike retornar "não existe", o fator correspondente é omitido (AC3.8) e a story da aba cai para estado vazio ou sai da Wave 4.

---

## Métricas de sucesso (do PRD §7)

1. Tempo médio de atendimento na recepção (baseline vs. pós-épico).
2. Taxa de clique em sugestões do drawer, logada por tipo.
3. % de renovações originadas via drawer.
4. Zero regressões P0/P1 em Playwright existente do perfil.

---

## Handoff

**Próximo passo:** `@sm *draft 2.1` (começar pela Wave 1, story por story em ordem).

**Sequenciamento obrigatório:**
- Waves 1 → 2 → 3 (sem paralelismo inter-wave).
- Dentro de uma wave, stories podem ir em paralelo quando `Dependências` for `—`.
- Wave 4 só entra em draft após Waves 1-3 em produção e estabilizadas (1 sprint de observação).

**Responsáveis por fase:**
- `@sm *draft` — cria cada story a partir dos ACs do PRD.
- `@po *validate-story-draft` — valida cada story (checklist 10 pontos).
- `@dev` — spikes SP-1 a SP-5 + implementação.
- `@qa *qa-gate` — ao final de cada story.
- `@devops *push` — PR e merge.

---

*— Pax, equilibrando prioridades 🎯*
