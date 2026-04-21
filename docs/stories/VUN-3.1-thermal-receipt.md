# Story VUN-3.1 — `thermal-receipt.tsx` componente reusável

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
| **Branch** | `feat/vun-3.1-thermal-receipt` |

---

## Contexto

**RN-017 (PRD §11):** "Recibo térmico é componente único (`thermal-receipt.tsx`). Carrinho no cockpit e modal pós-venda compartilham a mesma renderização; divergência é bug."

Esta story cria o componente visual: papel creme (`--receipt-paper`), bordas picotadas, cabeçalho com nome da academia (do tenant), itens do carrinho, total, forma de pagamento. Usado imediatamente no carrinho (coluna direita do cockpit, VUN-3.2) e depois no modal pós-venda (VUN-4.1).

---

## Problema / Objetivo

**Problema:** visual do recibo atual (`sale-summary`) não é papel térmico; modal pós-venda atual não reusa nada.

**Objetivo:** componente único, altamente reusável, estilizado conforme handoff §2.2 e §10.1.

---

## Acceptance Criteria

1. **AC1** — Novo arquivo `src/components/shared/thermal-receipt.tsx` exporta `ThermalReceipt` (Client Component) com props tipadas:
   ```ts
   type ThermalReceiptProps = {
     items: Array<{ id: string; nome: string; qtd: number; valorUnit: number; valorTotal: number }>;
     subtotal: number;
     desconto?: number;
     total: number;
     parcelamento?: { n: number; valorParcela: number };
     cupomAplicado?: string;
     convenio?: string;
     metodoPagamento?: "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX" | "RECORRENTE";
     cabecalho: { academiaNome: string; cnpj?: string; endereco?: string };
     rodape?: string;
     variant: "carrinho" | "modal";
   };
   ```
2. **AC2** — Background `var(--receipt-paper)`, fonte mono (`font-mono` via VUN-1.1) em valores e CPF.
3. **AC3** — Bordas com efeito picotado (CSS mask ou SVG). Top e bottom com serrilhado.
4. **AC4** — Layout vertical: cabeçalho → divider → itens (qtd × unit = total) → divider → subtotal → desconto → total em destaque → forma de pagamento → parcelamento (se aplicável) → rodapé.
5. **AC5** — Valores formatados em BRL com `Intl.NumberFormat` apenas em handlers/effects (seguir CLAUDE.md hydration — `new Date()`/formatação dinâmica não pode estar no render inicial; usar prop serializada do parent).
6. **AC6** — `variant="carrinho"` ocupa altura flexível; `variant="modal"` tem altura fixa pro modal 820×560.
7. **AC7** — A11y: `role="region"` + `aria-label="Recibo da venda"`.
8. **AC8** — Teste unitário + snapshot visual dos 2 variants.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/shared/thermal-receipt.tsx` | Componente principal |
| `src/components/shared/thermal-receipt.spec.tsx` | Testes |

### Dependências de libs

- Nenhuma nova. Usa Tailwind + tokens VUN-1.1.

---

## Tasks

- [ ] **T1** Criar componente com tipos (AC1)
- [ ] **T2** Implementar papel creme + bordas picotadas (AC2, AC3)
- [ ] **T3** Layout interno completo (AC4)
- [ ] **T4** Formatação BRL **safe pra SSR** (AC5)
- [ ] **T5** Variants carrinho/modal (AC6)
- [ ] **T6** A11y (AC7)
- [ ] **T7** Testes + snapshots (AC8)

---

## Dependências

- **Bloqueadoras:** VUN-1.1
- **Desbloqueia:** VUN-3.2 (carrinho), VUN-4.1 (modal)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Efeito picotado variar entre browsers | Média | Baixo | Testar Chrome/Firefox/Safari; fallback `border-dashed` |
| Formatação BRL causar hydration mismatch | Média | Alto | Seguir CLAUDE.md hydration: receber valores já formatados como string do parent OU usar `useEffect` |
| Componente muito rígido pra modal 820×560 | Baixa | Baixo | Variant prop resolve |

---

## Test plan

1. **Unit** render variants carrinho/modal + 3 itens.
2. **Snapshot visual** Playwright.
3. **Hidratação** — montar em dev server e confirmar zero warning.

---

*Gerada por @sm (River)*
