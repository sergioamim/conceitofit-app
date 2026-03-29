# Task ID: 177

**Title:** Adicionar headers de segurança (CSP, HSTS, X-Frame-Options)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Nenhum header de segurança HTTP está configurado. Faltam Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options e X-Frame-Options.

**Details:**

Adicionar headers em next.config.ts via campo 'headers' ou no middleware.ts. Headers mínimos: Content-Security-Policy (script-src 'self', style-src 'self' 'unsafe-inline'), X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Strict-Transport-Security: max-age=31536000. Testar que JSON-LD scripts e inline styles do tema continuam funcionando com a CSP.

**Test Strategy:**

curl -I da landing retorna os headers de segurança. Páginas públicas e app continuam renderizando normalmente.
