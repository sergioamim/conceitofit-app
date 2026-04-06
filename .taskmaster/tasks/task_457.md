# Task ID: 457

**Title:** Backend: Criar endpoints de sessão com cookies HttpOnly

**Status:** pending

**Dependencies:** 456

**Priority:** high

**Description:** Implementar no backend Java endpoints que retornam Set-Cookie HttpOnly + SameSite=Strict para access token, refresh token e claims de sessão.

**Details:**

Criar ou adaptar o endpoint de login para usar cookies HttpOnly ao invés de retornar tokens no body. Cookies necessários: access_token (HttpOnly, Secure, SameSite=Strict), refresh_token (HttpOnly, Secure, SameSite=Strict, path=/auth/refresh), session_claims (cookie não-httpOnly com userId, userKind, displayName, activeTenantId — apenas para leitura client-side sem dados sensíveis). Backend deve validar origem e CSRF para requests stateful.

**Test Strategy:**

Teste de integração backend: login retorna Set-Cookie, refresh funciona com cookie, claims expõem apenas dados não-sensíveis. Verificar headers de cookie com curl/httpie.
