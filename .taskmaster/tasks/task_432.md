# Task ID: 432

**Title:** Criar componente TableFilters padronizado

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Componente declarativo de filtros inline para PaginatedTable, com sincronização de URL search params e suporte a text, suggestion, select, date-range e status-badge.

**Details:**

Criar src/components/shared/table-filters.tsx. Aceita array de FilterConfig com tipos: text (busca textual com debounce 300ms), suggestion (SuggestionInput para entidades — usa onFocusOpen), select (para enums pequenos fixos como status com 3-5 opções), date-range (dois DatePicker start/end), status-badge (filtro visual com badges clicáveis). Sincronizar com URL search params via useSearchParams para deep-linking. Botão "Limpar filtros" visível quando há filtros ativos. Renderizar inline em row flexbox responsivo (wrap em mobile). Emitir onFiltersChange com objeto de filtros ativos. SSR-safe: sem valores dinâmicos no render inicial — filtros lidos de searchParams. Incluir testes unitários.

**Test Strategy:**

Testes unitários: renderizar com diferentes FilterConfig, verificar que cada tipo monta o componente correto, que mudanças atualizam searchParams, que limpar filtros reseta tudo, e que onFiltersChange emite corretamente.
