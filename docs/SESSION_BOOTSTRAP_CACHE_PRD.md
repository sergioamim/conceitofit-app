# PRD: Bootstrap de Sessão, Unidade Ativa e Branding

## 1. Resumo executivo

Hoje o shell autenticado faz chamadas repetidas para dados quase estáveis da sessão, especialmente:

- `GET /api/v1/context/unidade-ativa`
- `GET /api/v1/auth/me`
- `GET /api/v1/academia`

Na prática, a unidade ativa já deveria ser um estado global do usuário e atuar como ponto único de verdade da aplicação. O mesmo vale para os metadados de sessão, permissões derivadas e branding da academia.

Este PRD propõe consolidar esses dados em um store global de bootstrap da sessão, com persistência local, atualização explícita quando o usuário troca de unidade e invalidação controlada. O objetivo é eliminar chamadas redundantes em navegação interna, reduzir latência percebida e simplificar o shell SSR/CSR.

## 2. Problema

### 2.1 Sintoma observado

Na rota `/clientes`, o Network tab mostra múltiplas chamadas de bootstrap para dados que não mudam a cada navegação:

- `/backend/api/v1/context/unidade-ativa`
- `/backend/api/v1/academia`
- `/backend/api/v1/auth/me`

Isso adiciona latência no primeiro paint útil e encarece navegação entre telas operacionais.

### 2.2 Evidência no código atual

Os fetches estão distribuídos por múltiplos pontos do shell:

- `src/hooks/use-session-context.tsx`
  - `TenantContextProvider` sempre executa `getTenantContextApi()` no bootstrap.
  - `useAuthAccess()` executa `meApi()` de forma independente por consumidor.
- `src/components/layout/sidebar.tsx`
  - busca `listAcademiasApi()` para branding.
  - consome `useAuthAccess()` para decidir menus.
- `src/components/layout/tenant-theme-sync.tsx`
  - busca `listAcademiasApi()` novamente para aplicar tema.
- `src/app/(app)/layout.tsx`
  - monta `TenantContextProvider`, `TenantThemeSync`, `Sidebar` e `AppTopbar` no shell global.

Além disso:

- `src/lib/api/session.ts` já persiste `activeTenantId` e `availableTenants`.
- `src/lib/tenant-context.ts` já mantém uma memória local otimista de `tenantAtual` e `tenants`.
- porém ainda não existe uma fonte única para:
  - claims do usuário
  - papéis/permissões derivadas
  - academia/branding
  - status consolidado de bootstrap

### 2.3 Observação importante sobre ambiente de desenvolvimento

Em ambiente dev do Next.js, React Strict Mode e HMR podem duplicar efeitos e amplificar a percepção de chamadas repetidas. Mesmo assim, o problema arquitetural continua real:

- o bootstrap é orientado a montagem de componentes;
- os mesmos dados são carregados por consumidores diferentes;
- não existe cache global unificado para o shell.

Ou seja, mesmo descontando duplicação de dev, ainda há desperdício estrutural.

## 3. Objetivo do produto

Transformar sessão, unidade ativa e branding em estado global reutilizável do shell autenticado, de forma que:

- a unidade ativa seja o ponto único de verdade da aplicação;
- navegação interna não refaça bootstrap de sessão sem necessidade;
- branding e permissões sejam consumidos do store, não carregados por cada componente;
- troca de unidade seja uma ação centralizada, com atualização previsível de toda a UI.

## 4. Objetivos

### 4.1 Objetivos principais

1. Eliminar chamadas redundantes de `/auth/me`, `/context/unidade-ativa` e `/academia` em navegação interna comum.
2. Tornar `activeTenantId` um estado global de sessão com persistência e atualização única.
3. Fazer `Sidebar`, `TenantThemeSync`, `Topbar` e hooks de acesso consumirem o mesmo snapshot.
4. Reduzir latência percebida no shell autenticado.
5. Simplificar recuperação de contexto quando a unidade ativa estiver ausente ou desincronizada.

### 4.2 Objetivos secundários

1. Reduzir risco de hydration frágil causado por múltiplos loaders do shell.
2. Diminuir número de retries em cascata para rotas operacionais.
3. Preparar a base para um endpoint futuro de bootstrap unificado no backend.

