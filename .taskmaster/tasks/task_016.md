# Task ID: 16

**Title:** Criar area global de seguranca no backoffice administrativo

**Status:** done

**Dependencies:** 9 ✓, 15 ✓

**Priority:** high

**Description:** Adicionar telas novas em `/admin/seguranca/*` para consulta global de usuarios administrativos, memberships e perfis por unidade.

**Details:**

O frontend ja possui as paginas contextuais `src/app/(app)/seguranca/rbac` e `src/app/(app)/seguranca/acesso-unidade`, mas elas operam por tenant e nao servem como backoffice global de rede. Este epico deve criar telas novas dentro do shell `/admin`, reaproveitando componentes, clients e padroes de UI das telas atuais quando fizer sentido, sem mover a pagina inteira.

**Test Strategy:**

Executar `npm run lint` e os testes da area de backoffice/seguranca cobrindo navegacao, carregamento e estados de erro.

## Subtasks

### 16.1. Auditar o que pode ser reaproveitado entre `/seguranca/*` e `/admin/*`

**Status:** done  
**Dependencies:** None  

Separar componentes e hooks reutilizaveis das telas contextuais antes de criar a nova area global.

**Details:**

Mapear `src/app/(app)/seguranca/rbac/page.tsx`, `src/app/(app)/seguranca/acesso-unidade/page.tsx`, `src/lib/api/rbac.ts` e o shell `src/app/(backoffice)/admin/*`, registrando o que pode virar componente compartilhado e o que precisa de tela nova.

### 16.2. Definir rotas, clients e modelos da seguranca global

**Status:** done  
**Dependencies:** 16.1  

Preparar a camada de consumo para os endpoints administrativos de seguranca do backend.

**Details:**

Criar adapters em `src/lib/api/*` e tipos para listagem global de usuarios, detalhe consolidado, memberships, perfis por unidade e origem do acesso, sem acoplar a tela ao contrato contextual atual de auth.

### 16.3. Adicionar navegacao e landing page de seguranca no backoffice

**Status:** done  
**Dependencies:** 16.2  

Criar a entrada da nova area global dentro do shell `/admin`.

**Details:**

Atualizar `src/app/(backoffice)/admin/layout.tsx` e criar a rota inicial `/admin/seguranca` com resumo, filtros principais e acesso a usuarios, preservando o padrao visual do backoffice existente.

### 16.4. Implementar listagem global de usuarios administrativos

**Status:** done  
**Dependencies:** 16.2, 16.3  

Entregar a primeira tela operacional da nova area de seguranca.

**Details:**

Criar `/admin/seguranca/usuarios` com filtros por nome, email, unidade, academia, status e perfil, reutilizando tabela paginada e estados de loading/erro ja padronizados no projeto.

### 16.5. Implementar detalhe consolidado de usuario e validar acesso elevado

**Status:** done  
**Dependencies:** 16.2, 16.4  

Fechar a visao global de memberships e perfis por unidade em uma pagina dedicada.

**Details:**

Criar `/admin/seguranca/usuarios/[id]` exibindo memberships ativos/inativos, unidade padrao, perfis por tenant e origem do acesso, com guard de permissao elevado e navegacao consistente do backoffice.
