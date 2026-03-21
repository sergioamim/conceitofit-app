# Task ID: 57

**Title:** Implementar bootstrap de sessão por Rede com unidade ativa separada da unidade-base

**Status:** done

**Dependencies:** 56 ✓

**Priority:** high

**Description:** Ajustar o frontend para tratar unidade-base do cliente e tenant ativo de sessão como conceitos distintos.

**Details:**

A aplicação precisa deixar de assumir que a unidade do cliente e a unidade ativa da sessão são a mesma coisa. Esta task fecha bootstrap, stores, guards e componentes base para operar com `tenantId` estrutural do cliente e `activeTenantId` temporário de sessão.

**Test Strategy:**

Cobrir bootstrap, troca de contexto e navegação autenticada com testes de integração do frontend e E2E básicos.

## Subtasks

### 57.1. Atualizar o bootstrap autenticado para receber rede, unidade-base e tenant ativo

**Status:** done  
**Dependencies:** None  

Consumir a nova carga mínima do backend após o login.

**Details:**

Revisar a hidratação inicial da sessão para armazenar rede corrente, unidade-base do cliente, tenant ativo resolvido e unidades elegíveis.

### 57.2. Separar no estado global `tenantId` estrutural e `activeTenantId` de sessão

**Status:** done  
**Dependencies:** 57.1  

Evitar que a UI trate a unidade-base como contexto temporário.

**Details:**

Refatorar stores, contextos e hooks para que a unidade-base continue visível como referência estrutural, enquanto a unidade ativa da experiência fica em estado específico de sessão.

### 57.3. Ajustar guards, providers e resolução de contexto para o tenant ativo

**Status:** done  
**Dependencies:** 57.2  

Fazer toda a aplicação autenticada usar a unidade ativa correta.

**Details:**

Revisar interceptors, providers de contexto, persistência local e guards de rota para enviar o tenant ativo da sessão nas chamadas operacionais.

### 57.4. Exibir na UI a distinção entre unidade-base e unidade ativa quando necessário

**Status:** done  
**Dependencies:** 57.1, 57.2  

Dar clareza de produto sem poluir a experiência principal.

**Details:**

Adicionar labels, tooltips ou resumos discretos nos pontos críticos para explicar quando a unidade-base do cliente difere do tenant ativo da sessão.

### 57.5. Implementar a troca do tenant ativo da sessão usando o novo contrato

**Status:** done  
**Dependencies:** 57.2, 57.3  

Permitir mudança controlada do contexto operacional no frontend.

**Details:**

Consumir o endpoint de troca de tenant ativo, atualizar caches, invalidar consultas e refletir a mudança na navegação e nas superfícies operacionais.

### 57.6. Cobrir regressão do bootstrap e troca de contexto

**Status:** done  
**Dependencies:** 57.3, 57.4, 57.5  

Garantir estabilidade do estado autenticado no novo modelo.

**Details:**

Adicionar testes para bootstrap bem-sucedido, tenant ativo inicial, troca de contexto e persistência correta entre telas e refresh.
