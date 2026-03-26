# Task ID: 106

**Title:** Unificação da Arquitetura Comercial (Dry-Run de Regras)

**Status:** todo

**Dependencies:** None

**Priority:** high

**Description:** Eliminar a tripla implementação de lógica de planos, descontos e convênios entre Nova Venda, Wizard de Cliente e Modal de Matrícula.

**Details:**

Atualmente, a lógica de cálculo de planos (anuidade, parcelas, convênios) está duplicada em três lugares diferentes. Esta task visa extrair essa inteligência para hooks e componentes compartilhados.

**Test Strategy:**

Testes unitários para o novo hook de cálculo de contrato e testes E2E garantindo que o valor final é idêntico nos três pontos de entrada.

## Subtasks

### 106.1. Criar Hook Central de Lógica Comercial (`useCommercialFlow`)

**Status:** todo
**Dependencies:** None

Extrair cálculos de `buildPlanoVendaItems`, descontos de convênio e lógica de anuidade para um hook único.

### 106.2. Refatorar `NovaVendaPage` para usar o novo hook

**Status:** todo
**Dependencies:** 106.1

Substituir cálculos locais na página de venda pela implementação centralizada.

### 106.3. Refatorar `NovoClienteWizard` para usar o novo hook

**Status:** todo
**Dependencies:** 106.1

Eliminar a duplicação de lógica no step de planos e pagamentos do Wizard de novo cliente.

### 106.4. Refatorar `NovaMatriculaModal` para usar o novo hook

**Status:** todo
**Dependencies:** 106.1

Garantir que o modal de matrícula de aluno existente utilize a mesma regra de cálculo da venda canônica.
