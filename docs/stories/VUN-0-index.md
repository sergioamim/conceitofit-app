# VUN — Índice de Epics e Stories · Unificação de Vendas

**Criado por:** @sm (River, Scrum Master)
**Validado por:** @po (Pax, Balancer) — PRD score 10/10 · verdict GO
**Data:** 2026-04-20
**PRD de referência:** [`../VENDAS_UNIFICADAS_PRD.md`](../VENDAS_UNIFICADAS_PRD.md)
**Escopo:** `academia-app` + `academia-java` (`modulo-agregadores`, `modulo-catraca`, `modulo-academia`) + `academia-gestao-acesso`

---

## Objetivo do programa

Consolidar 3 fluxos de venda (modal `nova-matricula-modal`, wizard `novo-cliente-wizard`, tela `/vendas/nova`) em um único cockpit unificado com combo livre (PLANO + SERVIÇO + PRODUTO), modelar taxonomia definitiva de cliente (Prospect / Aluno ativo / Aluno inativo), três modalidades de acesso (Plano recorrente, Pacote de visitas, Agregador B2B) e validação síncrona de catraca via webhook + `POST /access/v1/validate` da Wellhub.

Entrega em 5 Epics sequenciais (VUN-1 → VUN-5), cada Epic mergeable em produção independentemente.

---

## Priorização obrigatória

```
VUN-1 → VUN-2 → VUN-3 → VUN-4 → VUN-5
```

Fase 5 só entra em draft após VUN-1..VUN-4 terem ≥14 dias em produção (ver §13 do PRD — risco "Migração dos fluxos antigos com regressão").

Dentro de uma mesma Epic, stories podem ir em paralelo quando `Dependências` for `—`.

---

## Mapa Epics × Stories

### Epic VUN-1 — Fundação Visual (Cockpit Shell)

Objetivo: montar a casca do cockpit sem tocar lógica comercial. Zero regressão comercial é requisito de aceite.

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-1.1** | Fonte mono + tokens `--ink` / `--receipt-paper` | XS | — |
| **VUN-1.2** | `CockpitShell` com header escuro 56px + grid 3 colunas | S | VUN-1.1 |
| **VUN-1.3** | Migrar `/vendas/nova/page.tsx` para usar `CockpitShell` preservando componentes atuais | S | VUN-1.2 |

Total Epic VUN-1: 1 XS + 2 S

### Epic VUN-2 — Catálogo + Busca Universal

Objetivo: substituir o `sale-type-selector` por tabs que não zeram o carrinho e entregar a busca universal ⌘K com scanner inline.

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-2.1** | `universal-search.tsx` com Command shadcn + scanner inline | M | VUN-1.3 |
| **VUN-2.2** | Catálogos `catalog-planos`, `catalog-servicos`, `catalog-produtos` | M | VUN-1.3 |
| **VUN-2.3** | Tab segmented substituindo `sale-type-selector` (combo livre RN-011) | S | VUN-2.2 |
| **VUN-2.4** | Fluxo inline de criação rápida de Prospect ao digitar CPF desconhecido (RN-014) | S | VUN-2.1 |

Total Epic VUN-2: 2 S + 2 M

### Epic VUN-3 — Painel Pagamento + Recibo Térmico

Objetivo: entregar `payment-panel` com parcelas/NSU e o `thermal-receipt` reusável.

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-3.1** | `thermal-receipt.tsx` componente compartilhado (carrinho + modal) | M | VUN-1.3 |
| **VUN-3.2** | `payment-panel.tsx` com convênio/cupom/parcelas/NSU e botão dinâmico (RN-005, RN-006, RN-018) | M | VUN-3.1 |
| **VUN-3.3** | `use-venda-workspace.ts` expandido com `parcelas`, `autorizacao`, `canFinalize` | S | VUN-3.2 |

Total Epic VUN-3: 1 S + 2 M

### Epic VUN-4 — Modal Recibo Upgrade

Objetivo: reescrever o `sale-receipt-modal.tsx` no layout 820×560 reusando o `thermal-receipt` (RN-017).

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-4.1** | Reescrita do `sale-receipt-modal.tsx` layout 820×560 | M | VUN-3.1 |
| **VUN-4.2** | A11y + "Nova venda" reset + mock print/email com aria-live | S | VUN-4.1 |

Total Epic VUN-4: 1 S + 1 M

### Epic VUN-5 — Consolidação Comercial + Agregador

Objetivo: a Epic mais pesada — elimina `nova-matricula-modal`, consolida wizard com 3 CTAs, implementa backend de vínculos B2B, webhook + validate síncrono, jobs de inativação e purge facial.

