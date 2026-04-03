# Task ID: 355

**Title:** Corrigir composição do carrinho em Nova Venda e reabilitar finalização

**Status:** done

**Dependencies:** 348 ✓, 349 ✓, 351 ✓, 352 ✓

**Priority:** high

**Description:** Ajustar o fluxo de `Nova Venda` para que a seleção de plano/serviço/produto materialize itens no carrinho e habilite o CTA principal.

**Details:**

Escopo: `tests/e2e/comercial-fluxo.spec.ts` e os componentes de venda/carrinho. Evidência atual em `test-results/comercial-fluxo-Fluxo-come-5254f-rato-pendente-de-assinatura-chromium/error-context.md`: cliente e planos renderizados, porém `Itens da venda` permanece com `0 item(ns)` e o botão `Finalizar venda` segue desabilitado. Revisar a integração entre seleção do item, estado do carrinho, totalização e gating do submit. Investigar especialmente os componentes em `src/app/(app)/vendas/nova` e a composição compartilhada em `src/components/shared/checkout-payment.tsx` / `cart-items`. Fora de escopo: o resíduo de consistência do backend real após conversão comercial, já catalogado na Task 352.

**Test Strategy:**

Executar `tests/e2e/comercial-fluxo.spec.ts` em chromium e validar que, após selecionar cliente e plano, o carrinho contém ao menos um item e `Finalizar venda` fica habilitado. Depois rodar o smoke comercial real para confirmar que o frontend não bloqueia mais o fluxo antes da etapa dependente do backend.
