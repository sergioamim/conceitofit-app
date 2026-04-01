# Task ID: 255

**Title:** Quebrar god hook use-contas-pagar-workspace.ts (534 LOC)

**Status:** done

**Dependencies:** 252 ✓

**Priority:** medium

**Description:** Workspace hook de contas a pagar concentra estado, fetching, filtros, modais e handlers em 534 linhas.

**Details:**

Extrair em hooks menores: useContasPagarData (fetching), useContasPagarFilters (filtros), useContasPagarModals (estado de modais), useContasPagarActions (handlers de criar/pagar/editar/cancelar). O workspace hook passa a compor os hooks extraídos.

**Test Strategy:**

Página funciona identicamente. Cada hook extraído é testável isoladamente.
