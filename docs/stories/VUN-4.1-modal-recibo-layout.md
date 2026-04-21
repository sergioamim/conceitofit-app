# Story VUN-4.1 — Reescrita do `sale-receipt-modal.tsx` layout 820×560

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-4 — Modal Recibo Upgrade |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | M |
| **Branch** | `feat/vun-4.1-modal-recibo-layout` |

---

## Contexto

PRD §12 Fase 4 exige reescrita do modal pós-venda em `src/components/shared/sale-receipt-modal.tsx` com layout 820×560 (térmico à esquerda + ações à direita), reusando `ThermalReceipt` (VUN-3.1) — **RN-017** proíbe divergência visual entre carrinho e modal.

---

## Problema / Objetivo

**Problema:** modal atual não segue o handoff e duplica renderização.

**Objetivo:** layout pixel-perfect, reuso total do recibo térmico.

---

## Acceptance Criteria

1. **AC1** — Modal 820×560 (fixed size; responsivo cai para full-screen < 860px de viewport).
2. **AC2** — Coluna esquerda reusa `<ThermalReceipt variant="modal" />` com mesmo conjunto de props que o carrinho da venda finalizada.
3. **AC3** — Coluna direita tem, de cima para baixo:
   - Badge "Venda Aprovada" (verde)
   - Valor total em destaque (fonte 32px, mono)
   - Parcelamento visível (se aplicável)
   - Input e-mail pré-preenchido com e-mail do cliente
   - Botão "Enviar por e-mail"
   - Card "Impressora Térmica" com status e botão "Imprimir"
   - Atalhos: PDF / WhatsApp / 2ª via
   - Botão "Nova venda"
4. **AC4** — Modal abre automaticamente ao sucesso de `finalizar()` (VUN-3.3) passando a venda criada como prop.
5. **AC5** — Teste visual pixel-perfect no handoff (comparar com referência do diretório `references/`).
6. **AC6** — `npm run build/lint/typecheck/test` passam.

---

## Escopo técnico

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/components/shared/sale-receipt-modal.tsx` | Reescrever layout |

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/shared/sale-receipt-modal.spec.tsx` | Testes |

---

## Tasks

- [ ] **T1** Criar esqueleto 820×560 + colunas (AC1, AC3)
- [ ] **T2** Plugar `ThermalReceipt` à esquerda (AC2)
- [ ] **T3** Wiring com `finalizar()` → abrir modal com venda real (AC4)
- [ ] **T4** Snapshot Playwright pixel-perfect (AC5)
- [ ] **T5** Build/lint/typecheck/test (AC6)

---

## Dependências

- **Bloqueadoras:** VUN-3.1, VUN-3.3
- **Desbloqueia:** VUN-4.2

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| 820×560 fixo quebrar em tablets verticais | Baixa | Baixo | Fallback fullscreen <860px (AC1) |
| E-mail do cliente ausente → input em branco | Média | Baixo | Placeholder "cliente@exemplo.com" + validação no send |

---

## Test plan

1. **Unit** — render modal com mock de venda.
2. **Visual** — snapshot pixel-perfect.
3. **Regressão** — modal atual continua funcionando quando não chamada explicitamente pela nova venda (fluxos legados, até remoção na VUN-5.3).

---

*Gerada por @sm (River)*
