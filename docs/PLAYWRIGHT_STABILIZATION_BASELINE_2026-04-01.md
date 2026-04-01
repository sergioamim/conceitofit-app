# Baseline de Estabilizacao Playwright

## Contexto

Esta linha de base fecha a campanha de estabilizacao das tasks `327` a `336`.

Objetivo operacional:
- separar o que ja foi estabilizado por bucket de causa-raiz;
- deixar um comando curto para reproduzir cada grupo;
- registrar os contratos minimos de sessao e shell para futuras suites;
- isolar apenas residuos funcionais reais no backlog.

## Matriz de Rerun

Todos os comandos abaixo assumem o mesmo prefixo local:

```bash
PLAYWRIGHT_BASE_URL=http://localhost:3000 \
PLAYWRIGHT_WEB_SERVER_COMMAND='BACKEND_PROXY_TARGET=http://localhost:8080 NEXT_PUBLIC_API_BASE_URL=http://localhost:8080 next dev --webpack -p 3000 -H localhost'
```

| Bucket | Suites sentinela | Comando | Estado final |
| --- | --- | --- | --- |
| Autenticacao app | `tests/e2e/security-flows.spec.ts`, `tests/e2e/dashboard.spec.ts`, `tests/e2e/billing-config.spec.ts`, `tests/e2e/sessao-multiunidade.spec.ts` | `npx playwright test tests/e2e/security-flows.spec.ts tests/e2e/dashboard.spec.ts tests/e2e/billing-config.spec.ts tests/e2e/sessao-multiunidade.spec.ts --project=chromium --workers=1 --reporter=line` | Bootstrap autenticado recuperado nas tasks `327`, `328` e `330`. Em `336`, o bucket nao voltou a cair em `/login`; os residuos observados ja sao funcionais de tela em `dashboard` e `billing-config`. |
| Autenticacao backoffice | `tests/e2e/backoffice-configuracoes.spec.ts`, `tests/e2e/backoffice-seguranca.spec.ts`, `tests/e2e/onboarding-fluxo-completo.spec.ts` | `npx playwright test tests/e2e/backoffice-configuracoes.spec.ts tests/e2e/backoffice-seguranca.spec.ts tests/e2e/onboarding-fluxo-completo.spec.ts --project=chromium --workers=1 --reporter=line` | Bucket estabilizado pela task `331`: a familia de falha por bounce para `/admin-login` foi removida. |
| Auth-rede / storefront | `tests/e2e/auth-rede.spec.ts` | `npx playwright test tests/e2e/auth-rede.spec.ts --project=chromium --workers=1 --reporter=line` | Estabilizado na task `332`. O bucket deixa de falhar por `Storefront nao encontrada` e `Carregando contexto da rede...` quando o contrato atual de host/header e respeitado. |
| Adesao publica | `tests/e2e/adesao-publica.spec.ts` | `npx playwright test tests/e2e/adesao-publica.spec.ts --project=chromium --workers=1 --reporter=line` | Estabilizado na task `333`. O fluxo volta a ser sentinela da jornada publica sem waits cegos. |
| Loading financeiro / operacional | `tests/e2e/admin-financeiro-integracoes.spec.ts`, `tests/e2e/admin-financeiro-operacional-crud.spec.ts`, `tests/e2e/operacional-grade-catraca.spec.ts`, `tests/e2e/reservas-aulas.spec.ts`, `tests/e2e/bi-operacional.spec.ts` | `npx playwright test tests/e2e/admin-financeiro-integracoes.spec.ts tests/e2e/admin-financeiro-operacional-crud.spec.ts tests/e2e/operacional-grade-catraca.spec.ts tests/e2e/reservas-aulas.spec.ts tests/e2e/bi-operacional.spec.ts --project=chromium --workers=1 --reporter=line` | Estabilizado na task `334`: o bucket deixa de ficar preso em loadings infinitos por payload minimo insuficiente. |
| Demo | `tests/e2e/demo-account.spec.ts` | `npx playwright test tests/e2e/demo-account.spec.ts --project=chromium --workers=1 --reporter=line` | Estabilizado na task `335`: submit, redirect para `/dashboard?demo=1`, banner e dismiss persistente voltaram a seguir o runtime atual. |
| Residuos funcionais isolados | `tests/e2e/admin-backoffice-coverage.spec.ts`, `tests/e2e/admin-backoffice-global-crud.spec.ts`, `tests/e2e/backoffice-impersonation.spec.ts` | `npx playwright test tests/e2e/admin-backoffice-coverage.spec.ts tests/e2e/admin-backoffice-global-crud.spec.ts tests/e2e/backoffice-impersonation.spec.ts --project=chromium --workers=1 --reporter=line` | Ainda resta trabalho real de rota/modulo. Esse bucket nao voltou a ser problema de fixture ou auth. |

## Resultado Consolidado por Bucket

### 1. Autenticacao app

- Estado consolidado: estabilizado quanto a sessao, bootstrap e troca de tenant.
- Base da correcao: tasks `327`, `328` e `330`.
- Evidencia operacional:
  - o bucket deixou de falhar por ausencia de `academia-auth-session-active`, `availableTenants`, `availableScopes` ou bootstrap incompleto;
  - no spot-check da `336`, as falhas observadas migraram para assertivas funcionais:
    - `tests/e2e/billing-config.spec.ts`
      - seletor estrito em `getByText("Asaas")`;
      - textos esperados de toast (`Conexão OK`, `Configuração salva`) nao encontrados;
      - webhook esperado nao encontrado.
    - `tests/e2e/dashboard.spec.ts`
      - heading `Pagamentos pendentes e vencidos` nao encontrado apos abrir a aba `Financeiro`.

### 2. Autenticacao backoffice

