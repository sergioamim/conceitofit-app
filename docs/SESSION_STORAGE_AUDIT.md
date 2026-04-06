# Auditoria de Armazenamento de Sessão — localStorage vs Cookies

> Data: 2026-04-06 | Task: 456 | Status: **CONCLUÍDA (Task 458 implementada)**
> Data atualização: 2026-04-06 | Task 458: Migração completa para cookies HttpOnly

## Resumo

**ANTES da Task 458:** Tokens JWT e claims de sessão eram armazenados em localStorage (15+ chaves). Um ataque XSS comprometia a sessão completa.

**DEPOIS da Task 458:** Tokens e claims vêm de cookies HttpOnly definidos pelo backend. O frontend **não grava** tokens em localStorage. Apenas preferências de UI (tenant preferido) permanecem em localStorage.

## Arquivos auditados

- `src/lib/api/session.ts` (758 LOC — reduzido de 901)
- `src/lib/api/token-store.ts` (130 LOC — reescrito)
- `src/lib/api/http.ts` (777 LOC — apenas contextId em localStorage, não sensível)

## Matriz de chaves localStorage

### Tokens de autenticação (SENSÍVEL — vetor XSS direto)

| Chave | Conteúdo | Risco | Migração |
|-------|----------|-------|----------|
| `academia-auth-token` | Access token JWT | **CRÍTICO** — se comprometido, acesso total | Cookie HttpOnly + Secure |
| `academia-auth-refresh-token` | Refresh token JWT | **CRÍTICO** — permite renovar sessão | Cookie HttpOnly + Secure + path=/auth/refresh |
| `academia-auth-token-type` | Tipo do token (Bearer) | BAIXO — dado estático | Eliminar (sempre Bearer) |
| `academia-auth-expires-in` | TTL da sessão em segundos | BAIXO — metadado | Cookie de claims não-httpOnly |

### Identidade do usuário (SENSÍVEL — enumeração de privilégios)

| Chave | Conteúdo | Risco | Migração |
|-------|----------|-------|----------|
| `academia-auth-user-id` | ID do usuário | MÉDIO — enumeração | Cookie de claims não-httpOnly |
| `academia-auth-user-kind` | Tipo de usuário | MÉDIO — enumeração | Cookie de claims não-httpOnly |
| `academia-auth-display-name` | Nome de exibição | BAIXO — info pública | Cookie de claims não-httpOnly |

### Contexto de rede/academia (SENSÍVEL — estrutura multi-tenant)

| Chave | Conteúdo | Risco | Migração |
|-------|----------|-------|----------|
| `academia-auth-network-id` | ID da academia/rede | MÉDIO — enumeração de tenants | Cookie de claims não-httpOnly |
| `academia-auth-network-subdomain` | Subdomínio da rede | BAIXO — já público na URL | Cookie de claims não-httpOnly |
| `academia-auth-network-slug` | Slug da rede (redundante) | BAIXO — redundante | **Eliminar** (duplicata de subdomain) |
| `academia-auth-network-name` | Nome da rede | BAIXO — info pública | Cookie de claims não-httpOnly |

### Contexto de tenant (SENSÍVEL — isolamento de dados)

| Chave | Conteúdo | Risco | Migração |
|-------|----------|-------|----------|
| `academia-auth-active-tenant-id` | Unidade ativa | **ALTO** — define contexto de dados | Cookie HttpOnly + claims |
| `academia-auth-base-tenant-id` | Unidade base | MÉDIO | Cookie de claims não-httpOnly |
| `academia-auth-available-tenants` | JSON array de tenants acessíveis | **ALTO** — mapa de tenants | Cookie de claims não-httpOnly |
| `academia-auth-preferred-tenant-id` | Preferência do usuário | BAIXO — preferência UI | Manter em localStorage |

### Permissões e escopo (SENSÍVEL — privilégios)

| Chave | Conteúdo | Risco | Migração |
|-------|----------|-------|----------|
| `academia-auth-available-scopes` | ["UNIDADE", "REDE", "GLOBAL"] | **ALTO** — revela privilégios | Cookie de claims não-httpOnly |
| `academia-auth-broad-access` | Flag de acesso amplo | **ALTO** — privilégio especial | Cookie de claims não-httpOnly |
| `academia-auth-force-password-change-required` | Troca de senha obrigatória | MÉDIO — estado de segurança | Cookie de claims não-httpOnly |
| `academia-auth-session-active` | Flag de sessão ativa | BAIXO — flag booleana | Cookie de claims não-httpOnly |

### Impersonação (SENSÍVEL — auditoria)

| Chave | Storage | Conteúdo | Risco | Migração |
|-------|---------|----------|-------|----------|
| `academia-impersonation-session` | sessionStorage | Estado completo de impersonação | **ALTO** — inclui sessão original | Manter em sessionStorage + encryptar |
| `academia-backoffice-return-session` | sessionStorage | Sessão para retorno ao backoffice | **ALTO** — inclui refresh token | Manter em sessionStorage + backend deve validar |
| `academia-backoffice-recovery-session` | sessionStorage | Refresh token de recuperação | **CRÍTICO** — refresh token puro | Migrar para cookie HttpOnly |
| `academia-backoffice-reauth-required` | sessionStorage | Flag de re-autenticação | BAIXO | Manter em sessionStorage |

### Operacional (BAIXO)

| Chave | Storage | Conteúdo | Risco | Migração |
|-------|---------|----------|-------|----------|
| `academia-operational-tenant-scope` | sessionStorage | Escopo de tenants operacionais | BAIXO — derivável do token | Manter em sessionStorage |
| `academia-active-tenant-id` | Cookie | Tenant ativo (sincronizado) | BAIXO — já é cookie | Manter cookie |
| `academia-api-context-id` | localStorage | UUID de contexto de request | BAIXO — não sensível | Manter em localStorage |

## Estratégia de migração recomendada

### Nível 1: Cookies HttpOnly (tokens puros)
- `academia-auth-token` → Cookie `academia_access_token` (HttpOnly, Secure, SameSite=Strict)
- `academia-auth-refresh-token` → Cookie `academia_refresh_token` (HttpOnly, Secure, SameSite=Strict, path=/auth/refresh)

### Nível 2: Cookie de claims (leitura client-side, sem tokens)
- Criar cookie `academia_session_claims` com: userId, userKind, displayName, networkId, activeTenantId, baseTenantId, availableScopes (hash), broadAccess, forcePasswordChange
- **NÃO incluir**: tokens JWT, refresh tokens, senhas, disponíveis-tenants completo
- SameSite=Lax, Secure, Max-Age=session

### Nível 3: Manter em localStorage (preferências)
- `academia-auth-preferred-tenant-id` — preferência de UI
- `academia-api-context-id` — context ID de request

### Nível 4: Manter em sessionStorage (estado volátil)
- `academia-impersonation-session` — estado de impersonação (com encryptação)
- `academia-backoffice-reauth-required` — flag volátil
- `academia-operational-tenant-scope` — escopo operacional

## Chaves redundantes para eliminar

| Chave | Motivo |
|-------|--------|
| `academia-auth-network-slug` | Duplicata de `academia-auth-network-subdomain` |
| `academia-auth-token-type` | Sempre "Bearer" — hardcoded no código |

## Risco atual

Se um ataque XSS é bem-sucedido, o atacante obtém acesso a:
1. **Access token JWT** — acesso total à API como o usuário
2. **Refresh token** — pode renovar a sessão indefinidamente
3. **Estrutura completa de tenants e scopes** — mapa da infraestrutura
4. **Dados de impersonação** — pode se passar por admin

**Classificação de risco geral: CRÍTICO**
