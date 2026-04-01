# Task ID: 278

**Title:** Migrar páginas administrativo CRUD para TanStack Query (batch)

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** 10 páginas administrativo usam o mesmo padrão: list+create+update+toggle. Arquivos: contas-bancarias, maquininhas, tipos-conta, atividades-grade, unidades, catraca-status, conciliacao-bancaria, nfse, ia, integracoes.

**Details:**

Criar hook genérico useAdminCrud<T>(config) ou hooks individuais por domínio. Usar useMutation com invalidação. Padrão: query key ["admin", domain, tenantId], staleTime 5min.

**Test Strategy:**

CRUD funciona em todas as 10 páginas. Toggle ativo/inativo invalida. Navegar e voltar usa cache.

## Subtasks

### 278.1. Desenvolver hook genérico useAdminResource

**Status:** done  
**Dependencies:** None  

Implementar um hook reutilizável useAdminResource<T> para gerenciar as operações CRUD (listagem, criação, atualização e alternância de status) de recursos administrativos, utilizando o TanStack Query.

**Details:**

O hook deve encapsular useQuery para a operação de listagem e useMutation para as operações de criação, atualização e toggle de status. É fundamental que o hook garanta a invalidação adequada do cache após mutações bem-sucedidas. A query key padrão deve seguir o formato ["admin", domain, tenantId] e o staleTime configurado para 5 minutos. Considerar a flexibilidade para configurar endpoints de API e transformações de dados.

### 278.2. Migrar Contas Bancárias, Maquininhas e Tipos de Conta

**Status:** done  
**Dependencies:** 278.1  

Refatorar as páginas administrativas de "Contas Bancárias", "Maquininhas" e "Tipos de Conta" para utilizarem o hook genérico useAdminResource, substituindo as implementações de gerenciamento de estado e chamadas de API existentes pelo TanStack Query.

**Details:**

Para cada uma das três páginas, identificar os componentes responsáveis pelas operações de listagem, criação, edição e toggle de status. Adaptar esses componentes para consumir os dados e manipular as ações através do useAdminResource, passando as configurações específicas de cada domínio.

### 278.3. Migrar Atividades de Grade, Unidades e Catraca Status

**Status:** done  
**Dependencies:** 278.1  

Refatorar as páginas administrativas de "Atividades de Grade", "Unidades" e "Catraca Status" para utilizarem o hook genérico useAdminResource, substituindo as implementações de gerenciamento de estado e chamadas de API existentes pelo TanStack Query.

**Details:**

Para cada uma das três páginas, identificar os componentes responsáveis pelas operações de listagem, criação, edição e toggle de status. Adaptar esses componentes para consumir os dados e manipular as ações através do useAdminResource, passando as configurações específicas de cada domínio.

### 278.4. Migrar Conciliação Bancária, NFSe, IA e Integrações

**Status:** done  
**Dependencies:** 278.1  

Refatorar as páginas administrativas de "Conciliação Bancária", "NFSe", "IA" e "Integrações" para utilizarem o hook genérico useAdminResource, substituindo as implementações de gerenciamento de estado e chamadas de API existentes pelo TanStack Query.

**Details:**

Para cada uma das quatro páginas, identificar os componentes responsáveis pelas operações de listagem, criação, edição e toggle de status. Adaptar esses componentes para consumir os dados e manipular as ações através do useAdminResource, passando as configurações específicas de cada domínio.

### 278.5. Finalizar exportações e realizar testes de integração completos

**Status:** done  
**Dependencies:** 278.2, 278.3, 278.4  

Garantir que todos os hooks e componentes migrados estejam corretamente exportados e acessíveis. Realizar uma bateria de testes de integração abrangentes em todas as 10 páginas administrativas para validar a funcionalidade completa de CRUD e toggle após a migração para TanStack Query.

**Details:**

Verificar a estrutura de arquivos e exportações para assegurar que não há problemas de importação/exportação. Conduzir testes de aceitação do usuário (UAT) ou testes end-to-end (E2E) em um ambiente de homologação. Focar na cobertura de cenários de edge cases e interações complexas entre as funcionalidades.
