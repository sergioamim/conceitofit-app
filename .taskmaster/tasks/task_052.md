# Task ID: 52

**Title:** Implementar Perfis padronizados e Catálogo de funcionalidades

**Status:** done

**Dependencies:** 50, 51

**Priority:** high

**Description:** Dar superfície de governança para perfis reutilizáveis e para o inventário de capacidades do sistema.

**Details:**

Depois de resolver a operação por usuário, o frontend precisa expor com clareza a governança de papéis e funcionalidades: lista e detalhe de perfis, matriz de permissões, catálogo pesquisável, labels de negócio, criticidade e impacto de mudanças. Esta task entrega a camada visual que substitui a leitura crua de RBAC por feature/grant.

**Test Strategy:**

Cobrir a nova governança com testes de integração e E2E para lista, detalhe, filtros, edição e preview de impacto de perfis.

## Subtasks

### 52.1. Preparar clients e tipos de perfis padronizados, versões e funcionalidades

**Status:** done  
**Dependencies:** None

Atualizar a camada de contrato do frontend para a nova governança.

**Details:**

Evoluir types, normalizadores e API clients para suportar perfis versionados, escopo recomendado, criticidade, funcionalidades ligadas e indicadores de impacto.

### 52.2. Construir a tela de Perfis padronizados com resumo e histórico

**Status:** done  
**Dependencies:** 52.1

Governar papéis reutilizáveis sem expor apenas artefatos técnicos.

**Details:**

Criar a lista e o detalhe de perfis com nome amigável, objetivo, escopo recomendado, criticidade, histórico, usuários impactados e matriz de funcionalidades.

### 52.3. Implementar o Catálogo de funcionalidades com busca, filtros e criticidade

**Status:** done  
**Dependencies:** 52.1

Materializar a demanda de listar tudo que pode ser liberado no sistema.

**Details:**

Criar a tela do catálogo com filtros por módulo, ação, criticidade e escopo, exibindo nome amigável, código técnico, descrição e dependências.

### 52.4. Entregar edição visual da matriz de permissões com preview de impacto

**Status:** done  
**Dependencies:** 52.2, 52.3

Permitir ajuste de perfil com visibilidade real do efeito da mudança.

**Details:**

Implementar a matriz de funcionalidades por perfil com filtros, seleção controlada, preview de usuários/escopos afetados e reforço visual para mudanças sensíveis.

### 52.5. Cobrir perfis e catálogo com testes de regressão e contrato

**Status:** done  
**Dependencies:** 52.4

Fechar a trilha de confiança da nova governança fina de RBAC.

**Details:**

Adicionar testes para lista/detalhe de perfis, catálogo, filtros, matriz, preview de impacto e estados de erro, garantindo aderência ao contrato do backend.
