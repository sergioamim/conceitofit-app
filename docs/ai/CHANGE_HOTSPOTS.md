# CHANGE_HOTSPOTS

## Hotspots principais

## 1. Sessão, auth e contexto

- Arquivos:
  - `src/lib/api/http.ts`
  - `src/lib/api/session.ts`
  - `src/lib/api/auth.ts`
  - `src/lib/api/contexto-unidades.ts`
  - `src/lib/tenant/hooks/use-session-context.tsx`
  - `src/lib/tenant/hooks/session-bootstrap.ts`
  - `src/lib/tenant/tenant-context.ts`
- Por que são sensíveis:
  - concentram token, refresh, tenant ativo, bootstrap, repair de contexto e sincronização SSR/CSR
- Risco de regressão:
  - quebrar login, troca de unidade, shell inteiro ou SSR autenticado

## 2. Layouts e shells

- Arquivos:
  - `src/app/layout.tsx`
  - `src/app/(portal)/layout.tsx`
  - `src/app/(aluno)/layout.tsx`
  - `src/app/(backoffice)/layout.tsx`
- Por que são sensíveis:
  - afetam hidratação, redirecionamento, providers globais, banners e carregamento inicial
- Cuidado:
  - respeitar os guardrails de hydration do `AGENTS.md`

## 3. Clientes HTTP e normalizadores

- Arquivos:
  - `src/lib/api/*.ts`
  - `src/lib/shared/types/*.ts`
  - `src/lib/forms/*.ts`
- Por que são sensíveis:
  - pequenas mudanças de payload quebram múltiplas telas
- Cuidado:
  - validar junto com testes de contrato e tipos compartilhados

## 4. Storefront e jornada pública

- Arquivos:
  - `src/proxy.ts`
  - `src/lib/storefront/subdomain.ts`
  - `src/lib/public/storefront-api.ts`
  - `src/lib/public/services.ts`
  - `src/lib/public/server-services.ts`
  - `src/app/storefront/[academiaSlug]/*`
  - `src/app/(public)/adesao/*`
- Riscos:
  - rewrites errados por host/subdomínio
  - mismatch entre theme do backend e shape local do frontend
  - quebra de SEO/metadata

## 5. Segurança global, RBAC e backoffice

- Arquivos:
  - `src/lib/api/rbac.ts`
  - `src/lib/api/backoffice-seguranca/*`
  - `src/lib/backoffice/security-governance.ts`
  - `src/app/(backoffice)/admin/seguranca/*`
- Riscos:
  - essas rotas não seguem exatamente o mesmo contrato de contexto do operacional
  - a UX traduz conceitos de perfil/grant/feature para linguagem de negócio; mudanças superficiais podem quebrar essa ponte

## 6. Importação EVO e onboarding

- Arquivos:
  - `src/lib/api/importacao-evo.ts`
  - `src/lib/backoffice/onboarding.ts`
  - `src/lib/api/admin-onboarding-api.ts`
  - `src/app/(backoffice)/admin/importacao-evo*`
- Riscos:
  - payloads longos, uploads, múltiplos tipos de job, headers explícitos de tenant

## 7. Componentes compartilhados de formulário e modal

- Arquivos que tendem a espalhar impacto:
  - `src/components/shared/crud-modal.tsx`
  - `src/components/shared/paginated-table.tsx`
  - `src/components/shared/suggestion-input.tsx`
  - `src/components/shared/*-modal.tsx`
  - `src/components/planos/plano-form.tsx`
- Riscos:
  - acessibilidade
  - foco/teclado
  - contratos com RHF/Zod

## Acoplamentos relevantes

- `apiRequest()` <-> `session.ts` <-> `token-store.ts`
- `TenantContextProvider` <-> `session-bootstrap.ts` <-> `contexto-unidades.ts`
- `proxy.ts` <-> `storefront/subdomain.ts` <-> `public/storefront-api.ts`
- `queryKeys` <-> hooks `use-*` <-> serviços/runtime por domínio
- backoffice security UI <-> `security-governance.ts` heurísticas de catálogo e impacto

## Cuidados ao editar

- Sempre checar:
  - se a mudança afeta SSR e CSR de forma diferente
  - se há cookies e `localStorage` envolvidos
  - se a rota depende de `tenantId` explícito ou de `X-Context-Id`
  - se existe teste de contrato ou helper E2E mockando aquele endpoint
- Em mudanças de auth/contexto:
  - ler também `tests/unit/auth-session-context.spec.ts`
  - ler também `tests/e2e/auth-rede.spec.ts`
  - ler também `tests/e2e/sessao-multiunidade.spec.ts`

## Inferências úteis

- Inferência: qualquer task que mencione “login”, “sessão”, “tenant”, “unidade ativa”, “rede” ou “storefront” deve começar pelo código de infra, não pela tela.
- Inferência: em áreas com documentação de auditoria de contrato, a chance de quebra silenciosa por endpoint divergente é maior que em uma app CRUD comum.
