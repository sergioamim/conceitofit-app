# Task ID: 468

**Title:** Splitar catálogo de segurança backoffice (985 LOC) e user-detail-tabs (938 LOC)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Refatorar admin/seguranca/catalogo/page.tsx (985 LOC) e admin/seguranca/usuarios/[id]/user-detail-tabs.tsx (938 LOC).

**Details:**

catalogo/page.tsx: separar em CatalogoHeader (filtros), CatalogoGrid (cards de features), CatalogoFormModal (edição de feature). user-detail-tabs.tsx: separar cada tab em componente próprio: UserProfileOverview, UserProfilePermissions, UserProfileAuditLog, UserProfileTenants, UserProfileImpersonations. Pattern: cada tab é lazy-loaded com dynamic import.

**Test Strategy:**

Testes unitários de cada tab component. Teste E2E das páginas de segurança sem regressão.
