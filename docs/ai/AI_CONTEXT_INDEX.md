# AI_CONTEXT_INDEX

## Ponto de entrada principal

- Se a tarefa cruzar backend, web, mobile ou gestão de acesso, leia primeiro:
  - [`../../../academia-java/docs/ai/TRANSVERSAL_CONTEXT.md`](../../../academia-java/docs/ai/TRANSVERSAL_CONTEXT.md)

- Se for mexer em auth, leia:
  - `docs/ai/KEY_FLOWS.md`
  - `docs/ai/INTEGRATIONS_AND_CONTRACTS.md`
  - `src/lib/api/auth.ts`
  - `src/lib/api/session.ts`
  - `src/lib/api/http.ts`

- Se for mexer em sessão/unidade ativa/bootstrap, leia:
  - `src/lib/tenant/hooks/use-session-context.tsx`
  - `src/lib/tenant/hooks/session-bootstrap.ts`
  - `src/lib/api/contexto-unidades.ts`
  - `src/lib/tenant/tenant-context.ts`
  - `docs/SESSION_BOOTSTRAP_CACHE_PRD.md`

- Se for mexer em login por rede/subdomínio, leia:
  - `src/app/login/page.tsx`
  - `src/components/auth/network-access-flow.tsx`
  - `src/lib/shared/network-subdomain.ts`
  - `src/lib/shared/auth-redirect.ts`
  - `docs/REDE_UNIDADE_FRONTEND_ROLLOUT.md`

- Se for mexer em área operacional autenticada, leia:
  - `src/app/(portal)/layout.tsx`
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/app-topbar.tsx`
  - `docs/ai/DOMAIN_MAP.md`

- Se for mexer em clientes, leia:
  - `src/app/(portal)/clientes`
  - `src/lib/query/use-clientes.ts`
  - `src/lib/api/alunos.ts`
  - `src/lib/shared/types/aluno.ts`

- Se for mexer em CRM/prospects, leia:
  - `src/app/(portal)/crm`
  - `src/app/(portal)/prospects`
  - `src/lib/query/use-prospects.ts`
  - `src/lib/api/crm.ts`

- Se for mexer em vendas/matrículas/pagamentos, leia:
  - `src/app/(portal)/vendas/nova/page.tsx`
  - `src/lib/query/use-vendas.ts`
  - `src/lib/api/vendas.ts`
  - `src/lib/api/matriculas.ts`
  - `src/lib/api/pagamentos.ts`

- Se for mexer em RBAC/segurança, leia:
  - `src/lib/api/rbac.ts`
  - `src/lib/api/backoffice-seguranca/*`
  - `src/lib/backoffice/security-governance.ts`
  - `docs/SEGURANCA_RBAC_ACESSO_UNIDADE_PRD.md`
  - `docs/USUARIOS_IDENTIDADE_ACESSO_PRD.md`

- Se for mexer em backoffice global, leia:
  - `src/app/(backoffice)/admin/page.tsx`
  - `src/lib/backoffice/admin.ts`
  - `src/lib/api/backoffice.ts`
  - `docs/ai/DOMAIN_MAP.md`

- Se for mexer em onboarding/provisionamento/importação EVO, leia:
  - `src/lib/backoffice/onboarding.ts`
  - `src/lib/api/admin-onboarding-api.ts`
  - `src/lib/api/importacao-evo.ts`
  - `docs/USUARIOS_IDENTIDADE_ACESSO_BACKEND.md`

- Se for mexer em jornada pública de adesão, leia:
  - `src/app/(public)/adesao/page.tsx`
  - `src/lib/public/server-services.ts`
  - `src/lib/public/services.ts`
  - `src/lib/public/adesao-api.ts`
  - `docs/ai/KEY_FLOWS.md`

- Se for mexer em storefront, leia:
  - `src/proxy.ts`
  - `src/lib/storefront/subdomain.ts`
  - `src/app/(public)/storefront/page.tsx`
  - `src/app/(public)/storefront/[academiaSlug]/page.tsx`
  - `src/app/(public)/storefront/[academiaSlug]/layout.tsx`
  - `src/app/(public)/storefront-not-found/page.tsx`
  - `src/lib/public/storefront-api.ts`
  - `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`

- Se for mexer em status/health, leia:
  - `src/app/status/page.tsx`
  - `src/app/api/health/route.ts`
  - `src/lib/status/system-health.ts`

- Se for mexer em testes ou validar mudança, leia:
  - `docs/ai/TEST_MAP.md`
  - `playwright.config.ts`
  - `vitest.config.ts`
  - `tests/setup.ts`
  - `tests/e2e/support/protected-shell-mocks.ts`

- Se for mexer em contratos de API, leia antes:
  - `src/lib/api/*`
  - `src/lib/shared/types/*`
  - `tests/unit/integration-guide-contracts.spec.ts`
  - `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`

- Se for mexer em formulários, leia:
  - `AGENTS.md`
  - `src/lib/forms/README.md`
  - o schema `zod` co-localizado do formulário

## Regras práticas para futuras IAs

- Não assuma que `tenantId` sempre vai na query; confirme a regra em `src/lib/api/http.ts`.
- Não trate `academia`, `rede` e `grupo` como sinônimos perfeitos; confira os PRDs e os tipos atuais.
- Em mudanças públicas/storefront, cheque tanto slug quanto subdomínio.
- Em mudanças de auth/contexto, valide com testes de sessão e com pelo menos um fluxo E2E relacionado.
- Em mudanças de contrato, prefira documentar a lacuna a adivinhar o backend.
