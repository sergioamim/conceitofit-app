# Task ID: 411

**Title:** Adaptar camada de sessão para token único enriquecido

**Status:** done

**Dependencies:** 410 ✓

**Priority:** high

**Description:** Atualizar utilitários de sessão para suportar token único com `redeId` e `activeTenantId` ativos.

**Details:**

Escopo: ajustar leitura/gravação de sessão, persistência de `activeTenantId`, eventos e helpers de roles para operar sem troca de token entre backoffice e operacional. Manter compatibilidade com login administrativo existente.

**Test Strategy:**

Validar login admin e sessão operacional com mocks, garantindo que a sessão única persiste e dispara eventos de atualização.
