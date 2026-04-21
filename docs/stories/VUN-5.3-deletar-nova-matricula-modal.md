# Story VUN-5.3 — Deleção total do `nova-matricula-modal.tsx` e todas referências

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Frontend) |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | S |
| **Branch** | `feat/vun-5.3-remove-nova-matricula-modal` |

---

## Contexto

PRD §8.1 Fase 5 é explícito: **deletar `src/components/shared/nova-matricula-modal.tsx` completamente + todas as referências**. E §12 Fase 5 Acceptance: "zero referência a `nova-matricula-modal` em `src/**` (grep confirma)".

Também aproveitar para remover `wizard-step-pagamento.tsx` e `sale-type-selector.tsx` se já estiverem órfãos após VUN-2.3 e VUN-5.1.

---

## Problema / Objetivo

**Problema:** duplicação viva = risco de deriva funcional.

**Objetivo:** apagar arquivos órfãos e confirmar grep limpo.

---

## Acceptance Criteria

1. **AC1** — Arquivo `src/components/shared/nova-matricula-modal.tsx` **deletado**.
2. **AC2** — `grep -r "nova-matricula-modal" src/` retorna **zero** ocorrências.
3. **AC3** — Verificar e, se órfãos, deletar:
   - `src/components/shared/novo-cliente-wizard/wizard-step-pagamento.tsx`
   - `src/app/(portal)/vendas/nova/components/sale-type-selector.tsx`
   - `src/app/(portal)/vendas/nova/components/sale-summary.tsx` (se substituído pelo `PaymentPanel`)
   - `src/app/(portal)/vendas/nova/components/cart-items.tsx` (se substituído pelo `ThermalReceipt`)
   - `src/app/(portal)/vendas/nova/components/plano-details.tsx` (se substituído pelo `CatalogPlanos`)
   - `src/app/(portal)/vendas/nova/components/client-and-item-selector.tsx` (se substituído pela busca universal)
   - `src/app/(portal)/vendas/nova/components/sale-header.tsx` (se substituído pelo header do `CockpitShell`)
4. **AC4** — Para cada arquivo removido em AC3: grep confirma zero referências.
5. **AC5** — `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` passam.
6. **AC6** — Smoke manual de 5 cenários comerciais (planos, serviços, produtos, combo, cancelamento) sem regressão.
7. **AC7** — PR tem descrição listando cada arquivo removido com justificativa/substituto.

---

## Escopo técnico

### Arquivos a remover

Ver AC1 + AC3. Quantidade estimada: 1 a 7 arquivos.

### Arquivos a alterar

- Qualquer arquivo que importe os removidos (grep guia).

---

## Tasks

- [ ] **T1** Grep completo `nova-matricula-modal`, `wizard-step-pagamento`, `sale-type-selector`, `sale-summary`, `cart-items`, `plano-details`, `client-and-item-selector`, `sale-header`
- [ ] **T2** Remover arquivos órfãos (AC1, AC3)
- [ ] **T3** Atualizar imports de quem eventualmente ainda referencia
- [ ] **T4** Build/lint/typecheck/test (AC5)
- [ ] **T5** Smoke manual 5 cenários (AC6)
- [ ] **T6** Descrição de PR (AC7)

---

## Dependências

- **Bloqueadoras:** VUN-1.3 (page migrada), VUN-2.3 (tab nova), VUN-3.2 (`PaymentPanel`), VUN-3.1 (`ThermalReceipt`), VUN-5.1 (wizard 3 CTAs), **e ≥14 dias em prod** conforme §13 do PRD
- **Desbloqueia:** — (última story frontend de consolidação)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Componente órfão ainda importado em lugar improvável (ex: teste, storybook) | Alta | Alto | Task T1 grep global (não só `src/`); bloquear merge se houver |
| Testes dos arquivos removidos ficam órfãos | Média | Baixo | Remover também `*.spec.tsx` correspondentes |
| Regressão comercial só aparecer em produção | Média | Alto | Janela de 14 dias em prod (VUN-1..VUN-4) já mitiga; smoke 5 cenários obrigatório |

---

## Test plan

1. **Smoke manual** AC6.
2. **Regressão** — todos os testes existentes passam.
3. **Grep** automático pós-remoção.

---

*Gerada por @sm (River)*
