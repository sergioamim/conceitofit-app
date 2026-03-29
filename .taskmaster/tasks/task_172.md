# Task ID: 172

**Title:** Melhorar acessibilidade (a11y) dos formularios e modais

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Acessibilidade em 7/10. Faltam aria-describedby, aria-live, skip-nav e focus trap em modais.

**Details:**

Adicionar aria-describedby nos campos de formularios com erro. Adicionar aria-live='polite' em status badges e loading states. Implementar skip-to-content link no layout (app). Auditar com Lighthouse Accessibility. Garantir score >= 90.

**Test Strategy:**

Lighthouse Accessibility score >= 90 nas paginas principais. axe-core sem violacoes criticas.
