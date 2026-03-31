# Task ID: 209

**Title:** Refactor: Criar componente SuspenseFallback reutilizável

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** O mesmo fallback inline de Suspense é repetido em 80+ locais com div flex min-h-[60vh] "Carregando...". Extrair para componente.

**Details:**

Criar src/components/shared/suspense-fallback.tsx com props: height (default 60vh), message (default "Carregando..."), variant ("page" | "section" | "inline"). Substituir os fallbacks inline mais comuns. Manter consistência visual.

**Test Strategy:**

Componente renderiza corretamente em cada variante. Páginas migradas mantêm mesmo visual.
