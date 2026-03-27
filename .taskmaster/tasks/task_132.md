# Task ID: 132

**Title:** Backoffice: audit log global de ações administrativas

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar página /admin/audit-log com timeline de todas as ações administrativas realizadas no backoffice e nas academias: quem fez o quê, quando, em qual academia/unidade, com filtros por tipo de ação, período e usuário.

**Details:**

Criar src/app/(backoffice)/admin/audit-log/page.tsx com tabela paginada: timestamp, usuário, ação (criou/editou/excluiu/suspendeu), entidade (academia/unidade/usuário/contrato), detalhe, academia/unidade afetada. Filtros: período (date range), tipo de ação, academia, usuário. Criar endpoint listAuditLogs em src/lib/api/admin-audit.ts. Adicionar tipo AuditLogEntry em types.ts (id, timestamp, userId, userName, action, entityType, entityId, entityName, academiaId, academiaNome, tenantId, tenantNome, detalhes, ip). Usar formato de timeline visual similar ao ProspectTimeline.

**Test Strategy:**

Verificar que ações de CRUD no backoffice aparecem no log. Filtrar por academia e confirmar resultados. Filtrar por período.

## Subtasks

### 132.1. Criar tipos e API client para audit log

**Status:** done  
**Dependencies:** None  

AuditLogEntry em types.ts e listAuditLogs em admin-audit.ts

### 132.2. Criar página com tabela paginada e filtros

**Status:** done  
**Dependencies:** 132.1  

Tabela com timestamp, usuário, ação, entidade, academia. Filtros por período/tipo/academia/usuário.
