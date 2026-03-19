# Task ID: 31

**Title:** Consolidar bootstrap global de sessão, tenant ativo e branding no frontend

**Status:** done

**Dependencies:** 3 ✓, 28 ✓, 30 ✓

**Priority:** high

**Description:** Transformar sessão, unidade ativa e branding em um store global reutilizável do shell autenticado, eliminando fetches redundantes de `/auth/me`, `/context/unidade-ativa` e `/academia` na navegação interna.

**Details:**

Implementar a estratégia frontend-first descrita em `docs/SESSION_BOOTSTRAP_CACHE_PRD.md`: promover o contexto atual para um store global de bootstrap, tratar `activeTenantId` como ponto único de verdade da aplicação, migrar `Sidebar`, `TenantThemeSync`, `AppTopbar` e `useAuthAccess` para selectors desse store, e sincronizar o snapshot após troca de unidade, login, refresh, logout e recovery de contexto. O rollout deve preservar SSR seguro, evitar preload redundante por rota e manter `X-Context-Id` como referência operacional efetiva.

**Test Strategy:**

Medir baseline de chamadas em dev e produção local, cobrir com testes unitários os selectors e invalidadores do store, adicionar smoke/e2e para navegação autenticada sem refetch redundante e validar no Network tab que `/clientes` e rotas equivalentes não repetem `/auth/me`, `/context/unidade-ativa` e `/academia` sem invalidação explícita.

## Subtasks

### 31.1. Medir o baseline real do bootstrap do shell

**Status:** done  
**Dependencies:** None  

Levantar a linha de base atual de chamadas de bootstrap em primeira carga, navegação interna e troca de unidade.

**Details:**

Instrumentar ou medir em dev e em build local de produção quantas chamadas ocorrem para `/api/v1/auth/me`, `/api/v1/context/unidade-ativa` e `/api/v1/academia`, distinguindo duplicação estrutural de duplicação amplificada por Strict Mode/HMR.

### 31.2. Expandir o contexto atual para um store global de bootstrap

**Status:** done  
**Dependencies:** 31.1  

Consolidar no frontend autenticado o snapshot global de sessão, tenant ativo, claims e branding.

**Details:**

Reaproveitar `src/hooks/use-session-context.tsx`, `src/lib/api/session.ts` e `src/lib/tenant-context.ts` para expor um store unificado com `authUser`, `roles`, `canAccessElevatedModules`, `activeTenantId`, `activeTenant`, `availableTenants`, `academia`, `brandingSnapshot`, `status`, `lastBootstrapAt` e `lastTenantSyncAt`.

### 31.3. Migrar consumidores do shell para selectors

**Status:** done  
**Dependencies:** 31.2  

Eliminar fetches próprios de sessão e academia nos componentes estruturais do shell.

**Details:**

Refatorar `Sidebar`, `TenantThemeSync`, `AppTopbar` e `useAuthAccess` para consumirem selectors do store global, removendo `meApi()` por mount e `listAcademiasApi()` duplicado no shell autenticado.

### 31.4. Centralizar a troca de unidade ativa e a invalidação do snapshot

**Status:** done  
**Dependencies:** 31.2, 31.3  

Fazer a troca de unidade ocorrer por uma única ação formal e refletir em toda a UI.

**Details:**

Implementar ou consolidar `switchActiveTenant(tenantId)` para chamar o endpoint canônico de contexto, atualizar o snapshot global, recalcular branding, decidir invalidação de claims e academia quando necessário e sincronizar eventos entre abas.

### 31.5. Sincronizar o store com refresh, logout e recovery de contexto

**Status:** done  
**Dependencies:** 31.2, 31.4  

Garantir que o snapshot global continue consistente após mudanças de sessão e reparos automáticos do wrapper HTTP.

**Details:**

Acoplar o store aos fluxos já endurecidos de login, refresh, logout e recovery em `src/lib/api/http.ts`, limpando ou atualizando snapshot quando o backend mudar claims, tenant ativo ou `X-Context-Id`.

### 31.6. Validar regressão e reduzir chamadas redundantes nas rotas críticas

**Status:** done  
**Dependencies:** 31.1, 31.3, 31.4, 31.5  

Fechar a task com evidência objetiva de redução de bootstrap redundante.

**Details:**

Adicionar cobertura unitária e e2e para shell autenticado, troca de unidade e rotas como `/clientes`; comparar baseline com resultado final e registrar os números obtidos conforme os critérios do PRD.
