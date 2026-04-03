# PROJECT_CONTEXT

## Propósito do projeto

- Fato observado: o repositório é um frontend `Next.js` App Router para operação de academias multiunidade, com áreas autenticadas operacionais, backoffice global, jornada pública de adesão, storefront pública e área do aluno. Fontes:
  - `README.md`
  - `src/app/(app)`
  - `src/app/(backoffice)`
  - `src/app/(public)`
  - `src/app/storefront`
  - `src/app/(aluno)`
- Fato observado: a home raiz redireciona para `/dashboard`, indicando que o shell autenticado é a entrada principal do produto. Fonte:
  - `src/app/page.tsx`

## Stack principal

- Fato observado:
  - `Next.js 16.1.6` com App Router
  - `React 19.2.3`
  - `TypeScript 5`
  - `Tailwind CSS 4`
  - `TanStack Query 5`
  - `react-hook-form` + `zod` + `@hookform/resolvers`
  - componentes `Radix`/`shadcn`
  - `Sentry` opcional
  - testes com `Vitest`, `happy-dom`, `Testing Library`, `vitest-axe` e `Playwright`
- Fonte de verdade:
  - `package.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `src/app/layout.tsx`

## Como subir localmente

- Fato observado:
  - dev padrão: `npm run dev`
  - dev com backend real local: `npm run dev:api`
  - dev em `3001` com backend real: `npm run dev:3001:api`
  - build/start local: `npm run prod:local`
- Fato observado: o README assume backend Java disponível e proxy `/backend/* -> BACKEND_PROXY_TARGET`.
- Fonte de verdade:
  - `README.md`
  - `package.json`
  - `next.config.ts`

## Como rodar testes

- Fato observado:
  - `npm test` executa `vitest run`
  - `npm run test:coverage` executa cobertura Vitest
  - `npm run e2e` e `npm run test:e2e` executam Playwright
  - `npm run test:e2e:smoke-real` liga um cenário Playwright contra backend real
  - scripts `coverage:*` usam uma trilha própria descrita na documentação
- Importante:
  - `vitest.config.ts` inclui apenas `tests/**/*.test.ts` e `tests/**/*.test.tsx`
  - muitos arquivos em `tests/unit/**/*.spec.ts` usam `@playwright/test`, não entram no `npm test`
- Fonte de verdade:
  - `package.json`
  - `vitest.config.ts`
  - `playwright.config.ts`
  - `docs/TEST_COVERAGE_CORE.md`
  - `docs/TEST_COVERAGE_GOVERNANCE.md`

## Convenções importantes

- Fato observado: formulários novos/refatorados devem convergir para `react-hook-form` + `zod`. Fontes:
  - `AGENTS.md`
  - `src/lib/forms/README.md`
- Fato observado: o projeto é sensível a SSR/hydration. Há guardrails explícitos contra `Date.now()`, `Math.random()`, `new Date()` e conteúdo client-only no primeiro render hidratável. Fonte:
  - `AGENTS.md`
- Fato observado: o shell autenticado usa `TenantContextProvider` como centro de sessão/contexto/unidade. Fontes:
  - `src/app/(app)/layout.tsx`
  - `src/app/(aluno)/layout.tsx`
  - `src/lib/tenant/hooks/use-session-context.tsx`
- Fato observado: há dois caminhos de fetch:
  - browser/client: `apiRequest()` em `src/lib/api/http.ts`, normalmente indo para `/backend/...`
  - server/RSC: `serverFetch()` em `src/lib/shared/server-fetch.ts`, indo direto em `BACKEND_PROXY_TARGET`

## Diretórios principais

- `src/app`
  - roteamento principal por área do produto
- `src/components`
  - UI reutilizável, modais, shells, fluxos de auth e storefront
- `src/lib/api`
  - clientes HTTP e normalização de payloads
- `src/lib/shared/types`
  - tipos de domínio compartilhados
- `src/lib/forms`
  - schemas `zod` compartilhados
- `src/lib/query`
  - hooks `TanStack Query` e chaves
- `src/lib/tenant`
  - contexto de unidade, branding, acesso operacional e runtime multiunidade
- `src/lib/public`
  - jornada pública, adesão, demo account e storefront
- `src/lib/backoffice`
  - composição e heurísticas do backoffice global
- `tests`
  - `a11y`, `components`, `hooks`, `unit`, `e2e`
- `docs`
  - PRDs, auditorias, baselines de Playwright/cobertura e runbooks

## Fonte de verdade de contratos e configuração

- Contratos de API consumidos pelo frontend:
  - fonte operacional atual: `src/lib/api/*.ts`
  - tipos compartilhados: `src/lib/shared/types/*.ts`
  - validações de entrada: `src/lib/forms/*.ts`
- Configuração de runtime:
  - `src/lib/env.ts`
  - `next.config.ts`
  - `src/proxy.ts`
- Contratos documentais relevantes, mas não necessariamente perfeitos:
  - `docs/FRONTEND_INTEGRATION_GUIDE.json`
  - `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`
  - `docs/BACKEND_REAL_INTEGRATION_VALIDATION.md`

## Leitura rápida recomendada

- Se precisar entender o shell autenticado:
  - `src/app/(app)/layout.tsx`
  - `src/lib/tenant/hooks/use-session-context.tsx`
  - `src/lib/api/http.ts`
- Se precisar entender integração backend:
  - `src/lib/api/http.ts`
  - `src/lib/shared/server-fetch.ts`
  - `src/lib/api/contexto-unidades.ts`
- Se precisar entender a superfície pública:
  - `src/app/(public)/adesao/page.tsx`
  - `src/lib/public/services.ts`
  - `src/app/storefront/[academiaSlug]/page.tsx`
