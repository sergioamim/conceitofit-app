# Task ID: 9

**Title:** Estruturar backoffice global de academias e unidades

**Status:** done

**Dependencies:** 1, 3, 7

**Priority:** medium

**Description:** Migrar `/admin`, `/admin/academias` e `/admin/unidades` para contratos reais, sem depender de mock services.

**Details:**

Cobrir dashboard, listagens, detalhe, create/update de academia, create/update/toggle de unidade, vinculo academia -> unidade e alinhamento entre payloads do backoffice e o backend.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 9.1. Auditar rotas de backoffice e dependencias em mock

**Status:** done  
**Dependencies:** None  

Mapear onde o backoffice ainda depende de `mock/services` e stores locais.

**Details:**

Inventariar `/admin`, `/admin/academias`, `/admin/academias/[id]` e `/admin/unidades`, registrando chamadas a `listAcademias`, `listTenantsGlobal`, `createAcademia`, `createTenant` e afins, alem de estados persistidos localmente.

### 9.2. Especificar contratos reais e estados de UI do backoffice

**Status:** done  
**Dependencies:** 9.1  

Definir modelos, carregamento e erros para as telas administrativas globais.

**Details:**

Alinhar tipos, requests e responses com as APIs administrativas do backend, incluindo lista/detalhe de academia, lista/detalhe de unidade, onboarding inicial e regras de permissao.

### 9.3. Migrar dashboard e listagens globais para API real

**Status:** done  
**Dependencies:** 9.2  

Conectar o dashboard do backoffice e as tabelas principais aos contratos reais.

**Details:**

Substituir lookups em mock no dashboard admin e nas listagens de academias/unidades por clients em `src/lib/api/*`, com loading, erro, paginação e filtros consistentes.

### 9.4. Migrar cadastro e detalhe de academias

**Status:** done  
**Dependencies:** 9.2, 9.3  

Implementar create/list/detail/update de academia no backoffice.

**Details:**

Refatorar `/admin/academias` e `/admin/academias/[id]` para operar com contratos reais, preservando busca, contagem de unidades e feedbacks de sucesso/erro.

### 9.5. Migrar cadastro e gestao de unidades

**Status:** done  
**Dependencies:** 9.2, 9.3, 9.4  

Conectar a tela de unidades ao backend administrativo real.

**Details:**

Refatorar `/admin/unidades` para create/edit/toggle/delete reais, corrigindo divergencias de payload como `groupId` e configuracoes, e exibindo o vinculo explicito com a academia.

### 9.6. Fechar guardas, navegacao e testes do backoffice

**Status:** done  
**Dependencies:** 9.3, 9.4, 9.5  

Validar acesso, navegacao e cenarios principais do administrativo global.

**Details:**

Aplicar guardas/permissoes para a area global, revisar rotas e estados vazios, e criar testes basicos de navegacao/renderizacao para o backoffice.
