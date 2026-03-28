# Task ID: 142

**Title:** Migrar utilitários e tipos para shared

**Status:** done

**Dependencies:** 141 ✓

**Priority:** medium

**Description:** Mover utilitários, tipos e helpers genéricos para src/lib/shared e atualizar imports.

**Details:**

Mover access-control.ts, feature-flags.ts, types.ts, utils.ts, utils/*, formatters.ts, business-date.ts, ui-motion.ts, auth-redirect.ts, api/http.ts para src/lib/shared. Atualizar imports e manter re-exports temporários.

**Test Strategy:**

npm run lint e next build para checar resolução de tipos.
