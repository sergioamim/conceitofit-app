# Task ID: 154

**Title:** Implementar middleware de subdomínio para storefront

**Status:** done

**Dependencies:** 150 ✓

**Priority:** high

**Description:** Detectar subdomínio, resolver tenant e rotear para storefront.

**Details:**

Middleware Next.js que extrai subdomínio do host, consulta API de resolução /api/v1/publico/storefront/resolve com cache. Se inválido, rewrite para 404 pública. Headers x-tenant-id/x-tenant-slug para SSR.

**Test Strategy:**

Testar com hosts simulados e validar rewrite/404.
