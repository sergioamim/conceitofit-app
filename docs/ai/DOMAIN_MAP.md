# DOMAIN_MAP

## Visão por domínio

### 1. Sessão, autenticação e contexto multiunidade

- Responsabilidade:
  - login legado e login contextual por rede
  - persistência de tokens e claims
  - unidade ativa, unidade base, rede e escopos
  - bootstrap do shell autenticado
- Arquivos centrais:
  - `src/lib/api/auth.ts`
  - `src/lib/api/session.ts`
  - `src/lib/api/token-store.ts`
  - `src/lib/api/contexto-unidades.ts`
  - `src/lib/api/http.ts`
  - `src/lib/tenant/hooks/use-session-context.tsx`
  - `src/lib/tenant/hooks/session-bootstrap.ts`
  - `src/lib/tenant/tenant-context.ts`
  - `src/components/auth/network-access-flow.tsx`
  - `src/components/auth/legacy-login-flow.tsx`
  - `src/components/auth/forced-password-change-flow.tsx`
- Conceitos centrais:
  - `AuthSession`
  - `AuthUser`
  - `activeTenantId`
  - `baseTenantId`
  - `availableTenants`
  - `availableScopes`
  - `broadAccess`
  - `networkSubdomain` / `networkSlug`

### 2. Shell operacional autenticado

- Responsabilidade:
  - navegação principal do operador
  - sidebar/topbar/comando rápido
  - sincronização de branding e Sentry
  - gate de acesso operacional por unidade elegível
- Arquivos centrais:
  - `src/app/(app)/layout.tsx`
  - `src/components/layout/sidebar.tsx`
  - `src/components/layout/app-topbar.tsx`
  - `src/components/layout/tenant-theme-sync.tsx`
  - `src/components/layout/backend-status-banner.tsx`
  - `src/components/layout/command-palette.tsx`

### 3. Comercial e clientes

- Responsabilidade:
  - clientes, alunos, matrículas, pagamentos, vendas e catálogos comerciais
- Arquivos centrais:
  - `src/app/(app)/clientes`
  - `src/app/(app)/vendas`
  - `src/app/(app)/matriculas`
  - `src/app/(app)/pagamentos`
  - `src/app/(app)/planos`
  - `src/lib/query/use-clientes.ts`
  - `src/lib/query/use-vendas.ts`
  - `src/lib/api/alunos.ts`
  - `src/lib/api/matriculas.ts`
  - `src/lib/api/pagamentos.ts`
  - `src/lib/api/vendas.ts`
  - `src/lib/api/comercial-catalogo.ts`
- Componentes recorrentes:
  - `src/components/shared/nova-matricula-modal.tsx`
  - `src/components/shared/receber-pagamento-modal.tsx`
  - `src/components/shared/plano-selector-card.tsx`

### 4. CRM

- Responsabilidade:
  - prospects, pipeline comercial, cadências e follow-up
- Arquivos centrais:
  - `src/app/(app)/crm`
  - `src/app/(app)/prospects`
  - `src/lib/query/use-prospects.ts`
  - `src/lib/api/crm.ts`
  - `src/lib/api/crm-cadencias.ts`
- Comportamento relevante:
  - o hook `use-prospects` dispara cadências ao criar ou mover prospect
  - há update otimista no kanban

### 5. Financeiro gerencial e administrativo

- Responsabilidade:
  - contas a pagar/receber, DRE, formas de pagamento, contas bancárias, conciliação
- Arquivos centrais:
  - `src/lib/api/financeiro-gerencial.ts`
  - `src/lib/api/contas-receber.ts`
  - `src/lib/api/formas-pagamento.ts`
  - `src/lib/api/contas-bancarias.ts`
  - `src/lib/api/conciliacao-bancaria.ts`
  - páginas em `src/app/(app)/administrativo/*` e `src/app/(app)/gerencial/*` quando presentes

### 6. Grade, aulas, reservas, catraca e monitor

- Responsabilidade:
  - mural/grade, reservas de aulas, check-in/catraca e monitor de boas-vindas
- Arquivos centrais:
  - `src/app/(app)/grade`
  - `src/app/(app)/reservas`
  - `src/app/monitor/boas-vindas/page.tsx`
  - `src/lib/api/grade-mural.ts`
  - `src/lib/api/reservas.ts`
  - `src/lib/api/catraca.ts`
  - `src/components/grade/grade-week-mural-board.tsx`
  - `src/components/monitor/catraca-welcome-monitor.tsx`

### 7. Treinos

- Responsabilidade:
  - templates, exercícios, atribuição e editor Treinos V2
- Arquivos centrais:
  - `src/app/(app)/treinos`
  - `src/components/treinos/treino-v2-editor.tsx`
  - `src/lib/api/treinos.ts`
  - `src/lib/api/treinos-v2.ts`

