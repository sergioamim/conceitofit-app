# Task ID: 30

**Title:** Endurecer sessão inválida, refresh e relogin no frontend

**Status:** done

**Dependencies:** 3 ✓, 29 ✓

**Priority:** high

**Description:** Tornar determinístico o fluxo de recuperação de autenticação no web para que 401 por token inválido, malformado ou expirado tente refresh uma única vez e, se não houver recuperação, execute logout completo com limpeza do contexto local de tenant.

**Details:**

O frontend já possui a base do fluxo em `src/lib/api/http.ts`, `src/lib/api/session.ts` e `src/lib/tenant-context.ts`, mas ainda há uma lacuna importante: quando o refresh falha, a autenticação é limpa sem limpar o `academia-api-context-id`, o que pode deixar o navegador com contexto de unidade stale. Esta task fecha o fluxo de ponta a ponta: centralizar uma invalidação completa de sessão, endurecer o retry único de refresh, garantir redirecionamento previsível para `/login` e preservar a regra de multi-tenant por `X-Context-Id` sem reintroduzir `tenantId` redundante em rotas operacionais.

**Test Strategy:**

Executar os testes unitários do wrapper HTTP e da store de sessão/contexto, cobrindo 401 com refresh bem-sucedido, 401 com refresh falhando, request repetida retornando novo 401 e limpeza do `academia-api-context-id`; complementar com smoke manual do login, expiração simulada de token e redirect automático para `/login`.

## Subtasks

### 30.1. Auditar o fluxo atual de 401, refresh e limpeza de sessão

**Status:** done  
**Dependencies:** None  

Mapear o comportamento atual em `src/lib/api/http.ts`, `src/lib/api/session.ts`, `src/lib/tenant-context.ts` e shells que observam `AUTH_SESSION_UPDATED_EVENT`.

**Details:**

Confirmar onde hoje acontece retry, onde a sessão é limpa, quais chaves de storage permanecem após falha de refresh e como o redirect para `/login` é disparado no app e no backoffice.

### 30.2. Centralizar invalidação completa de sessão e contexto

**Status:** done  
**Dependencies:** 30.1  

Criar helper dedicado para invalidar autenticação de forma completa, sem lógica espalhada no wrapper HTTP.

**Details:**

O helper deve limpar access token, refresh token, token type, expiresIn, active tenant, available tenants, preferred tenant e o `academia-api-context-id`, além de resetar qualquer memória local de contexto e disparar os eventos necessários para sincronizar a UI.

### 30.3. Endurecer `apiRequest` e `tryRefreshToken` para retry único

**Status:** done  
**Dependencies:** 30.1, 30.2  

Garantir que 401 faça no máximo uma tentativa de refresh e que qualquer falha leve a logout completo.

**Details:**

Manter uma única repetição da request original após refresh bem-sucedido; se o refresh falhar ou a request repetida retornar novo 401, invalidar sessão/contexto e propagar erro sem loop. Não aplicar sync de tenant/contexto em respostas 401.

### 30.4. Ajustar reação do shell e preservar a regra multi-tenant

**Status:** done  
**Dependencies:** 30.2, 30.3  

Garantir que a UI reaja de forma determinística à invalidação da sessão e que o contexto stale não sobreviva ao relogin.

**Details:**

Revisar `use-session-context`, layouts e guardas de navegação para confirmar o redirect para `/login` ao perder token, sem popup obrigatório e sem reutilizar `X-Context-Id` antigo. Preservar a regra atual de não enviar `tenantId` redundante em rotas operacionais context-scoped.

### 30.5. Cobrir regressão com testes focados

**Status:** done  
**Dependencies:** 30.2, 30.3, 30.4  

Adicionar testes unitários e de integração leve para os cenários críticos de sessão inválida.

**Details:**

Cobrir os cenários: 401 com refresh válido, 401 com refresh inválido, token malformado levando a logout, request repetida ainda retornando 401 e limpeza do `academia-api-context-id` e tenant local após invalidação.
