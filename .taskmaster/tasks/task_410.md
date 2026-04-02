# Task ID: 410

**Title:** Mapear impacto da sessão única contextualizada no backoffice e dashboard

**Status:** done

**Dependencies:** —

**Priority:** high

**Description:** Analisar onde o frontend assume tokens distintos e listar ajustes necessários para o token enriquecido com contexto.

**Mapeamento de impacto (sessão única com `redeId` + `activeTenantId`):**

**1) Camada de sessão e persistência**
- `src/lib/api/session.ts`
  - `saveAuthSession` grava token/refresh e `activeTenantId` no storage/cookie.
  - Cookies `academia-access-token` e `academia-active-tenant-id` alimentam SSR.
  - Eventos `AUTH_SESSION_UPDATED_EVENT` são usados para re-hidratar UI.
- `src/lib/api/token-store.ts`
  - `hasActiveSession` usa flag `academia-auth-session-active`.
  - Guardas de layout dependem desse estado para redirecionar ao login.

**2) Bootstrap e contexto de tenant**
- `src/lib/tenant/hooks/use-session-context.tsx`
  - `refresh`/`switchActiveTenant` usam `setTenantContextApi` + `loadSessionBootstrapState`.
  - `hasSessionContextState` decide bootstrap com base em sessão ativa, `activeTenantId` e tenants disponíveis.
  - `resolveUnprovidedTenantContextValue` usa `getRolesFromSession` para permissões iniciais.
- `src/lib/tenant/hooks/session-bootstrap.ts`
  - Usa `getSessionBootstrapApi`, `getTenantContextApi`, `meApi`.
  - Token único precisa trazer `activeTenantId` e `redeId` para já alinhar contexto.

**3) API request, headers e resolução de tenant**
- `src/lib/api/http.ts`
  - Resolve tenant ativo via `getActiveTenantIdFromSession` e `getPreferredTenantId`.
  - Regras de `X-Context-Id` + query `tenantId` dependem de contexto ativo consistente.
  - Com token único, o `activeTenantId` deve ser a fonte inicial.

**4) Guardas e layouts**
- `src/app/(app)/layout.tsx`
  - Redireciona para login se `hasActiveSession()` for falso.
  - `buildLoginHref` usa `getNetworkSlugFromSession` para login contextual.
  - `AppOperationalAccessGate` depende do contexto já carregado.
- `src/app/(backoffice)/admin/layout.tsx`
  - Usa `hasActiveSession` + roles para liberar o shell administrativo.

**5) Fluxo “Entrar como academia/unidade” (backoffice)**
- `src/app/(backoffice)/admin/entrar-como-academia/page.tsx`
  - Hoje usa `setPreferredTenantId` + `switchActiveTenant` e `window.location.assign("/dashboard")`.
  - Com token único, precisa consumir o endpoint oficial e reemitir sessão com `redeId`/`activeTenantId`.

**6) Telas e SSR sensíveis a contexto**
- `src/app/(app)/dashboard/page.tsx` e telas que fazem `serverFetch` dependem do cookie `academia-active-tenant-id`.
- `src/app/(backoffice)/admin/page.tsx` e páginas globais assumem sessão admin válida.

**Resumo do impacto**
- O token único precisa propagar `activeTenantId` e `redeId` já no handoff.
- Guardas e bootstraps devem confiar nesse contexto sem troca de token.
- O fluxo “Entrar como unidade” passa a ser o ponto central para atualização de sessão e contexto ativo.
