# Task ID: 458

**Title:** Frontend: Migrar leitura/escrita de sessão para cookies HttpOnly

**Status:** pending

**Dependencies:** 457

**Priority:** high

**Description:** Refatorar session.ts e token-store.ts para ler tokens de cookies (não localStorage) e usar apenas cookie de claims para metadados client-side.

**Details:**

Substituir readStorageToken('academia-auth-token') por leitura de cookie document.cookie. Modificar saveAuthSession() para não gravar tokens em localStorage — apenas claims seguros. Manter localStorage apenas para preferências de UI (tenant preferido, form-drafts). Atualizar http.ts para credentials: 'include'. Garantir que refresh token flow usa cookie. Remover progressivamente chaves sensíveis de localStorage: available-tenants, available-scopes, network-id, user-id.

**Test Strategy:**

Testes unitários de session.ts verificando que saveAuthSession não grava tokens em localStorage. Teste E2E: login → verificar cookies HttpOnly → navegar → refresh → sessão mantida. Teste de segurança: XSS simulado não consegue ler access_token.
