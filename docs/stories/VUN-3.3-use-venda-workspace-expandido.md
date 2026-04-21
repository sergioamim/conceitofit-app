# Story VUN-3.3 — `use-venda-workspace.ts` expandido com `parcelas`, `autorizacao`, `canFinalize`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-3 — Painel Pagamento + Recibo Térmico |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | S |
| **Branch** | `feat/vun-3.3-use-venda-workspace` |

---

## Contexto

Com `PaymentPanel` (VUN-3.2) consumindo estado de parcelas + autorizacao + flag `canFinalize`, o hook central `hooks/use-venda-workspace.ts` precisa expor esses campos de forma canônica. PRD §8.1 detalha.

---

## Problema / Objetivo

**Problema:** `PaymentPanel` não tem lugar canônico para guardar NSU, número de parcelas, autorização — acopla estado local ao painel e dificulta teste.

**Objetivo:** centralizar no hook para que `page.tsx` → `PaymentPanel` → `ThermalReceipt` leiam mesma fonte.

---

## Acceptance Criteria

1. **AC1** — `use-venda-workspace.ts` expõe:
   ```ts
   type VendaWorkspace = {
     items: Item[];
     addItem(item): void;
     removeItem(id): void;
     subtotal: number;
     desconto: number;
     total: number;
     parcelamento: { n: number; valorParcela: number };
     setParcelamento(n: number): void;
     metodoPagamento: MetodoPagamento;
     setMetodoPagamento(m): void;
     autorizacao: { nsu?: string };
     setNsu(nsu: string): void;
     canFinalize: boolean; // true sse clientePresente (excluindo produto avulso) && NSU válido (se crédito/débito) && total > 0
     finalizar(): Promise<VendaResponse>;
   };
   ```
2. **AC2** — `canFinalize` respeita **RN-005** (NSU ≥ 4 dígitos para crédito/débito) e **RN-013** (plano/serviço exigem cliente; produto avulso OK sem cliente).
3. **AC3** — `finalizar()` chama endpoint existente de venda (confirmar rota) e retorna venda criada para a modal de recibo (VUN-4.x).
4. **AC4** — Testes unitários cobrem: canFinalize em todos combos; total correto com desconto; parcelamento.
5. **AC5** — `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` passam.
6. **AC6** — Zero regressão: venda existente via fluxos legados continua funcionando.

---

## Escopo técnico

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/hooks/use-venda-workspace.ts` | Expandir shape |
| `src/app/(portal)/vendas/nova/components/payment-panel.tsx` | Consumir novo shape |
| `src/app/(portal)/vendas/nova/hooks/__tests__/use-venda-workspace.spec.ts` | Testes ampliados |

---

## Tasks

- [ ] **T1** Ampliar shape do hook (AC1)
- [ ] **T2** Implementar `canFinalize` com regras (AC2)
- [ ] **T3** Implementar `finalizar()` usando endpoint existente (AC3)
- [ ] **T4** Refatorar `payment-panel.tsx` para consumir hook
- [ ] **T5** Testes unitários (AC4)
- [ ] **T6** Build/lint/typecheck/test (AC5)

---

## Dependências

- **Bloqueadoras:** VUN-3.2
- **Desbloqueia:** VUN-4.1

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| `finalizar()` usar rota diferente dependendo do tipo (plano/produto) | Média | Alto | Spike inventariar rotas atuais; se múltiplas, hook decide |
| `canFinalize` missar um caso edge | Média | Médio | Testes unitários em tabela (cada combinação) |

---

## Test plan

1. **Unit** em tabela: para cada combinação de (cliente, método, NSU, total), asserta valor correto de `canFinalize`.
2. **Integração** — render `PaymentPanel` conectado ao hook, simular fluxo.
3. **E2E** — venda crédito 12× com combo completo.

---

*Gerada por @sm (River)*
