# Story VUN-1.3 — Migrar `/vendas/nova/page.tsx` para `CockpitShell`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft → `[ ]` Ready → `[ ]` In Progress → `[ ]` Review → `[ ]` Done |
| **Epic** | VUN-1 · Fundação Visual (Cockpit Shell) |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | S (≈ 1 dia) |
| **Branch** | `feat/vun-1.3-cockpit-migration` |

---

## Contexto

VUN-1.2 entregou o `CockpitShell` isolado. Esta story **encaixa** os componentes atuais (`cart-items`, `sale-summary`, `client-and-item-selector`, `plano-details`, `sale-type-selector`, `sale-header`) dentro dos slots do shell, **sem refatorar lógica comercial**.

É a primeira story com risco comercial real do programa VUN. AC de zero regressão comercial é explícito no PRD Fase 1 (§12).

### Problema

Sem migrar `page.tsx`, o shell criado em VUN-1.2 fica órfão e o handoff visual §2.2 não é entregue.

---

## Objetivo

`/vendas/nova` carrega com novo visual (header escuro + 3 colunas) e **toda venda continua funcionando exatamente como antes**.

---

## Acceptance Criteria

1. **AC1** — `src/app/(portal)/vendas/nova/page.tsx` usa `<CockpitShell left={...} center={...} right={...} />`.
2. **AC2** — Componentes atuais (sem alteração interna):
   - `left` ← `client-and-item-selector` + `sale-type-selector` (ou equivalente usado hoje)
   - `center` ← conteúdo do catálogo atual (dentro de `sale-type-selector`)
   - `right` ← `cart-items` + `sale-summary`
3. **AC3** — Zero alteração em `hooks/use-venda-workspace.ts` nesta story.
4. **AC4** — Zero regressão comercial: smoke checklist pós-merge cobre:
   - venda de plano puro;
   - venda de produto puro;
   - venda plano + produto (combo atual permitido? se não, documentar);
   - venda com convênio;
   - venda parcelada.
5. **AC5** — Visual renderiza conforme handoff §2.2 a 1440×900 (target primário).
6. **AC6** — Responsivo: 1280×800 OK, 1920×1080 OK.
7. **AC7** — `npm run lint && npm run typecheck && npm test && npm run build` todos passam. Playwright E2E existente (se houver para `/vendas/nova`) passa.

---

## Escopo técnico

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/page.tsx` | Reescrever o layout usando `CockpitShell` |

### Arquivos que **NÃO** devem ser tocados nesta story

- `hooks/use-venda-workspace.ts`
- `components/cart-items.tsx`
- `components/sale-summary.tsx`
- `components/client-and-item-selector.tsx`
- `components/plano-details.tsx`
- `components/sale-type-selector.tsx`
- `components/sale-header.tsx`

(Essas remoções/reescritas acontecem em VUN-2/3/4/5.)

---

## Tasks

- [ ] Ler estrutura atual de `page.tsx` para mapear onde cada componente vive
- [ ] Reescrever `page.tsx` usando `CockpitShell` + slots apropriados
- [ ] Checar se Suspense boundaries existentes precisam ser reposicionados
- [ ] Smoke comercial com 5 cenários (AC4)
- [ ] Teste responsivo (AC5, AC6)
- [ ] Rodar suite completa (AC7)

---

## Dependências

- **Bloqueadoras:** VUN-1.2 (shell pronto).
- **Bloqueia:** VUN-2.1, VUN-2.2, VUN-3.1 (todas assumem que page.tsx já usa shell).

---

## Riscos específicos

| Risco | Mitigação |
|-------|-----------|
| Largura 360px corta conteúdo do `sale-summary` atual | Medir largura renderizada real antes; se cortar, scroll interno (não alargar coluna — respeitar handoff) |
| `sale-type-selector` atual já faz papel do catálogo — encaixe não é trivial | Aceitar wrapping: `center` pode ser o próprio `sale-type-selector` por enquanto; cleanup em VUN-2.3 |
| Regressão em venda com convênio | Smoke manual obrigatório com convênio antes de abrir PR |

---

## Test plan

- **Smoke comercial manual** — 5 cenários AC4 (registrar em vídeo ou prints no PR).
- **Playwright** — se existir spec para `/vendas/nova`, deve passar sem alteração.
- **Visual snapshot** — 1440×900 target; comparar com handoff `design_handoff_nova_venda/`.

---

## Notas

- Esta é a primeira story VUN com risco comercial — revisão de @po antes de abrir PR é recomendada.
- Se algum componente atual recusar encaixe por width/layout, **documentar no PR** mas não alterar internals — fica para epic posterior.

---

*Gerada por @sm (River) · validada por @po (Pax) · AIOX VUN*
