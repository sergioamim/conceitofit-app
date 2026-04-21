# Story VUN-3.2 — `payment-panel.tsx` com convênio/cupom/parcelas/NSU

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-3 — Painel Pagamento + Recibo Térmico |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | M |
| **Branch** | `feat/vun-3.2-payment-panel` |

---

## Contexto

PRD §8.1 define o painel de pagamento na coluna direita: carrinho visual (via `thermal-receipt` — VUN-3.1) + seção colapsável de convênio + cupom + total + grid de 12 parcelas + NSU obrigatório ≥4 dígitos (RN-005) + botão Finalizar dinâmico (RN-018).

---

## Problema / Objetivo

**Problema:** UI atual de `sale-summary` não expõe convênio/cupom colapsável, não tem grid de parcelas, nem NSU obrigatório.

**Objetivo:** novo painel unificado, substituindo `sale-summary` na coluna direita.

---

## Acceptance Criteria

1. **AC1** — Novo `src/app/(portal)/vendas/nova/components/payment-panel.tsx` renderiza, de cima para baixo:
   - `<ThermalReceipt variant="carrinho" />`
   - Seções colapsáveis: Convênio, Cupom
   - Total em destaque (fonte 28px, mono)
   - Grid de 12 parcelas (`1x` até `12x`) como botões tipo chip
   - Forma de pagamento (radio): Dinheiro, Crédito, Débito, PIX, Recorrente
   - Input NSU (aparece se crédito/débito)
   - Botão Finalizar dinâmico
2. **AC2 — RN-005** NSU obrigatório com **≥ 4 dígitos** para crédito/débito. Validação zod; botão Finalizar **desabilitado** se inválido.
3. **AC3 — RN-006** Parcelamento sem juros — valor da parcela = `total / n`. Label da parcela mostra `12× de R$ X`.
4. **AC4 — RN-018** Botão Finalizar exibe:
   - à vista: `Finalizar · R$ {total}`
   - parcelado: `Finalizar · {n}× R$ {valorParcela}`
5. **AC5** — Cupom aplicado atualiza `desconto` e refaz o total no `thermal-receipt`.
6. **AC6** — Marcar "Recorrente" desabilita grid de parcelas, NSU opcional, mas "não cobra" (PRD §5 fora de escopo).
7. **AC7** — `react-hook-form` + `zod` (CLAUDE.md).
8. **AC8** — A11y: labels, `aria-invalid`, anúncio de erro.
9. **AC9** — E2E: venda com crédito 12x → Finalizar → recibo abre.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/(portal)/vendas/nova/components/payment-panel.tsx` | Painel completo |
| `src/app/(portal)/vendas/nova/components/payment-panel.schema.ts` | Schema zod |
| `src/app/(portal)/vendas/nova/components/payment-panel.spec.tsx` | Testes |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/page.tsx` | Substituir `sale-summary` por `PaymentPanel` no slot `columnRight` |

---

## Tasks

- [ ] **T1** Criar schema zod do formulário (AC2, AC7)
- [ ] **T2** Implementar painel com seções (AC1)
- [ ] **T3** Grid de parcelas + label dinâmico (AC3, AC4)
- [ ] **T4** Lógica de cupom + desconto (AC5)
- [ ] **T5** Estado "Recorrente" (AC6)
- [ ] **T6** A11y (AC8)
- [ ] **T7** E2E Playwright (AC9)
- [ ] **T8** Substituir `sale-summary` no `page.tsx`

---

## Dependências

- **Bloqueadoras:** VUN-3.1
- **Desbloqueia:** VUN-3.3, VUN-4.x

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| RN-005 (NSU obrigatório) quebrar vendas em dinheiro/PIX | Alta | Alto | Validação zod condicional — NSU só é obrigatório para CREDITO/DEBITO |
| Cupom atual do backend ter shape diferente do esperado | Média | Médio | Spike no @dev antes de começar |
| Parcelamento com convênio ser excluído (regra atual?) | Média | Médio | Inspecionar `sale-summary` atual para entender regras existentes |

---

## Test plan

1. **Unit** schema zod: NSU obrigatório para crédito/débito, 4+ dígitos, cupom opcional.
2. **E2E** 3 cenários: à vista dinheiro, crédito 12×, PIX.
3. **Regressão** — vendas existentes funcionam.

---

*Gerada por @sm (River)*
