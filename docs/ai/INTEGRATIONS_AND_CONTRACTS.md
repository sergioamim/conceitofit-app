# INTEGRATIONS_AND_CONTRACTS

## Superfície HTTP principal consumida

## 1. Backend autenticado

- Cliente principal:
  - `src/lib/api/http.ts`
- Headers/comportamentos relevantes:
  - `Authorization: Bearer <token>`
  - `X-Context-Id` para rotas operacionais com unidade ativa
  - `X-Request-Id` para correlação
  - fallback/reparo de contexto de tenant
- Rotas que o cliente trata como context-scoped:
  - `/api/v1/comercial/*`
  - `/api/v1/crm/*`
  - `/api/v1/agenda/aulas/*`
  - parte de `/api/v1/administrativo/*`
  - parte de `/api/v1/gerencial/financeiro/*`
- Fonte de verdade:
  - `src/lib/api/http.ts`

## 2. Backend server-side

- Cliente server-only:
  - `src/lib/shared/server-fetch.ts`
- Contrato:
  - usa `BACKEND_PROXY_TARGET` direto
  - lê cookie `academia-access-token`
  - gera `X-Request-Id`
- Usado por:
  - páginas RSC do dashboard
  - backoffice dashboard
  - jornada pública server-side
  - storefront

## 3. Backend público

- Rotas observadas:
  - `/api/v1/publico/adesao/*`
  - `/api/v1/publico/demo`
  - `/api/v1/publico/leads`
  - `/api/v1/publico/storefront/*`
- Headers especiais:
  - `X-Adesao-Token` nas etapas subsequentes de adesão pública
- Fontes:
  - `src/lib/public/adesao-api.ts`
  - `src/lib/public/demo-account-api.ts`
  - `src/lib/public/lead-b2b-api.ts`
  - `src/lib/public/storefront-api.ts`

## Autenticação e sessão

- Login legado:
  - `POST /api/v1/auth/login`
  - fluxo em `src/components/auth/legacy-login-flow.tsx`
- Login contextual por rede:
  - `loginApi({ redeIdentifier, channel: "APP" })`
  - contexto carregado por `getAccessNetworkContextApi()`
  - fluxo em `src/components/auth/network-access-flow.tsx`
- Primeiro acesso e recuperação:
  - `requestFirstAccessApi()`
  - `requestPasswordRecoveryApi()`
  - `changeForcedPasswordApi()`
- Sessão persistida em:
  - memória (`token-store.ts`)
  - `localStorage`
  - cookies auxiliares para SSR (`academia-access-token`, `academia-active-tenant-id`)
- Fonte de verdade:
  - `src/lib/api/auth.ts`
  - `src/lib/api/session.ts`
  - `src/lib/api/token-store.ts`

## Contratos de contexto e bootstrap

- Endpoint canônico de contexto:
  - `GET /api/v1/context/unidade-ativa`
  - `PUT /api/v1/context/unidade-ativa/{tenantId}`
- Endpoint opcional de bootstrap:
  - `GET /api/v1/app/bootstrap`
  - governado por `NEXT_PUBLIC_APP_BOOTSTRAP_ENABLED` e `NEXT_PUBLIC_APP_BOOTSTRAP_STRICT`
- Comportamento:
  - se bootstrap não estiver ativo ou faltar rota, o frontend cai para `me + contexto + academia`
- Fonte de verdade:
  - `src/lib/api/contexto-unidades.ts`
  - `src/lib/tenant/hooks/session-bootstrap.ts`

## Tipos/DTOs importantes

- Tipos de sessão:
  - `AuthSession`, `AuthSessionScope`, `TenantAccess`
  - arquivo: `src/lib/api/session.ts`
- Tipos de usuário autenticado:
  - `AuthUser`
  - arquivo: `src/lib/api/auth.ts`
- Tipos de domínio:
  - `Tenant`, `Academia`, `StorefrontTheme`, `OnboardingStatus`, `ClienteOperationalContext`
  - arquivos:
    - `src/lib/shared/types/tenant.ts`
    - `src/lib/shared/types/*.ts`
- Schemas `zod` relevantes:
  - `src/lib/forms/public-journey-schemas.ts`
  - `src/lib/forms/storefront-theme-schema.ts`
  - `src/components/planos/plano-form-schema.ts`
  - `src/components/shared/*-schema.ts`

## Contratos compartilhados/documentais

- `docs/FRONTEND_INTEGRATION_GUIDE.json`
  - documentação extensa de endpoints e DTOs
- `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`
  - auditoria de cobertura e divergência entre frontend e backend
- `docs/BACKEND_REAL_INTEGRATION_VALIDATION.md`
  - relato de integração real e bloqueios históricos

## Riscos de divergência de contrato

- Fato observado no repositório documental:
  - `docs/API_AUDIT_BACKEND_VS_FRONTEND.md` reporta dezenas de paths frontend sem correspondência no backend, com destaque para `billing`, `financial`, `whatsapp`, `agenda/aulas` e parte de `crm/cadencias`.
- Fato observado no repositório documental:
  - o mesmo documento reporta mismatch crítico entre `StorefrontThemeRequest` do backend e o schema/frontend atual.
- Fato observado no código:
  - o frontend mantém um tipo `StorefrontTheme` voltado à UI em `src/lib/shared/types/tenant.ts`, enquanto `src/lib/public/storefront-api.ts` ainda recebe payload flat do backend (`corPrimaria`, `titulo`, `bannerUrl`, `redesSociais`).
- Inferência operacional:
  - qualquer mudança em storefront precisa verificar explicitamente a tradução entre DTO backend e shape local, porque não há correspondência 1:1.

## Eventos, auditoria e webhooks

- Fato observado:
  - não há infraestrutura explícita de webhooks no frontend.
- Fato observado:
  - existem fluxos de auditoria, exceção e impersonation no backoffice global.
- Arquivos centrais:
  - `src/lib/api/admin-audit.ts`
  - `src/lib/api/backoffice-seguranca/*`
  - `src/components/backoffice/impersonation-banner.tsx`

## Cuidados ao alterar contratos

- Não quebrar:
  - persistência/local storage em `session.ts`
  - cookies auxiliares do SSR
  - semântica de `tenantId` query vs `X-Context-Id`
  - header `X-Adesao-Token` na jornada pública
  - headers `x-tenant-*` injetados pelo proxy do storefront
- Validar sempre com:
  - clientes em `src/lib/api/*`
  - tipos em `src/lib/shared/types/*`
  - testes de contrato em `tests/unit/integration-guide-contracts.spec.ts`

## Lacunas conhecidas

- Lacuna conhecida: a documentação de integração (`FRONTEND_INTEGRATION_GUIDE.json`) parece refletir uma fase anterior mais centrada em `/api/v1/academia/*`; o código atual usa múltiplos módulos mais especializados.
- Lacuna conhecida: o backend real não está neste repositório; várias garantias de compatibilidade dependem de docs/auditorias, não de verificação local end-to-end.