- Estado consolidado: estabilizado quanto a modo plataforma e guarda de acesso do shell `/admin`.
- Base da correcao: task `331`.
- Evidencia operacional:
  - as suites deixam de cair em `/admin-login` por seed operativa incompleta;
  - `installBackofficeGlobalSession` passou a ser a fixture canonica para rotas globais;
  - os residuos remanescentes migraram para crashes reais de rota/modulo.

### 3. Auth-rede / storefront

- Estado consolidado: estabilizado.
- Base da correcao: task `332`.
- Contrato validado:
  - host/subdominio: `/login` resolve rede por `x-forwarded-host` ou `host`;
  - rota canonica: `/app/[rede]/(login|forgot-password|first-access)`;
  - query fallback: `/login?redeIdentifier=rede-alvo`;
  - header de API: `X-Rede-Identifier`.

### 4. Adesao publica

- Estado consolidado: estabilizado.
- Base da correcao: task `333`.
- Resultado: trial, cadastro, checkout e pendencias voltam a depender de mocks segmentados por branding, tenant, catalogo e checkout, sem fallback monolitico.

### 5. Loading financeiro / operacional

- Estado consolidado: estabilizado.
- Base da correcao: task `334`.
- Resultado: os buckets deixam de ficar presos em `Carregando...` por payloads vazios ou waits cegos.

### 6. Demo

- Estado consolidado: estabilizado.
- Base da correcao: task `335`.
- Resultado: o fluxo publico de demo volta a salvar sessao compativel com o shell autenticado e com o banner do dashboard.

### 7. Residuos funcionais isolados

Esses itens deixaram de ser problema de base E2E e agora merecem tratamento como bug de produto/modulo:

- `tests/e2e/admin-backoffice-coverage.spec.ts`
  - `net::ERR_CONNECTION_RESET` em `/admin/financeiro/contratos`;
  - `ERR_CONNECTION_REFUSED` em `/admin/seguranca/funcionalidades`;
  - `ERR_CONNECTION_REFUSED` em `/admin/operacional/alertas`.
- `tests/e2e/admin-backoffice-global-crud.spec.ts`
  - `ERR_CONNECTION_REFUSED` em `/admin/academias`.
- `tests/e2e/backoffice-impersonation.spec.ts`
  - `ERR_CONNECTION_REFUSED` em `/admin/seguranca/usuarios/user-bruno`.
- Residuo adicional ja observado no bucket de auth backoffice:
  - rota de importacao EVO em `/admin/importacao-evo` com erro de boundary server/client (`useEvoImportPage()` chamado do servidor).

## Contrato de Sessao Canonica

Fonte primaria: `tests/e2e/support/auth-session.ts`.

### Chaves obrigatorias para qualquer shell protegido

- `academia-auth-token`
- `academia-auth-refresh-token`
- `academia-auth-token-type`
- `academia-auth-session-active`

### Chaves obrigatorias para fluxo tenant-aware

- `academia-auth-active-tenant-id`
- `academia-auth-preferred-tenant-id`
- `academia-auth-available-tenants`

### Chaves condicionais por modulo

- `academia-auth-base-tenant-id`
- `academia-auth-user-id`
- `academia-auth-user-kind`
- `academia-auth-display-name`
- `academia-auth-available-scopes`
- `academia-auth-broad-access`
- `academia-auth-force-password-change-required`

### Chaves condicionais por rede / login especial

- `academia-auth-network-id`
- `academia-auth-network-subdomain`
- `academia-auth-network-slug`
- `academia-auth-network-name`

## Fixtures Canonicas por Shell

### Shell do app

Usar:
- `installE2EAuthSession`
- `installProtectedShellMocks` ou `installOperationalAppShellMocks`
- `seedAuthenticatedSession` quando a suite ja depende do pacote legado de mocks de dominio em `backend-only-stubs.ts`

Endpoints minimos que o shell espera cedo:
- `GET /api/v1/auth/me`
- `GET /api/v1/app/bootstrap`
- `GET /api/v1/context/unidade-ativa`
- `PUT /api/v1/context/unidade-ativa/:tenantId`
- `GET /api/v1/academia`

Endpoints opcionais por fluxo:
- `POST /api/v1/auth/refresh`
- `GET /api/v1/onboarding/status`

### Shell global do backoffice

Usar:
- `installBackofficeGlobalSession`

Contrato minimo:
- sessao autenticada com `availableScopes: ["GLOBAL"]`;
- `broadAccess: true`;
- `capabilities.canAccessElevatedModules: true`;
- roles elevadas coerentes com o cenario (`OWNER`/`ADMIN`);
- rede e tenants disponiveis consistentes entre sessao e bootstrap.

Endpoints minimos:
- `GET /api/v1/auth/me`
- `GET /api/v1/app/bootstrap`
- `GET /api/v1/context/unidade-ativa`
- `GET /api/v1/academia`

### Fluxos publicos

Usar mocks de dominio especificos e evitar reaproveitar shell protegido quando a tela ainda nao deveria estar autenticada:
- `installPublicJourneyApiMocks` para adesao publica;
- mocks especificos de rede/storefront para `auth-rede`.

## Regra de Operacao para Novos Specs

- Se a tela entra em shell autenticado, semear sessao primeiro e subir o contrato minimo de bootstrap antes de mockar o dominio.
- Se a tela e global `/admin`, usar fixture de backoffice global em vez de seed operacional de tenant.
- Se a falha acontece depois do shell montar, tratar como residuo funcional da tela; nao mascarar com timeout, `waitForTimeout` ou payload `200 {}`.
- Quando um bucket ja estiver estabilizado, novos follow-ups devem apontar spec, rota afetada, causa provável e comando de reproducao.
