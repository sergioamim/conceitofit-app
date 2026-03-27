# Task ID: 139

**Title:** Backend: API de audit log global (/admin/audit-log)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Implementar endpoints para registro e consulta de audit log global: listagem paginada de ações administrativas com filtros e endpoints de impersonation.

**Details:**

Endpoints:
1. GET /api/v1/administrativo/audit-log?page=0&size=50&action=&entityType=&startDate=&endDate=&userId= → { items: [{ id, timestamp, userId, userName, action, entityType, entityId, entityName, academiaId, academiaNome, tenantId, tenantNome, detalhes, ip }], total, page, size, hasNext }
2. POST /api/v1/administrativo/audit-log/usuarios/{userId}/impersonate body: { justificativa } → { token, expiresIn, impersonatedUserId }
3. POST /api/v1/administrativo/audit-log/impersonation/end → void
O audit log deve ser populado automaticamente por um interceptor/aspecto que registra ações de CRUD em entidades principais (academias, unidades, usuários, contratos). Impersonation gera token temporário (30min) com scope do usuário impersonado.

**Test Strategy:**

Executar ação de CRUD e verificar registro no audit log. Filtrar por entityType e período. Testar impersonation com token temporário.

## Subtasks

### 139.1. Criar modelo AuditLog e interceptor de ações

**Status:** pending  
**Dependencies:** None  

Entidade audit_log com registro automático de CRUDs via interceptor/aspecto

### 139.2. Criar endpoint de listagem com filtros paginados

**Status:** pending  
**Dependencies:** 139.1  

GET /audit-log com filtros por action, entityType, período, userId

### 139.3. Criar endpoints de impersonation com token temporário

**Status:** pending  
**Dependencies:** 139.1  

POST impersonate (gera token 30min) + POST end (invalida token)
