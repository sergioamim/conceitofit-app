# Task ID: 168

**Title:** Remover formatters duplicados

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** formatCurrency definida em 3 lugares: formatters.ts (canonico), services.ts e adesao-landing-content.tsx.

**Details:**

Remover definicoes duplicadas de formatCurrency em src/lib/public/services.ts e src/app/(public)/adesao/adesao-landing-content.tsx. Importar de @/lib/formatters ou @/lib/shared/formatters. Verificar se ha outros formatters duplicados no codebase com grep.

**Test Strategy:**

Build OK. grep 'function formatCurrency' src/ retorna apenas 1 resultado em formatters.ts.
