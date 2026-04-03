# KEY_FLOWS

## 1. Login contextual por rede

- Passo a passo:
  1. `src/app/login/page.tsx` tenta resolver o subdomínio de rede pelo host ou query
  2. se houver rede, renderiza `NetworkAccessFlow`
  3. `NetworkAccessFlow` carrega contexto com `getAccessNetworkContextApi()`
  4. `loginApi()` persiste sessão
  5. o fluxo busca `getTenantContextApi()`
  6. se houver unidade preferida válida, faz `setTenantContextApi()`
  7. redireciona para `resolvePostLoginPath(next)`
- Arquivos centrais:
  - `src/app/login/page.tsx`
  - `src/components/auth/network-access-flow.tsx`
  - `src/lib/shared/network-subdomain.ts`
  - `src/lib/shared/auth-redirect.ts`
  - `src/lib/api/auth.ts`
  - `src/lib/api/contexto-unidades.ts`
- Erros relevantes:
  - timeout ao carregar contexto da rede
  - login sem unidade elegível
  - sessão exigindo troca obrigatória de senha

## 2. Login legado e admin

- Fluxo legado:
  - `/login` sem rede cai em `LegacyLoginFlow`
  - autentica com `loginApi()`
  - seleciona unidade prioritária via `setTenantContextApi()`
- Fluxo admin:
  - `/admin-login`
  - autentica com `adminLoginApi()`
  - redireciona para `/admin` ou para troca de senha
- Arquivos centrais:
  - `src/components/auth/legacy-login-flow.tsx`
  - `src/app/admin-login/page.tsx`

## 3. Bootstrap do shell autenticado

- Passo a passo:
  1. layouts autenticados montam `TenantContextProvider`
  2. provider chama `loadSessionBootstrapState()`
  3. se o endpoint `/api/v1/app/bootstrap` estiver ativo, usa bootstrap consolidado
  4. senão, cai para `getTenantContextApi() + meApi() + getAcademiaAtualApi()`
  5. o snapshot é sincronizado em `tenant-context.ts`
  6. sidebar/topbar/theme/sentry consomem o mesmo estado
- Arquivos centrais:
  - `src/app/(portal)/layout.tsx`
  - `src/app/(aluno)/layout.tsx`
  - `src/lib/tenant/hooks/use-session-context.tsx`
  - `src/lib/tenant/hooks/session-bootstrap.ts`
  - `src/lib/tenant/tenant-context.ts`
- Decisões embutidas:
  - unidade ativa é ponto único de verdade do shell
  - fallback estável antes do mount
  - sincronização por eventos de sessão/storage

## 4. Recuperação de contexto de tenant em requests

- Passo a passo:
  1. `apiRequest()` decide se a rota é context-scoped
  2. injeta/remover `tenantId` da query conforme a regra
  3. envia `X-Context-Id`
  4. se o backend responder erro de contexto ausente/divergente, tenta reparar
  5. sincroniza sessão/contexto e refaz a chamada
- Arquivos centrais:
  - `src/lib/api/http.ts`
  - `src/lib/shared/utils/error-codes.ts`
  - `src/lib/api/contexto-unidades.ts`
- Estados de erro relevantes:
  - `x-context-id sem unidade ativa`
  - `tenantId diverge da unidade ativa`

## 5. Operação de clientes/prospects/vendas

- Fato observado:
  - clientes e vendas dependem fortemente de `tenantId` resolvido
  - CRM usa React Query e normalização de runtime
  - mudança de status do prospect dispara cadências
- Arquivos centrais:
  - `src/app/(portal)/clientes/page.tsx`
  - `src/lib/query/use-clientes.ts`
  - `src/lib/query/use-prospects.ts`
  - `src/app/(portal)/vendas/nova/page.tsx`
  - `src/lib/query/use-vendas.ts`
- Decisão embutida:
  - o frontend assume que a operação diária é unit-scoped; sem tenant resolvido, muitos hooks nem disparam.

## 6. Primeiro acesso / troca obrigatória de senha