## 5. Não objetivos

1. Não cachear listas operacionais voláteis como clientes, pagamentos, aulas ou vendas.
2. Não relaxar validação de `X-Context-Id` no backend.
3. Não remover a possibilidade de refresh manual ou recuperação de sessão.
4. Não redesenhar o modelo de auth inteiro neste primeiro ciclo.

## 6. Escopo

### 6.1 Em escopo

- store global de bootstrap da sessão no frontend autenticado;
- consolidação de:
  - usuário autenticado
  - roles normalizadas
  - `canAccessElevatedModules`
  - unidade ativa
  - unidades disponíveis
  - academia atual
  - branding efetivo
  - timestamps e status de cache
- troca centralizada de unidade ativa;
- remoção de fetches duplicados no shell;
- invalidadores explícitos por login, logout, refresh, troca de unidade e edição da academia;
- observabilidade básica para contar bootstrap hits.

### 6.2 Fora de escopo

- unificar todas as APIs do sistema em cache global;
- reescrever telas administrativas específicas;
- redesenhar RBAC funcional no backend.

## 7. Requisitos funcionais

### 7.1 Fonte única de verdade

O frontend deve manter um store global de sessão autenticada contendo, no mínimo:

- `authUser`
- `roles`
- `canAccessElevatedModules`
- `activeTenantId`
- `activeTenant`
- `availableTenants`
- `academia`
- `brandingSnapshot`
- `status`
- `lastBootstrapAt`
- `lastTenantSyncAt`

Esse store deve ser a fonte primária para o shell autenticado.

### 7.2 Unidade ativa como estado global do usuário

`activeTenantId` deve ser tratado como estado global persistido e sincronizado entre abas.

Regras:

1. O valor inicial vem do snapshot persistido em sessão/local storage.
2. A troca de unidade só ocorre via ação centralizada, por exemplo `switchActiveTenant(tenantId)`.
3. Essa ação chama o endpoint canônico de troca de contexto uma única vez.
4. Após sucesso, o store inteiro é atualizado.
5. Todos os consumidores reagem ao mesmo evento/selector.

### 7.3 Sem bootstrap redundante por rota

Em navegação interna autenticada:

- não deve haver novo `GET /auth/me` por simples troca de rota;
- não deve haver novo `GET /context/unidade-ativa` por simples troca de rota;
- não deve haver novo `GET /academia` por simples troca de rota;
- esses dados só podem ser recarregados quando houver invalidação explícita.

### 7.4 Branding centralizado

`Sidebar` e `TenantThemeSync` não devem fazer fetch próprio de academia. Ambos devem consumir `academia` e `brandingSnapshot` do store global.

### 7.5 Permissões centralizadas

`useAuthAccess()` deve passar a ser um selector sobre o store global, sem chamar `meApi()` por conta própria em cada uso.

### 7.6 Recuperação de contexto

Se uma rota operacional responder que a unidade ativa está ausente ou divergente:

1. o wrapper HTTP continua podendo reparar o contexto;
2. após a reparação, o store global deve ser sincronizado;
3. a UI não deve permanecer com snapshot stale.

## 8. Requisitos não funcionais

1. Persistência local segura para estado não sensível além do token.
2. Sincronização entre abas usando eventos já existentes (`storage`, `AUTH_SESSION_UPDATED_EVENT`, `TENANT_CONTEXT_UPDATED_EVENT`).
3. Compatibilidade com SSR segura: o primeiro render continua usando fallback estável.
4. Nenhuma dependência de `window` em caminhos SSR críticos antes do mount.
5. Telemetria para medir quantidade de bootstrap calls por sessão e por navegação.

## 9. Estado atual resumido

### 9.1 O que já existe e deve ser reaproveitado

- `src/lib/api/session.ts`
  - persiste `activeTenantId` e `availableTenants`.
- `src/lib/tenant-context.ts`
  - já resolve snapshot otimista e memória local de tenant.
- `src/hooks/use-session-context.tsx`
  - já centraliza parte do contexto de tenant.
- `src/lib/api/http.ts`
  - já injeta e recupera `X-Context-Id`.

