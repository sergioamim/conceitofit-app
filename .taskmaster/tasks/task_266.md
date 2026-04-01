# Task ID: 266

**Title:** Adicionar mais dynamic imports para code splitting

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Apenas 3 arquivos usam dynamic(). Componentes pesados como TipTap editor, modais complexos e gráficos poderiam ser lazy loaded.

**Details:**

Candidatos: RichTextEditor (TipTap), NovaContaPagarModal (704 LOC), wizard steps, gráficos do BI, Kanban do CRM. Usar next/dynamic com ssr: false para componentes client-only pesados.

**Test Strategy:**

Bundle size reduz. Lighthouse performance score melhora. Funcionalidades continuam funcionando.
