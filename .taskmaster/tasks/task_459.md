# Task ID: 459

**Title:** Frontend: CSRF protection para requests stateful com cookies

**Status:** pending

**Dependencies:** 458

**Priority:** high

**Description:** Implementar proteção CSRF quando a sessão usar cookies HttpOnly, já que requests se tornam stateful.

**Details:**

Adicionar header X-CSRF-Token nos requests fetch/axios. Backend deve gerar e validar CSRF token. Alternativa: SameSite=Strict + SameSite=Lax como fallback. Configurar next.config.ts para permitir cookies cross-origin no proxy /backend/*. Implementar double-submit cookie pattern se backend suportar.

**Test Strategy:**

Teste E2E: request sem CSRF token retorna 403, request com CSRF token válido retorna 200. Teste de segurança: CSRF de domínio externo é rejeitado.