**Frontend:**

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-5.1** | Wizard com 3 CTAs finais (Salvar / Vender / Vincular agregador) + remoção `wizard-step-plano` (RN-010) | M | VUN-5.4 (endpoint), VUN-3.3 |
| **VUN-5.2** | Modal "Vincular Agregador" + service `src/lib/api/agregadores-vinculos.ts` | S | VUN-5.4 |
| **VUN-5.3** | Deleção total do `nova-matricula-modal.tsx` + todas referências | S | VUN-5.1 |
| **VUN-5.8** | Cockpit recebe SSE/WebSocket "CheckinPendenteCriado" → toast lateral recepção | M | VUN-5.5 |

**Backend:**

| Story | Título | Tamanho | Dependências |
|-------|--------|---------|--------------|
| **VUN-5.4** | Evolução `AgregadorUsuarioEntity` + `AgregadorVinculoService` + `POST /api/v1/agregadores/vinculos` | L | — |
| **VUN-5.5** | `AgregadorCheckinPendenteEntity` + sinks `WellhubCheckinSink` / TotalPass criando pendentes + `CheckinExpiradoJob` | M | VUN-5.4 |
| **VUN-5.6** | `POST /catraca/validar-entrada` (happy + sad paths STRICT) consumido por `academia-gestao-acesso` | L | VUN-5.5 |
| **VUN-5.7** | Jobs `AgregadorCicloJob` + `PlanoInativacaoJob` + `DireitoAcessoQueryService` + endpoint `POST /catraca/purge-facial/{alunoId}` | L | VUN-5.4, VUN-5.5 |

Total Epic VUN-5: 3 S + 3 M + 3 L

---

## Resumo de tamanhos totais

| Tamanho | Quantidade |
|---------|------------|
| XS | 1 (VUN-1.1) |
| S | 8 (VUN-1.2, VUN-1.3, VUN-2.3, VUN-2.4, VUN-3.3, VUN-4.2, VUN-5.2, VUN-5.3) |
| M | 8 (VUN-2.1, VUN-2.2, VUN-3.1, VUN-3.2, VUN-4.1, VUN-5.1, VUN-5.5, VUN-5.8) |
| L | 3 (VUN-5.4, VUN-5.6, VUN-5.7) |
| **Total stories** | **20** |

Regra AIOX (@sm): cada story deve ser fechável em ≤ 3 dias de dev. L = 3 dias; M = 2 dias; S = 1 dia; XS = < 1 dia.

---

## Spikes técnicos pré-Epic VUN-5

Antes de abrir VUN-5 em draft final, os spikes abaixo confirmam pressupostos do PRD:

| Spike | Pergunta | Bloqueia |
|-------|----------|----------|
| **SP-VUN-1** | `academia-gestao-acesso` consegue fazer HTTP POST síncrono < 1s para `/catraca/validar-entrada`? | VUN-5.6 |
| **SP-VUN-2** | `WellhubAdapter.validate(gate_trigger)` está funcional em produção? Qual latência média? | VUN-5.6 |
| **SP-VUN-3** | Existe infra de SSE/WebSocket no `academia-app`? Se não, requer task de infra antes de VUN-5.8 | VUN-5.8 |
| **SP-VUN-4** | Quantos registros `AgregadorUsuarioEntity` existem hoje por tenant? Viabilidade do backfill `aluno_id` via `externalUserId` | VUN-5.4 |

Se SP-VUN-3 retornar "não existe", VUN-5.8 cai para polling simples e a story passa de M para S (reescopar).

---

## Open questions herdadas do PRD

1. Threshold de visitas em pacote para cadastrar facial (PRD §15.1) — default proposto: 5, configurável em `unidade.config`.
2. Política `GRACE_PERIOD` vs `STRICT` inicial (PRD §15.2) — PRD fixa `STRICT` como default V1 (RN-009). V2 fora deste programa.

---

## Handoff

**Próximo passo:** `@po *validate-story-draft VUN-1.1` (começar pela Epic VUN-1, story por story em ordem).

**Responsáveis por fase:**
- `@sm *draft` — cria cada story a partir do PRD (já feito para VUN-1..VUN-5)
- `@po *validate-story-draft` — valida cada story (checklist 10 pontos)
- `@dev` — spikes SP-VUN-1..SP-VUN-4 + implementação
- `@qa *qa-gate` — ao final de cada story
- `@devops *push` — PR e merge

---

*— River, Scrum Master 🌊 (em dupla com Pax)*
