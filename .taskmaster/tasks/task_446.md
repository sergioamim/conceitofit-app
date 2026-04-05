# Task ID: 446

**Title:** Implementar sidebar colapsável no layout do backoffice

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Tornar a sidebar fixa w-72 em colapsável (w-16 ícones) com responsividade mobile via Drawer.

**Details:**

Em src/app/(backoffice)/admin/layout.tsx, a sidebar é fixa w-72 sem responsividade. Implementar: (1) Toggle manual (botão chevron) para colapsar a w-16 (apenas ícones dos nav-items), (2) Auto-collapse em breakpoints < lg (1024px), (3) Em < md (768px), sidebar como Sheet/Drawer overlay com botão hamburger no header, (4) Persistir preferência de colapsado em localStorage via useEffect (SSR-safe — não ler no render), (5) Animação suave com transition-all duration-200 (respeitar prefers-reduced-motion via motion-safe:), (6) Tooltips nos ícones quando colapsada usando Tooltip do shadcn. Manter command palette (Cmd+K) e breadcrumbs funcionando em ambos estados. Manter mode badge (platform vs tenant) visível.

**Test Strategy:**

Teste manual: redimensionar janela para verificar breakpoints, testar toggle manual, verificar tooltips, verificar persistência de preferência, testar Drawer mobile. Teste E2E: verificar que sidebar colapsada não quebra navegação.
