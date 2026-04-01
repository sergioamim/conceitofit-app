# Task ID: 263

**Title:** Migrar tokens de autenticação de localStorage para httpOnly cookies

**Status:** done

**Dependencies:** 259 ✓

**Priority:** medium

**Description:** JWT tokens armazenados em localStorage são vulneráveis a XSS. httpOnly cookies são mais seguros.

**Details:**

Requer mudança no backend para setar cookies httpOnly no login/refresh. Frontend remove leitura/escrita de localStorage para tokens. Manter localStorage apenas para preferências de UI (tema, tenant preferido). Atualizar seedAuthenticatedSession nos testes E2E.

**Test Strategy:**

Login funciona. Refresh funciona. Tokens não acessíveis via document.cookie ou localStorage. Testes E2E adaptados.
