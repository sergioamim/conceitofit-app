# Task ID: 124

**Title:** Backoffice: CRUD de planos de assinatura da plataforma

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Criar página /admin/financeiro/planos para gerenciar os planos que as academias contratam (Básico, Pro, Enterprise). CRUD completo com nome, preço mensal, ciclo (mensal/anual), limites (unidades, alunos, features incluídas) e status ativo/inativo.

**Details:**

Criar src/app/(backoffice)/admin/financeiro/planos/page.tsx com listagem em tabela (PaginatedTable), modal de criação/edição usando CrudModal, e toggles de ativo/inativo. Criar src/lib/api/admin-billing.ts com endpoints: listAdminPlanos, createAdminPlano, updateAdminPlano, toggleAdminPlano. Adicionar tipos PlanoPlataforma em src/lib/types.ts (id, nome, descricao, precoMensal, precoAnual, ciclo, maxUnidades, maxAlunos, featuresIncluidas[], ativo). Adicionar rota no nav do backoffice layout. Usar formatBRL para preços.

**Test Strategy:**

Criar, editar e desativar um plano. Verificar listagem com paginação. Confirmar que valores são exibidos em BRL.

## Subtasks

### 124.1. Criar tipos e API client para planos da plataforma

**Status:** pending  
**Dependencies:** None  

Adicionar PlanoPlataforma em types.ts e criar src/lib/api/admin-billing.ts com CRUD de planos

### 124.2. Criar página de listagem e CRUD de planos

**Status:** pending  
**Dependencies:** 124.1  

Criar /admin/financeiro/planos com PaginatedTable + CrudModal para criar/editar planos

### 124.3. Adicionar navegação e integrar no layout do backoffice

**Status:** pending  
**Dependencies:** 124.2  

Adicionar seção Financeiro no nav do backoffice com link para planos
