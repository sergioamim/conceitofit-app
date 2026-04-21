# Story VUN-2.3 — Tab segmented substituindo `sale-type-selector` (combo livre RN-011)

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-2 — Catálogo + Busca Universal |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | S |
| **Branch** | `feat/vun-2.3-tab-combo-livre` |

---

## Contexto

Hoje `src/app/(portal)/vendas/nova/hooks/use-venda-workspace.ts` linhas 82-90 executam `clearCart()` ao trocar entre tabs PLANO/SERVIÇO/PRODUTO — isso impede combo livre. PRD §12 Fase 2 e **RN-011** exigem que tabs sejam apenas filtros do catálogo, **sem zerar carrinho**.

Esta story troca `sale-type-selector` por tabs controladas na coluna central, orquestra qual catálogo renderizar com base na tab ativa, e **remove** o `clearCart` do effect atual.

---

## Problema / Objetivo

**Problema:** atendente não consegue vender "plano anual + avaliação física + 2 shakes" em 1 transação — troca de tab limpa carrinho.

**Objetivo:** combo livre funcional (RN-011) sem regressão nos fluxos atuais.

---

## Acceptance Criteria

1. **AC1** — Substituir `sale-type-selector.tsx` por tab segmented (shadcn `Tabs` ou equivalente) com 3 tabs: PLANO (default), SERVIÇO, PRODUTO.
2. **AC2** — Tab controla **somente** qual catálogo é renderizado na coluna central (VUN-2.2).
3. **AC3** — Trocar tab **NÃO** zera o carrinho. Carrinho preserva todos os itens anteriores.
4. **AC4** — Remover `clearCart()` em `use-venda-workspace.ts` linhas 82-90 que estava vinculado à troca de tab.
5. **AC5** — Teste E2E valida RN-011: adicionar plano → trocar pra PRODUTO → adicionar produto → trocar pra SERVIÇO → adicionar serviço → carrinho tem 3 itens.
6. **AC6** — Finalização funciona com combo (soma total correta, parcelas aplicadas sobre total agregado).
7. **AC7** — `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` passam.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/(portal)/vendas/nova/components/catalog-tabs.tsx` | Client Island com tabs controladas |

### Arquivos a alterar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/app/(portal)/vendas/nova/hooks/use-venda-workspace.ts` | Editar | Remover `clearCart` do effect de mudança de tipo (linhas 82-90) |
| `src/app/(portal)/vendas/nova/page.tsx` | Editar | Injetar `catalog-tabs.tsx` no slot `columnCenter`; remover `sale-type-selector` |

### Arquivos a remover nesta story

- Nenhum. `sale-type-selector.tsx` fica para VUN-5.3 (limpeza final).

---

## Tasks

- [ ] **T1** Criar `catalog-tabs.tsx` com 3 tabs (AC1)
- [ ] **T2** Orquestrar render do catálogo correto por tab (AC2)
- [ ] **T3** Remover `clearCart` em `use-venda-workspace.ts` linhas 82-90 (AC4)
- [ ] **T4** Integrar em `page.tsx` (AC1)
- [ ] **T5** E2E de combo livre (AC5)
- [ ] **T6** E2E de finalização com combo (AC6)
- [ ] **T7** Build/lint/typecheck/test (AC7)

---

## Dependências

- **Bloqueadoras:** VUN-2.1, VUN-2.2
- **Desbloqueia:** toda a Epic VUN-3 (painel de pagamento precisa lidar com combo)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Remoção do `clearCart` quebrar edge case não óbvio | Média | Alto | Revisar git blame das linhas 82-90 para entender motivação original antes de remover; testes E2E de 4 cenários |
| Total/parcelamento assumir 1 item por venda | Baixa | Médio | Verificar se `use-venda-workspace` soma carrinho corretamente; se não, abrir sub-story |

---

## Test plan

1. **E2E** RN-011: adicionar plano → tab PRODUTO → adicionar produto → tab SERVIÇO → adicionar serviço → carrinho com 3.
2. **E2E** finalização: combo plano+produto+serviço, total correto no recibo.
3. **Regressão** testes existentes de venda.

---

*Gerada por @sm (River)*
