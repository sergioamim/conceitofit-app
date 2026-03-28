# Task ID: 146

**Title:** Reorganizar hooks por domínio

**Status:** done

**Dependencies:** 142 ✓, 143, 144 ✓, 145 ✓

**Priority:** medium

**Description:** Mover hooks específicos de tenant/backoffice para suas áreas.

**Details:**

Mover use-commercial-flow para src/lib/tenant/hooks. Manter hooks genéricos em src/hooks (use-confirm-dialog, use-crud-operations, etc.). Atualizar imports em componentes.

**Test Strategy:**

npm run lint e validar páginas que usam hooks migrados.