### 9.2 O que falta

- store global para `me` e academia;
- invalidadores formais de bootstrap;
- selectors centralizados para shell e RBAC;
- eliminação dos fetches de academia no sidebar e no theme sync;
- política clara de cache/freshness.

## 10. Proposta de solução

### 10.1 Solução alvo

Criar um `SessionBootstrapStore` no frontend autenticado, responsável por carregar, persistir e expor:

- sessão básica
- contexto ativo do tenant
- usuário autenticado
- permissões derivadas
- academia/branding

Esse store será o backend-for-frontend interno do shell.

### 10.2 Estratégia de bootstrap

### Fase A: hidratação otimista

Ao montar o app autenticado:

1. hidratar de memória/local storage;
2. renderizar shell com snapshot estável;
3. disparar refresh assíncrono apenas se o snapshot estiver ausente, incompleto ou inválido.

### Fase B: refresh controlado

O refresh buscará:

1. contexto ativo do tenant;
2. claims do usuário, quando necessário;
3. academia/branding, quando necessário.

Essas chamadas passam a ser coordenadas por um único serviço, e não por cada componente.

### 10.3 Política de freshness

### `activeTenantId` e `availableTenants`

- válidos até:
  - logout
  - login de outro usuário
  - troca explícita de tenant
  - erro de contexto irrecuperável

### `authUser` e permissões

- válidos até:
  - logout
  - refresh de token com mudança de claims
  - troca de tenant, se o modelo de permissão for tenant-dependente

### `academia`

- válida até:
  - troca para unidade de outra academia
  - edição de academia
  - invalidation manual

### 10.4 Ação centralizada de troca de tenant

A ação `switchActiveTenant(tenantId)` deve:

1. chamar `PUT /api/v1/context/unidade-ativa/{tenantId}`;
2. atualizar `activeTenantId`, `activeTenant` e `availableTenants`;
3. decidir se `academia` precisa ser mantida ou invalidada;
4. recalcular branding efetivo;
5. notificar todos os consumidores.

### 10.5 Consumo no shell

### Componentes que devem migrar para o store

- `Sidebar`
- `TenantThemeSync`
- `AppTopbar`
- `useAuthAccess`

### Resultado esperado

Esses consumidores deixam de fazer fetch próprio e passam a ler selectors como:

- `useSessionBootstrap()`
- `useActiveTenant()`
- `useAcademiaBranding()`
- `useAuthClaims()`

## 11. Evolução opcional de backend

O ciclo inicial pode ser feito apenas no frontend, mas o desenho ideal inclui um endpoint de bootstrap consolidado.

### 11.1 Endpoint recomendado

Exemplo conceitual:

- `GET /api/v1/app/bootstrap`

Payload esperado:

- `user`
- `tenantContext`
- `academia`
- `branding`
- `capabilities`

Contrato mínimo acordado na Fase 4:

```json
{
  "user": {
    "id": "uuid",
    "nome": "string",
    "email": "string",
    "roles": ["string"],
    "activeTenantId": "uuid",
    "availableTenants": [
      {
        "tenantId": "uuid",
        "defaultTenant": true
      }
    ]
  },
  "tenantContext": {
    "currentTenantId": "uuid",
    "tenantAtual": { "id": "uuid", "nome": "string" },
    "unidadesDisponiveis": [{ "id": "uuid", "nome": "string" }]
  },
  "academia": { "id": "uuid", "nome": "string" },
  "branding": {
    "appName": "string",
    "logoUrl": "string",
    "themePreset": "CONCEITO_DARK",
    "useCustomColors": false,
    "colors": {}
  },
  "capabilities": {
    "canAccessElevatedModules": true
  }
}
```

Regras:

- `tenantContext` precisa reconstruir o snapshot usado pelo shell (`currentTenantId`, `tenantAtual` e `unidadesDisponiveis`).
- `user.roles` e `capabilities.canAccessElevatedModules` devem ficar consistentes; `capabilities` tem precedência sobre a derivação local.
- `academia` e `branding` representam o estado visual ativo no tenant/academia.

### 11.2 Benefícios

1. reduz round-trips no cold start;
2. simplifica consistência entre `me`, `tenantContext` e `academia`;
3. facilita cache/etag/telemetria;
4. reduz lógica de composição no frontend.

