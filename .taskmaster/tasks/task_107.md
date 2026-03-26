# Task ID: 107

**Title:** Padronização de UX e Catálogo Comercial

**Status:** todo

**Dependencies:** 106

**Priority:** medium

**Description:** Padronizar componentes visuais de seleção de planos e integrar o motor de Vouchers/Cupons com o backend real.

**Details:**

Melhorar a experiência de uso unificando como o usuário escolhe planos e como os descontos por cupom são validados e aplicados.

**Test Strategy:**

Validar aplicação de cupons com diferentes regras (expirado, limite de uso, plano específico) via testes de integração.

## Subtasks

### 107.1. Criar Componente Unificado `PlanoSelector`

**Status:** todo
**Dependencies:** None

Criar um componente visual padrão (cards com destaque para "popular") para ser usado em todos os fluxos comerciais.

### 107.2. Evoluir Validação de Cupons (Vouchers)

**Status:** todo
**Dependencies:** None

Substituir o desconto fixo de 10% por uma chamada à API de Vouchers que valide quantidade, prazo e compatibilidade com o plano.

### 107.3. Padronizar Feedback de Sucesso e Recibo

**Status:** todo
**Dependencies:** None

Garantir que o `SaleReceiptModal` seja o padrão para confirmação de qualquer operação comercial que gere cobrança.
