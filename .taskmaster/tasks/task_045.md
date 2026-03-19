# Task ID: 45

**Title:** Expor canDeleteClient na sessão do frontend

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Evoluir o contexto de sessão para carregar a capability de exclusão.

**Details:**

Em src/lib/api/contexto-unidades.ts, adicionar canDeleteClient a TenantBootstrapCapabilitiesApiResponse e manter o valor no getSessionBootstrapApi. Em src/hooks/use-session-context.tsx, incluir canDeleteClient no estado e no TenantContextValue. Pseudo-código: canDeleteClient = bootstrap.capabilities?.canDeleteClient ?? false; return { ...state, canDeleteClient }.

**Test Strategy:**

Teste manual: carregar app com bootstrap real e verificar a flag no hook via React DevTools.
