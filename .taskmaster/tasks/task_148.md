# Task ID: 148

**Title:** Implementar BackofficeContextProvider

**Status:** done

**Dependencies:** 144 ✓

**Priority:** medium

**Description:** Criar contexto próprio do backoffice com modos plataforma/inspeção.

**Details:**

Contexto com estado mode: 'platform' | 'tenant', dados do tenant inspecionado, sinalização de impersonation. Expor hook useBackofficeContext. Manter isolado do TenantContextProvider.

**Test Strategy:**

Testar em /admin alternando modos e validar renderização condicional.
