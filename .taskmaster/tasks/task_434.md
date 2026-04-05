# Task ID: 434

**Title:** Migrar seleção de academia na página de BI para SuggestionInput

**Status:** done

**Dependencies:** 433 ✓

**Priority:** high

**Description:** Substituir <Select> de academia em /admin/bi por SuggestionInput com busca async.

**Details:**

Em src/app/(backoffice)/admin/bi/page.tsx, localizar o <Select> usado para filtrar por academia. Substituir por SuggestionInput usando useAcademiaSuggestion. Manter comportamento de filtro de dados ao selecionar academia. Garantir que estado do filtro funcione com o restante da página.

**Test Strategy:**

Teste manual: abrir /admin/bi, verificar que SuggestionInput aparece, buscar academia por nome, selecionar e verificar que dados filtram corretamente.
