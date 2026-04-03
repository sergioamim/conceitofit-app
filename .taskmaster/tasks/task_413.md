# Task ID: 413

**Title:** Alinhar guards, bootstrap e navegação ao tenant ativo do token

**Status:** done

**Dependencies:** 412 ✓

**Priority:** high

**Description:** Garantir que guards operacionais usem `activeTenantId` inicial do token enriquecido.

**Details:**

Escopo: ajustar bootstrap de contexto, guardas de navegação e redirecionamentos para respeitar o tenant ativo definido na sessão única. Verificar `useTenantContext`, `loadSessionBootstrapState` e guardas em layouts.

**Test Strategy:**

Simular sessão enriquecida e validar que o dashboard e páginas operacionais carregam diretamente no tenant correto.
