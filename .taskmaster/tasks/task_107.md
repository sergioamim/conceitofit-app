# Task ID: 107

**Title:** Padronizar seleção visual de planos e integrar validação real de vouchers/cuponagem

**Status:** done

**Dependencies:** 106 ✓

**Priority:** medium

**Description:** Unificar a experiência de escolha de planos em todas as jornadas (pública e interna) e substituir a lógica simplificada de cupom em `vendas/nova` por uma integração real com o backend, respeitando regras de validade e aplicação.

**Details:**

Mapear os pontos de seleção de plano em `src/app/(public)/adesao/page.tsx`, `src/app/(public)/adesao/cadastro/page.tsx`, `src/app/(public)/adesao/checkout/page.tsx` e `src/app/(app)/vendas/nova/page.tsx`, criando um componente compartilhado (ex.: `src/components/shared/plano-selector-card.tsx`) que receba `Plano`, estado de seleção, badge de destaque e renderize preço/itens usando o cálculo centralizado (preferir o helper de dry-run da Task 106, mantendo compatibilidade com `getPublicPlanQuote` e `buildPlanoVendaItems`). Substituir o markup duplicado por esse componente, mantendo os fluxos com `react-hook-form` via `Controller` (cadastro/checkout) e o comportamento de clique no fluxo de venda interna. Para vouchers/cuponagem, criar uma chamada de validação real no backend (novo client em `src/lib/api/vendas.ts` ou módulo dedicado com `apiRequest`) e expor um service em `src/lib/comercial/runtime.ts` (ex.: `validarVoucherCodigoService`). Adicionar um tipo de resposta em `src/lib/types.ts` para representar o retorno de validação (percentual/valor de desconto, mensagem, escopo, restrições por plano/cliente, etc.) e atualizar `applyCupom` em `src/app/(app)/vendas/nova/page.tsx` para usar essa resposta, removendo a busca manual em `listVouchersService`/`listVoucherCodigosService` e respeitando regras de `planoIds`, `aplicarEm`, `umaVezPorCliente`, período e escopo conforme `docs/BUSINESS_RULES.md` e o gap descrito em `docs/prd.md`. Ajustar o payload de `createVendaService` para enviar `voucherCodigo` e os totais calculados com base na resposta do backend (incluindo `descontoTotal` e, se necessário, descontos por item), garantindo consistência visual no resumo e no recibo.

**Test Strategy:**

1) Verificar visualmente nas rotas públicas (`/adesao`, `/adesao/cadastro`, `/adesao/checkout`) e em `/vendas/nova` que os cards de plano possuem o mesmo layout, estado de seleção e informação de preço/itens. 2) Em `vendas/nova`, aplicar um cupom válido e confirmar que o desconto exibido corresponde ao retorno do backend e que mensagens de erro aparecem para cupons inválidos ou fora de escopo. 3) Finalizar uma venda com cupom aplicado e confirmar via inspeção de rede/log que `voucherCodigo` e `descontoTotal` são enviados no `createVendaService`, com recibo refletindo os valores. 4) Testar um cupom restrito por plano/cliente para garantir que a UI respeita o bloqueio retornado pela API.

## Subtasks

### 107.1. Criar componente compartilhado de seleção de plano

**Status:** done  
**Dependencies:** None  

Padronizar o card de plano e substituir marcação duplicada.

**Details:**

Criar `src/components/shared/plano-selector-card.tsx` com props para `plano`, `selected`, `destaque/badge` e `onSelect`, renderizando preço e itens via helper central (usar o dry-run da Task 106 se existir, mantendo compatibilidade com `getPublicPlanQuote` e `buildPlanoVendaItems`). Substituir o markup atual em `src/app/(public)/adesao/page.tsx`, `src/app/(public)/adesao/cadastro/page.tsx`, `src/app/(public)/adesao/checkout/page.tsx` e `src/app/(app)/vendas/nova/page.tsx`, preservando `Controller` do `react-hook-form` e o clique direto do fluxo interno.

### 107.2. Integrar validação real de voucher via API

**Status:** done  
**Dependencies:** 107.1  

Trocar a lógica simplificada por validação backend de voucher.

**Details:**

Adicionar tipo de resposta em `src/lib/types.ts` (ex.: `VoucherValidacaoResult` com percentual/valor de desconto, mensagem, escopo, planoIds, aplicarEm, umaVezPorCliente e período). Criar client em `src/lib/api/vendas.ts` ou módulo dedicado usando `apiRequest` para validar voucher, expondo `validarVoucherCodigoService` em `src/lib/comercial/runtime.ts`. Atualizar `use-commercial-flow.ts` para usar o service no `applyCupom`, remover `listVouchersService/listVoucherCodigosService`, aplicar regras de plano/cliente/período e ajustar `descontoTotal` e payload de `createVendaService` com `voucherCodigo` e descontos calculados.

### 107.3. Padronizar feedback de sucesso e recibo com voucher

**Status:** done  
**Dependencies:** 107.2  

Alinhar o recibo/sucesso aos novos descontos e seleção de plano.

**Details:**

Atualizar `src/components/shared/sale-receipt-modal.tsx` para exibir breakdown de desconto/voucher e mensagens padronizadas, garantindo consistência com o resumo da venda. Ajustar o `src/app/(app)/vendas/nova/page.tsx` para repassar dados de voucher e totais retornados do backend, mantendo a UI estável (sem valores dinâmicos no SSR).
