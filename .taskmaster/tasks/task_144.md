# Task ID: 144

**Title:** Migrar módulos do backoffice para src/lib/backoffice

**Status:** done

**Dependencies:** 141 ✓

**Priority:** medium

**Description:** Realocar APIs e lógica do backoffice para o domínio backoffice.

**Details:**

Mover admin-*, backoffice/*, backoffice.ts, security-*, importacao-evo.ts para src/lib/backoffice. Atualizar imports em ~15 páginas.

**Test Strategy:**

Acessar /admin e subrotas após a migração.
