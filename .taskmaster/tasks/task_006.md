# Task ID: 6

**Title:** Criar jornada digital web de adesao e checkout

**Status:** pending

**Dependencies:** 1, 2

**Priority:** medium

**Description:** Implementar paginas e fluxos para trial, signup, checkout, formularios e contratos.

**Details:**

Inclui landing flow, formularios, selecao de plano, checkout e acompanhamento de pendencias.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 6.1. Mapear e criar rotas públicas da jornada

**Status:** pending  
**Dependencies:** None  

Definir as rotas públicas necessárias para landing, trial, signup e checkout.

**Details:**

Listar URLs, criar estrutura de páginas públicas e configurar layouts/guards para acesso não autenticado.

### 6.2. Implementar landing flow e seleção de plano

**Status:** pending  
**Dependencies:** 6.1  

Construir telas iniciais com conteúdo e escolha de plano.

**Details:**

Criar componentes de landing, cards de planos, pricing e CTAs, com navegação para o fluxo de adesão.

### 6.3. Desenvolver formulários de trial e cadastro

**Status:** pending  
**Dependencies:** 6.1  

Criar formulários de trial e signup com validações básicas.

**Details:**

Modelar campos, máscaras e validações, integrar com estado de formulário e mensagens de erro amigáveis.

### 6.4. Integrar checkout e contratos via API

**Status:** pending  
**Dependencies:** 6.2, 6.3  

Conectar fluxo de pagamento e aceite de contratos ao backend.

**Details:**

Consumir endpoints de checkout/contratos, tratar callbacks, estados de pagamento e confirmação de aceite.

### 6.5. Aplicar autenticação e branding por tenant

**Status:** pending  
**Dependencies:** 6.1  

Garantir identificação do tenant e personalização visual no funil.

**Details:**

Resolver tenant por domínio/param, aplicar tema/logotipo e garantir isolamento de dados no fluxo público.

### 6.6. Validar funil e cobrir testes essenciais

**Status:** pending  
**Dependencies:** 6.2, 6.3, 6.4, 6.5  

Finalizar validações e testes do fluxo ponta a ponta.

**Details:**

Revisar UX, mensagens de erro, estados de carregamento e adicionar testes críticos de navegação e API.
