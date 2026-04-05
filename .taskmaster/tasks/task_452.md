# Task ID: 452

**Title:** Canonicalizar acesso de rede em /acesso/[redeSlug] e depreciar /app/[networkSubdomain]

**Status:** done

**Dependencies:** 448 ✓, 449 ✓

**Priority:** high

**Description:** Adotar /acesso/[redeSlug] como URL canonica de entrada por rede e manter /app/[networkSubdomain] apenas como compatibilidade legada.

**Details:**

Revisar src/app/app/[networkSubdomain]/*, src/app/acesso/[redeSlug]/*, src/app/login/page.tsx e helpers como buildNetworkAccessHref e normalizeNetworkSubdomain. Criar redirects canonicos de /app/[networkSubdomain] para /acesso/[redeSlug], alinhar login, primeiro acesso e recuperacao de senha com a taxonomia final e revisar impactos em links internos, QA scripts e cenarios Playwright.

**Test Strategy:**

Teste manual: validar entrada por host, por slug de rede e por URL legada /app/[networkSubdomain], confirmando o redirect para /acesso/[redeSlug] sem quebrar o fluxo de autenticacao.
