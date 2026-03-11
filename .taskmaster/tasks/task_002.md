# Task ID: 2

**Title:** Consolidar fluxo web de contratos, matricula e venda

**Status:** done

**Dependencies:** 1

**Priority:** high

**Description:** Ajustar telas administrativas e comerciais para o fluxo canonico de contratos, venda e matricula.

**Details:**

Abrange jornada de venda, assinatura administrativa, estados de contrato e convergencia com o backend.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 2.1. Mapear telas atuais de vendas, matrículas e modal

**Status:** done  
**Dependencies:** None  

Levantar fluxos, estados e componentes usados nas telas existentes.

**Details:**

Revisar `src/app/(app)/vendas`, `src/app/(app)/matriculas` e `src/components/shared/nova-matricula-modal.tsx` para identificar passos do fluxo, estados de contrato e dependências com mocks ou dados estáticos.

### 2.2. Alinhar estados de contrato com o backend

**Status:** done  
**Dependencies:** 2.1  

Garantir que estados e transições refletem o fluxo canônico.

**Details:**

Mapear estados atuais vs. estados do backend, ajustar enums e traduções de status, e garantir que telas administrativas exibem os estados corretos de contrato, venda e matrícula.

### 2.3. Ajustar criação de vendas e matrículas nos serviços

**Status:** done  
**Dependencies:** 2.2  

Atualizar chamadas e payloads para o fluxo oficial.

**Details:**

Rever serviços de criação/atualização de venda e matrícula, remover mocks, alinhar payloads com o contrato HTTP e garantir encadeamento correto entre venda, contrato e matrícula.

### 2.4. Revisar UX e estados visuais do fluxo comercial

**Status:** done  
**Dependencies:** 2.2  

Padronizar mensagens, badges e progressos do fluxo.

**Details:**

Atualizar componentes de UI para refletir o status canônico, ajustar rótulos e feedbacks do usuário, e garantir consistência entre telas administrativas e comerciais.

### 2.5. Cobrir testes e validações do fluxo consolidado

**Status:** done  
**Dependencies:** 2.3, 2.4  

Definir e executar testes do fluxo comercial end-to-end.

**Details:**

Criar checklist de cenários críticos (venda → contrato → matrícula), validar regressões visuais e funcionais, e documentar passos de verificação manual ou automatizada.
