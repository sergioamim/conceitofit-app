# Task ID: 433

**Title:** Criar hooks de busca async para Academia e Unidade (SuggestionInput)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Hooks useAcademiaSuggestion e useUnidadeSuggestion que retornam options/onFocusOpen compatíveis com SuggestionInput, usando TanStack Query.

**Details:**

Criar src/backoffice/lib/use-academia-suggestion.ts e src/backoffice/lib/use-unidade-suggestion.ts. useAcademiaSuggestion: busca academias via API existente do backoffice (admin-academias.ts), retorna { options: SuggestionOption[], onFocusOpen: () => Promise<void>, isLoading }. useUnidadeSuggestion(academiaId?: string): busca unidades filtradas opcionalmente por academia. Ambos mapeiam resultado para SuggestionOption[] (id, label com nome da academia/unidade, searchText com CNPJ/cidade para busca secundária). Usar TanStack Query com staleTime de 5min. Caps de 50 resultados. Incluir testes unitários mockando as APIs.

**Test Strategy:**

Testes unitários: mockando APIs com msw ou vi.fn, verificar que hooks retornam options mapeados corretamente, que onFocusOpen dispara a query, que isLoading reflete estado correto, e que useUnidadeSuggestion filtra por academiaId.
