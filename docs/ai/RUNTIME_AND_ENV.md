# RUNTIME_AND_ENV

## Modos de execução

- Fato observado:
  - browser/client usa `apiRequest()` e normalmente chama `/backend/...`
  - RSC/SSR usa `serverFetch()` e fala direto com `BACKEND_PROXY_TARGET`
  - Playwright pode subir servidor mockado (`dev:mock`) ou servidor com backend real (`dev:3001:api`)
- Fontes:
  - `src/lib/api/http.ts`
  - `src/lib/shared/server-fetch.ts`
  - `playwright.config.ts`
  - `README.md`

## Variáveis de ambiente validadas por schema

- Fonte de verdade: `src/lib/env.ts`

| Variável | Uso observado |
| --- | --- |
| `BACKEND_PROXY_TARGET` | obrigatória; base do rewrite `/backend/*` e de `serverFetch()` |
| `BACKEND_PROXY_MAX_BODY_SIZE` | tamanho máximo do proxy client para uploads grandes |
| `NEXT_PUBLIC_API_BASE_URL` | base direta da API quando não se usa só `/backend` |
| `NEXT_PUBLIC_SENTRY_DSN` | habilita Sentry |
| `NEXT_PUBLIC_DEBUG_REACT_SCAN` | injeta `react-scan` em dev |
| `NEXT_PUBLIC_DEBUG_QUERY_DEVTOOLS` | exibe devtools do React Query |
| `NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS` | habilita painel de debug de sessão |
| `STOREFRONT_ROOT_HOSTS` | domínios raiz que não devem virar storefront |

## Variáveis lidas fora do schema principal

- Fato observado: estas variáveis são lidas no código, mas não passam por `parseAppEnv()`.

### Auth, bootstrap e feature flags

- `NEXT_PUBLIC_DEV_AUTO_LOGIN`
- `NEXT_PUBLIC_DEV_AUTH_EMAIL`
- `NEXT_PUBLIC_DEV_AUTH_PASSWORD`
- `NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED`
- `NEXT_PUBLIC_APP_BOOTSTRAP_STRICT`
- `NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED`
- `NEXT_PUBLIC_CLIENT_OPERATIONAL_ELIGIBILITY_ENABLED`
- `NEXT_PUBLIC_CLIENT_MIGRATION_ENABLED`
- `NEXT_PUBLIC_FEATURE_SECURITY_IA`

### Storefront/dev

- `STOREFRONT_DEV_TENANT_ID`
- `STOREFRONT_DEV_ACADEMIA_SLUG`

### API específica

- `NEXT_PUBLIC_CATRACA_ACESSOS_PATH`

### Sentry/build

- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`
- `ANALYZE`

### Playwright

- `PLAYWRIGHT_REAL_BACKEND`
- `PLAYWRIGHT_PORT`
- `PLAYWRIGHT_BASE_URL`
- `PLAYWRIGHT_WEB_SERVER_COMMAND`
- `PLAYWRIGHT_TEST`
- `PLAYWRIGHT_BACKEND_URL`

## Bootstrap local

- Caminho mais próximo do fluxo real:
  1. subir backend Java em `http://localhost:8080`
  2. configurar `.env.local`
  3. rodar `npm run dev:api` ou `npm run dev:3001:api`
- Caminho focado em desenvolvimento frontend/testes:
  - `npm run dev:mock`
- Fontes:
  - `README.md`
  - `package.json`

## Seeds, mocks e fakes

- Fato observado:
  - Vitest instala `localStorage` fake e `fetch` default para hosts locais em `tests/setup.ts`
  - Playwright usa mocks de shell protegido em `tests/e2e/support/protected-shell-mocks.ts`
  - há stubs completos de backend para jornada pública/comercial/reservas em `tests/e2e/support/backend-only-stubs.ts`
- Fato observado: `createTenantLoader()` pode desviar SSR fetch autenticado em ambiente E2E via `shouldBypassAuthenticatedSSRFetch()`.
- Fontes:
  - `tests/setup.ts`
  - `tests/e2e/support/protected-shell-mocks.ts`
  - `tests/e2e/support/backend-only-stubs.ts`
  - `src/lib/shared/e2e-runtime.ts`
  - `src/lib/shared/create-tenant-loader.tsx`

## Dependências externas

- Backend principal Java:
  - via `BACKEND_PROXY_TARGET`
- Sentry:
  - opcional, configurado em `next.config.ts` e `src/instrumentation.ts`
- Host/subdomínio storefront:
  - resolvido em `src/proxy.ts` por chamada ao backend público
- Dependências documentadas de produção/local:
  - PostgreSQL, MinIO, Cloud Run/Vercel, conforme `docs/RUNBOOK.md`

## Observações de build e runtime

- Fato observado: `next.config.ts` define:
  - `output: "standalone"`
  - security headers globais
  - rewrites de `/backend/*`
  - redirect `/admin/importacao-evo-p0 -> /admin/importacao-evo`
- Fato observado: `src/proxy.ts` faz rewrite por subdomínio para `/storefront/{academiaSlug}` e injeta headers `x-tenant-id`, `x-tenant-slug`, `x-academia-slug`.
- Fato observado: `src/app/layout.tsx` chama `getAppEnv()` no render do layout raiz; se env crítica estiver inválida, a aplicação falha cedo.
- Fato observado: `src/app/api/health/route.ts` responde `timestamp` e `uptime` em runtime, e `src/lib/status/system-health.ts` consome também `/api/v1/health/full` do backend.

## Cuidados de runtime

- Cuidado: `apiRequest()` tem lógica não trivial de contexto, refresh de auth e injeção automática de `tenantId`; não trate os clientes de API como wrappers “burros”.
- Cuidado: `serverFetch()` usa cookies `academia-access-token` e `academia-active-tenant-id`, não o `localStorage`.
- Cuidado: há diferença material entre:
  - login/admin/backoffice
  - login contextual por rede
  - shell operacional dependente de tenant ativo

## Lacunas conhecidas

- Lacuna conhecida: `.env.example` é bem menor que o conjunto real de variáveis usadas no código.
- Lacuna conhecida: `docs/ENVIRONMENTS.md` menciona variáveis como `NEXT_PUBLIC_API_URL` que não correspondem ao schema atual em `src/lib/env.ts`.
