# Sessão Única Contextualizada: Impacto no Frontend

## Objetivo

Mapear os pontos do frontend afetados pela estratégia de sessão única contextualizada para o fluxo `backoffice -> entrar como academia/unidade -> dashboard`, usando um único token enriquecido com `redeId` e `activeTenantId`.

Esta task não implementa o handoff novo. O objetivo aqui é deixar explícito onde o frontend hoje assume `switchTenant` puro e quais áreas precisam evoluir nas tasks `411` a `415`.

## Decisão de produto e contrato

- Não haverá duas sessões paralelas.
- O frontend passa a operar com uma sessão única.
- O usuário continua sendo o mesmo; o que muda é o contexto ativo de rede/unidade.
- O backend deve reemitir a sessão a partir do backoffice com `redeId` e `activeTenantId` coerentes com a academia/unidade escolhidas.
- O frontend deve tratar `activeTenantId` como fonte de verdade inicial para o contexto operacional.

Contrato alvo do backend:

- `POST /api/v1/admin/auth/entrar-como-unidade`
- Request:

```json
{
  "academiaId": "uuid",
  "tenantId": "uuid",
  "justificativa": "opcional"
}
```

- Response esperada: mesmo envelope de `TokenResponseDTO`, já consumido hoje em `auth.ts`, com `token`, `refreshToken`, `redeId`, `activeTenantId`, `availableTenants` e demais metadados de sessão.

## Fluxo atual no frontend

### 1. Login administrativo

Arquivo principal:

- [src/app/admin-login/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/admin-login/page.tsx)

Estado atual:

- usa `adminLoginApi`
- salva a sessão retornada
- redireciona para `/admin`

Dependência técnica:

- [src/lib/api/auth.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/auth.ts)

Hoje `adminLoginApi` já persiste:

- token
- refresh token
- `redeId`
- `activeTenantId`
- `availableTenants`
- `availableScopes`

Observação:

- a sessão global já usa o mesmo armazenamento da sessão operacional; isso favorece a estratégia de token único reemitido.

### 2. Entrada na visão operacional

Arquivo principal:

- [src/app/(backoffice)/admin/entrar-como-academia/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(backoffice)/admin/entrar-como-academia/page.tsx)

Estado atual:

- carrega unidades via `getTenantContextApi()`
- agrupa visualmente por academia
- ao confirmar, chama `setPreferredTenantId(selectedTenantId)`
- em seguida chama `switchActiveTenant(selectedTenantId)`
- depois navega com `window.location.assign("/dashboard")`

Dependências técnicas:

- [src/lib/tenant/hooks/use-session-context.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/hooks/use-session-context.tsx)
- [src/lib/api/auth.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/auth.ts)
- [src/lib/api/session.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/session.ts)

Risco principal:

- o fluxo atual assume que “entrar como academia” é apenas trocar tenant via `POST /api/v1/auth/context/tenant`.
- isso não cobre o novo handoff administrativo oficial com `academiaId + tenantId`.

### 3. Bootstrap e contexto operacional

Arquivos principais:

- [src/lib/tenant/hooks/session-bootstrap.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/hooks/session-bootstrap.ts)
- [src/lib/tenant/hooks/use-session-context.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/hooks/use-session-context.tsx)
- [src/lib/tenant/tenant-context.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/tenant-context.ts)

Estado atual:

- o bootstrap usa `/api/v1/app/bootstrap` quando disponível
- fallback usa `/api/v1/auth/me`, `/api/v1/context/unidade-ativa` e `/api/v1/academia`
- o `tenant-context` sincroniza a sessão com a unidade ativa vinda do backend
- o `switchActiveTenant` ainda é orientado a `switchTenantApi`

Impacto esperado:

- o bootstrap precisa aceitar a nova sessão contextualizada sem roundtrip extra para “descobrir” a unidade ativa
- o `activeTenantId` retornado pelo handoff deve ser suficiente para iniciar o dashboard
- o fluxo de sincronização não pode sobrescrever imediatamente o contexto recém-emitido pelo novo token

### 4. SSR e cookies de sessão

Arquivos principais:

- [src/lib/api/session.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/session.ts)
- [src/app/(app)/dashboard/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(app)/dashboard/page.tsx)
- [src/lib/shared/create-tenant-loader.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/lib/shared/create-tenant-loader.tsx)

Estado atual:

- `saveAuthSession` escreve cookie `academia-active-tenant-id`
- loaders SSR leem esse cookie para buscar dados por tenant

Impacto esperado:

- se o handoff reemitir a sessão corretamente, o SSR do dashboard já deve funcionar sem camada extra de adaptação
- a robustez do fluxo depende de o novo endpoint voltar com `activeTenantId` consistente e de `saveAuthSession` continuar sendo o ponto único de persistência

### 5. Normalização e envio de contexto para a API

Arquivo principal:

- [src/lib/api/http.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/http.ts)

Estado atual:

- injeta `Authorization`
- injeta `X-Context-Id`
- usa `activeTenantId` e `preferredTenantId` da sessão para resolver `tenantId`
- trata rotas operacionais e rotas que ainda exigem `tenantId` explícito