### 8. Backoffice global

- Responsabilidade:
  - academias/unidades globais
  - segurança global
  - onboarding/provisionamento
  - importação EVO
  - métricas e compliance
- Arquivos centrais:
  - `src/app/(backoffice)/admin`
  - `src/lib/backoffice/admin.ts`
  - `src/lib/backoffice/security-governance.ts`
  - `src/lib/backoffice/onboarding.ts`
  - `src/lib/api/backoffice.ts`
  - `src/lib/api/backoffice-seguranca/*`
  - `src/lib/api/admin-onboarding-api.ts`
  - `src/lib/api/importacao-evo.ts`

### 9. Área do aluno

- Responsabilidade:
  - shell simplificado para aluno autenticado
  - perfil, pagamentos, aulas, treinos e check-in
- Arquivos centrais:
  - `src/app/(aluno)/layout.tsx`
  - `src/app/(aluno)/meu-perfil/page.tsx`
  - `src/app/(aluno)/meus-pagamentos/page.tsx`
  - `src/app/(aluno)/minhas-aulas/page.tsx`
  - `src/app/(aluno)/meus-treinos/page.tsx`
  - `src/app/(aluno)/check-in/page.tsx`

### 10. Jornada pública e storefront

- Responsabilidade:
  - adesão pública por tenant
  - geração de lead B2B
  - demo account pública
  - storefront por `academiaSlug` ou subdomínio
- Arquivos centrais:
  - `src/app/(public)/adesao`
  - `src/lib/public/services.ts`
  - `src/lib/public/server-services.ts`
  - `src/lib/public/adesao-api.ts`
  - `src/lib/public/demo-account-api.ts`
  - `src/lib/public/lead-b2b-api.ts`
  - `src/app/storefront/[academiaSlug]/page.tsx`
  - `src/app/storefront/[academiaSlug]/layout.tsx`
  - `src/lib/public/storefront-api.ts`
  - `src/proxy.ts`

## Fronteiras importantes

- Fato observado: `src/lib/api/http.ts` aplica contexto automático de tenant em rotas operacionais e retira `tenantId` da query quando o `X-Context-Id` é a fonte canônica.
- Fato observado: `src/lib/api/rbac.ts` usa `includeContextHeader: false`; segurança/RBAC não segue a mesma regra de contexto das rotas operacionais.
- Fato observado: `src/lib/shared/server-fetch.ts` é exclusivamente server-side; não deve ser reutilizado em componentes client.
- Fato observado: a área pública usa outra família de endpoints (`/api/v1/publico/*`) e, em adesão, outro header (`X-Adesao-Token`).
- Inferência operacional: mudanças em `session.ts`, `http.ts`, `contexto-unidades.ts` ou `tenant-context.ts` atravessam quase todo o produto.

## Entidades e conceitos centrais

- `Tenant`: unidade operacional
- `Academia`: agregação/rede visível ao frontend atual
- `AuthSession` / `AuthUser`: sessão autenticada e usuário atual
- `TenantOperationalEligibility`: elegibilidade operacional por unidade
- `Aluno`, `Prospect`, `Plano`, `Matricula`, `Pagamento`, `Venda`
- `UnidadeOnboardingState`: onboarding/provisionamento de unidade
- `StorefrontTheme` e `PublicTenantContext`

## Vocabulário local

- `tenant`: unidade ativa ou unidade-base, dependendo do contexto
- `academia`: entidade institucional usada no shell/backoffice e branding
- `rede`: contexto de autenticação por subdomínio/login contextual
- `unidade ativa`: tenant atual da sessão
- `unidade base`: tenant estrutural/default do usuário ou cliente
- `backoffice`: administração global em `/admin`
- `storefront`: site público orientado a marketing/SEO

## Fonte de verdade por área

- Sessão/contexto:
  - `src/lib/api/session.ts`
  - `src/lib/tenant/hooks/use-session-context.tsx`
- Contratos de domínio:
  - `src/lib/shared/types/*.ts`
- Formulários:
  - `src/lib/forms/*.ts`
  - schemas co-localizados como `src/components/planos/plano-form-schema.ts`
- Segurança global:
  - `src/lib/api/backoffice-seguranca/*`
  - `src/lib/backoffice/security-governance.ts`
- Jornada pública/storefront:
  - `src/lib/public/*.ts`
  - `src/proxy.ts`

## Lacunas conhecidas

- Lacuna conhecida: a distinção conceitual entre `academia`, `rede` e `grupo` aparece em PRDs e contratos, mas ainda não está uniformemente refletida nos tipos e nomes de arquivo do frontend.
- Lacuna conhecida: o repositório contém documentação de auditoria apontando contratos inexistentes ou divergentes com o backend; nem toda divergência pode ser confirmada só pelo código deste frontend.
