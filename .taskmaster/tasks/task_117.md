# Task ID: 117

**Title:** Modularizar backoffice-seguranca.ts (31KB) por domínio

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Dividir src/lib/api/backoffice-seguranca.ts (31KB, maior API client do projeto) em módulos menores por domínio: gestão de usuários, perfis de acesso, capabilities/permissões e roles.

**Details:**

O arquivo concentra endpoints de usuários (CRUD, busca, bloqueio), perfis de acesso (CRUD, atribuição), capabilities (listagem, toggle), roles (CRUD, membership) e audit log. Separar em: backoffice-users.ts, backoffice-profiles.ts, backoffice-capabilities.ts e backoffice-roles.ts (ou similar). Criar barrel export em backoffice-seguranca/index.ts para manter compatibilidade de imports existentes. Atualizar consumers que importam diretamente do arquivo monolítico.

**Test Strategy:**

Rodar grep para confirmar que nenhum import aponta para o arquivo antigo. Verificar que as páginas /seguranca/rbac e /seguranca/acesso-unidade continuam funcionando. Build sem erros de tipo.

## Subtasks

### 117.1. Extrair endpoints de usuários para backoffice-users.ts

**Status:** done  
**Dependencies:** None  

Mover CRUD de usuários, busca, bloqueio e audit de usuários de backoffice-seguranca.ts para src/lib/api/backoffice-users.ts

### 117.2. Extrair endpoints de perfis para backoffice-profiles.ts

**Status:** done  
**Dependencies:** None  

Mover CRUD de perfis de acesso e atribuição para src/lib/api/backoffice-profiles.ts

### 117.3. Extrair endpoints de capabilities e roles para backoffice-roles.ts

**Status:** done  
**Dependencies:** None  

Mover listagem de capabilities, toggle, CRUD de roles e membership para src/lib/api/backoffice-roles.ts

### 117.4. Criar barrel export e atualizar consumers

**Status:** done  
**Dependencies:** 117.1, 117.2, 117.3  

Criar src/lib/api/backoffice-seguranca/index.ts com re-exports dos 3 módulos. Atualizar todos os imports nas pages e services que apontam para o arquivo antigo.
