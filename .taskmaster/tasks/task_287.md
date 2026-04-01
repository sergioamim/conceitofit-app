# Task ID: 287

**Title:** Migrar jornada pública (adesão) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** low

**Description:** 4 páginas de adesão (trial, cadastro, checkout, pendências) usam useState para tenant options e form state.

**Details:**

Criar usePublicTenants() hook compartilhado. Mutations para submit. Draft state pode permanecer em context.

**Test Strategy:**

Tenant options carregam com cache. Submit funciona. Navegar entre etapas preserva dados.
