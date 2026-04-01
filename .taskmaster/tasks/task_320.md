# Task ID: 320

**Title:** Dual auth: httpOnly cookies no web, manter Bearer para mobile/API

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Frontend web usa cookies httpOnly. Nao envia mais header Authorization manualmente — cookie vai automaticamente com credentials:include.

**Details:**

http.ts: adicionar credentials:'include' em todos os fetch(). Remover injecao manual do header Authorization. session.ts: nao armazenar tokens em localStorage (apenas user info: userId, displayName, tenantId, network). Token-store em memória fica como cache para saber se esta logado (verificar via /auth/me ou flag). Login: nao precisa salvar token do response body (cookie ja foi setado pelo backend). Refresh: automatico via cookie. Logout: chama /auth/logout (backend limpa cookies) + limpa session info do localStorage.

IMPORTANTE: Nao quebrar compatibilidade — se por algum motivo o cookie nao estiver presente, o fallback de header ainda funciona (util para dev/debug).

DEPENDÊNCIA CROSS-REPO: Requer backend task academia-java#390 implementada primeiro.

**Test Strategy:**

Login funciona, cookie setado. Navegacao mantem sessao via cookie. localStorage nao contem tokens. Logout limpa tudo.