Impacto esperado:

- o wrapper HTTP deve continuar funcionando com a sessão contextualizada única
- a regra de fallback de tenant precisa priorizar o `activeTenantId` recém-emitido pelo handoff
- precisamos evitar estados mistos em que o token aponta para uma unidade e o query/header apontam para outra

## Áreas de código impactadas

### Sessão e contrato

- [src/lib/api/auth.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/auth.ts)
- [src/lib/api/session.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/session.ts)
- [src/lib/api/token-store.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/api/token-store.ts)

Mudanças esperadas nas próximas tasks:

- adicionar client do endpoint oficial de handoff
- garantir normalização do payload novo sem heurística paralela
- preservar refresh token, `redeId`, `activeTenantId` e escopos na mesma sessão

### Backoffice

- [src/app/admin-login/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/admin-login/page.tsx)
- [src/app/(backoffice)/admin/entrar-como-academia/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(backoffice)/admin/entrar-como-academia/page.tsx)

Mudanças esperadas nas próximas tasks:

- trocar `switchTenantApi` pelo endpoint oficial de handoff
- carregar academia e unidade como parâmetros explícitos do request
- manter a navegação para `/dashboard` apoiada na nova sessão já reemitida

### Contexto operacional e bootstrap

- [src/lib/tenant/hooks/session-bootstrap.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/hooks/session-bootstrap.ts)
- [src/lib/tenant/hooks/use-session-context.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/hooks/use-session-context.tsx)
- [src/lib/tenant/tenant-context.ts](/Users/sergioamim/dev/pessoal/academia-app/src/lib/tenant/tenant-context.ts)
- [src/lib/shared/create-tenant-loader.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/lib/shared/create-tenant-loader.tsx)
- [src/app/(app)/dashboard/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(app)/dashboard/page.tsx)

Mudanças esperadas nas próximas tasks:

- consumir o tenant ativo da sessão nova como estado inicial
- evitar reparos automáticos que revertam o contexto reemitido
- alinhar loaders SSR e bootstrap client ao novo fluxo

### Testes e mocks

- [tests/e2e/support/auth-session.ts](/Users/sergioamim/dev/pessoal/academia-app/tests/e2e/support/auth-session.ts)
- [tests/e2e/support/backoffice-global-session.ts](/Users/sergioamim/dev/pessoal/academia-app/tests/e2e/support/backoffice-global-session.ts)
- [tests/e2e/support/protected-shell-mocks.ts](/Users/sergioamim/dev/pessoal/academia-app/tests/e2e/support/protected-shell-mocks.ts)
- [tests/e2e/auth-rede.spec.ts](/Users/sergioamim/dev/pessoal/academia-app/tests/e2e/auth-rede.spec.ts)

Mudanças esperadas nas próximas tasks:

- introduzir mock do endpoint oficial de handoff
- validar que a sessão é sobrescrita com `activeTenantId` novo
- cobrir `/admin -> entrar como academia -> /dashboard`

## Riscos identificados

### 1. Página atual ainda depende de `getTenantContextApi`

O fluxo de seleção hoje lê a lista de unidades a partir do contexto atual da sessão. Com o endpoint oficial, pode continuar servindo como fonte de listagem, mas a ação final precisa mudar para um handoff administrativo explícito.

### 2. `switchActiveTenant` mistura troca operacional normal com handoff admin

Hoje o hook assume que trocar unidade e entrar no operacional são o mesmo caso. A solução nova precisa separar:

- troca operacional comum de tenant
- handoff administrativo oficial

### 3. Bootstrap pode sobrescrever o contexto recém-emitido

Como o `session-bootstrap` ainda consulta `/context/unidade-ativa`, precisamos garantir que o backend e o frontend não entrem em disputa sobre qual tenant está ativo logo após o handoff.

### 4. Testes atuais modelam o backoffice como sessão global com tenant fixo

Os helpers E2E já carregam `activeTenantId` e `availableTenants`, mas ainda não modelam a chamada do novo endpoint oficial. Isso pode mascarar regressões se não for atualizado.

## Encadeamento recomendado das próximas tasks

### Task 411

- adaptar `auth.ts` e `session.ts`
- criar client do endpoint oficial
- normalizar o novo payload de sessão

### Task 412

- atualizar `entrar-como-academia/page.tsx`
- trocar a ação final para o handoff oficial
- manter UX de seleção de academia/unidade

### Task 413

- alinhar bootstrap, hooks e loaders SSR
- garantir coerência entre token, cookie e contexto

### Task 414

- atualizar testes, mocks e tipos auxiliares
- revisar contratos consumidos no frontend

### Task 415

- validar o handoff completo
- cobrir login admin, escolha de unidade, dashboard, refresh e retorno seguro em erro

## Critério de encerramento da task 410

A task 410 fica satisfeita quando existe um inventário claro e rastreável dos pontos impactados pelo token único contextualizado, sem ainda implementar o handoff final. Este documento registra:

- o fluxo atual
- os pontos de acoplamento com sessão/contexto
- os riscos técnicos
- a sequência de mudança para as tasks seguintes
