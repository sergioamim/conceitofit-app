# Task ID: 182

**Title:** Decompor TenantContextProvider (739 linhas) em providers menores

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** use-session-context.tsx faz bootstrap, event listening, eligibility, switching e branding — tudo em 739 linhas.

**Details:**

Separar em: 1) SessionBootstrapProvider — auth token, refresh, /bootstrap call, event listeners de sessão. 2) TenantAccessProvider — tenant list, eligibility filtering, switching, operational access. 3) BrandingProvider — academia, theme, appName. Manter API pública compatível (useTenantContext retorna mesmo shape). Usar composição: SessionBootstrap > TenantAccess > Branding.

**Test Strategy:**

Login, troca de tenant, impersonação e tema continuam funcionando. Nenhum componente quebra por mudança de API. Testes e2e existentes passam.
