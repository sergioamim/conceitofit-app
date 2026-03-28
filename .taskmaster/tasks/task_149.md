# Task ID: 149

**Title:** Refatorar layout do backoffice

**Status:** pending

**Dependencies:** 148 ⧖, 139 ✓

**Priority:** high

**Description:** Sidebar agrupada, ícones, breadcrumbs, header com modo e command palette.

**Details:**

Refatorar src/app/(backoffice)/admin/layout.tsx para usar BackofficeContextProvider e nav-items. Sidebar com agrupamento (Operacional, Comercial, Segurança, Configuração). Breadcrumbs, command palette dedicada (cmdk).

**Test Strategy:**

Navegar por /admin/* e validar sidebar, breadcrumbs e indicador de modo.