### 11.3 Observação

Mesmo sem esse endpoint, o PRD continua válido. O frontend deve primeiro parar de duplicar fetches entre componentes.

## 12. Rollout proposto

### Fase 0: medição

1. medir bootstrap atual em dev e em build de produção local;
2. registrar:
  - calls por primeira carga autenticada
  - calls por navegação interna
  - calls por troca de unidade

### Fase 1: store unificado

1. expandir o contexto atual para incluir:
  - `authUser`
  - `roles`
  - `canAccessElevatedModules`
  - `academia`
2. expor selectors dedicados.

### Fase 2: shell

1. remover `listAcademiasApi()` de `Sidebar`;
2. remover `listAcademiasApi()` de `TenantThemeSync`;
3. transformar `useAuthAccess()` em selector;
4. validar que `/clientes` e rotas equivalentes não refaçam bootstrap.

### Fase 3: invalidação

1. invalidar snapshot ao salvar academia;
2. invalidar claims se login/refresh mudar payload;
3. sincronizar store após recovery de contexto no wrapper HTTP.

### Fase 4: backend opcional

1. desenhar endpoint de bootstrap único;
2. migrar frontend para consumi-lo;
3. manter fallback para endpoints legados durante transição.

## 13. Critérios de aceite

### 13.1 Navegação

1. Ao navegar entre rotas autenticadas comuns, não deve haver nova chamada para:
   - `/api/v1/auth/me`
   - `/api/v1/context/unidade-ativa`
   - `/api/v1/academia`
2. Exceção: invalidação explícita ou recovery de erro.

### 13.2 Troca de unidade

1. Trocar a unidade ativa deve atualizar o store global.
2. O shell inteiro deve refletir a nova unidade sem refetch duplicado em múltiplos componentes.
3. Recarregar a página deve restaurar a última unidade ativa válida do usuário.

### 13.3 Shell

1. `Sidebar` não pode buscar academia por conta própria.
2. `TenantThemeSync` não pode buscar academia por conta própria.
3. `useAuthAccess()` não pode chamar `meApi()` em cada mount.

### 13.4 Consistência

1. Toda rota operacional continua usando o tenant ativo do contexto.
2. `X-Context-Id` continua sendo a referência operacional efetiva.
3. O sistema continua reparando contexto quando necessário, sem quebrar o store.

## 14. Métricas de sucesso

### Baseline desejado

Na primeira carga autenticada:

- alvo P1: no máximo 1 refresh coordenado de bootstrap;
- alvo P2: no máximo 1 request de bootstrap consolidado.

Em navegação interna:

- alvo: 0 chamadas de bootstrap.

Em troca de unidade:

- alvo: 1 chamada de troca de contexto + no máximo 1 refresh complementar.

## 15. Riscos

### 15.1 Claims dependentes de tenant

Se os papéis/permissões mudarem conforme o tenant ativo, `me` não pode ser cacheado para sempre. Nesse caso, trocar de tenant deve invalidar claims.

### 15.2 Drift entre sessão local e backend

Se o backend revogar acesso a uma unidade, o store local pode ficar stale. Isso exige repair no próximo refresh controlado.

### 15.3 Branding compartilhado por academia

Se unidades da mesma academia puderem ter branding próprio no futuro, o cache de academia precisará distinguir branding de academia e branding de unidade.

## 16. Perguntas em aberto

1. `roles` são globais ao usuário ou variam por tenant ativo?
2. `academia` pode ser considerada estável em toda a sessão ou precisa de TTL?
3. O backend pode expor um endpoint único de bootstrap no curto prazo?
4. O login/refresh pode passar a devolver claims suficientes para eliminar `me` no cold start?

## 17. Recomendação final

Executar em duas etapas:

1. **agora**: resolver inteiramente no frontend, promovendo o contexto atual para um store global de bootstrap;
2. **depois**: fechar a otimização com um endpoint de bootstrap consolidado no backend.

Isso atende o objetivo principal do produto sem depender imediatamente de mudança de contrato, e transforma a unidade ativa no ponto único de verdade da aplicação, como desejado.