- Passo a passo:
  1. login pode retornar `forcePasswordChangeRequired`
  2. o fluxo redireciona para `buildForcedPasswordChangeHref()`
  3. `ForcedPasswordChangeFlow` revalida se a sessão ainda existe e se a flag ainda está ativa
  4. chama `changeForcedPasswordApi()`
  5. redireciona para o destino pós-login
- Arquivos centrais:
  - `src/components/auth/forced-password-change-flow.tsx`
  - `src/lib/api/auth.ts`
  - `src/lib/api/session.ts`

## 7. Jornada pública de adesão

- Passo a passo resumido:
  1. `src/app/(public)/adesao/page.tsx` carrega contexto server-side
  2. `getPublicJourneyContextServer()` resolve tenant, academia, planos e formas de pagamento
  3. no cliente, `usePublicJourney()` controla draft local por tenant
  4. ações públicas usam `src/lib/public/adesao-api.ts`
  5. etapas posteriores usam `X-Adesao-Token`
- Arquivos centrais:
  - `src/app/(public)/adesao/page.tsx`
  - `src/lib/public/server-services.ts`
  - `src/lib/public/services.ts`
  - `src/lib/public/use-public-journey.ts`
  - `src/lib/public/adesao-api.ts`
- Estados de erro relevantes:
  - tenant público não encontrado
  - plano/checkout incompleto
  - pendências de contrato/pagamento

## 8. Storefront por subdomínio ou slug

- Fluxo por subdomínio:
  1. `src/proxy.ts` extrai subdomínio do host
  2. resolve o tenant via `/api/v1/publico/storefront/resolve`
  3. injeta headers `x-tenant-id`, `x-tenant-slug`, `x-academia-slug`
  4. reescreve a request para `/storefront/{academiaSlug}`
- Fluxo por slug:
  - `src/app/(public)/storefront/[academiaSlug]/page.tsx` chama `getStorefrontOverview()`
  - o layout chama `getStorefrontThemeBySlug()`
- Arquivos centrais:
  - `src/proxy.ts`
  - `src/lib/storefront/subdomain.ts`
  - `src/app/(public)/storefront/page.tsx`
  - `src/app/(public)/storefront/[academiaSlug]/page.tsx`
  - `src/app/(public)/storefront/[academiaSlug]/layout.tsx`
  - `src/app/(public)/storefront-not-found/page.tsx`
  - `src/lib/public/storefront-api.ts`
- Decisão embutida:
  - subdomínio é uma conveniência de resolução; o formato canônico interno do app é `academiaSlug`.
  - a superfície pública inteira fica sob `(public)`, sem prefixo adicional na URL final.

## 9. Backoffice global e onboarding de unidade

- Passo a passo:
  1. `/admin` usa `serverFetch()` para buscar academias, unidades, overview de segurança e métricas
  2. provisionamento/onboarding usa `admin-onboarding-api.ts`
  3. onboarding contínuo e EVO import usam `backoffice/onboarding.ts` e `importacao-evo.ts`
  4. EVO usa headers `X-Tenant-Id` explícitos em chamadas selecionadas
- Arquivos centrais:
  - `src/app/(backoffice)/admin/page.tsx`
  - `src/lib/backoffice/admin.ts`
  - `src/lib/backoffice/onboarding.ts`
  - `src/lib/api/admin-onboarding-api.ts`
  - `src/lib/api/importacao-evo.ts`

## 10. Página pública de status

- Passo a passo:
  1. `/status` chama `loadSystemHealthSnapshot()`
  2. o frontend consulta `/api/health`
  3. consulta também `/api/v1/health/full` do backend
  4. compõe cards de frontend, backend, banco e storage
- Arquivos centrais:
  - `src/app/status/page.tsx`
  - `src/app/api/health/route.ts`
  - `src/lib/status/system-health.ts`

## Lacunas conhecidas

- Lacuna conhecida: parte dos fluxos documentados em PRDs/auditorias depende de backend ainda evoluindo; para várias trilhas, o frontend já modela a UX antes de haver plena garantia de contrato estável.
