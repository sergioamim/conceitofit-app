# Task ID: 304

**Title:** Testes unitários — src/lib/tenant/hooks/use-session-context.tsx

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários para o hook `use-session-context.tsx`, cobrindo inicialização, troca de tenant, persistência e refresh de token.

**Details:**

Criar o arquivo `tests/unit/session-context-full.spec.ts`. Utilizar `@testing-library/react-hooks` para testar o hook. Implementar testes para: 1. Inicialização da sessão com e sem dados pré-existentes. 2. Troca de tenant ativo e suas implicações. 3. Persistência e recuperação de dados da sessão via `localStorage`. 4. Fluxo de refresh de token. 5. Cenários de borda: sessão expirada, token inválido, tenant removido, erros de armazenamento. Mockar `localStorage` e quaisquer chamadas de API de autenticação. Pseudo-código: `describe('useSessionContext', () => {
   it('should initialize session from localStorage', () => {
     localStorage.setItem('session', JSON.stringify({ token: 'abc', tenantId: 'tenant1' }));
     const { result } = renderHook(() => useSessionContext());
     expect(result.current.session.token).toBe('abc');
     expect(result.current.activeTenantId).toBe('tenant1');
   });
 });`

**Test Strategy:**

Executar os testes unitários. Validar a integridade da sessão durante as operações (login, logout, troca de tenant) e a correta interação com `localStorage`. Testar a resiliência a cenários de erro e a recuperação da sessão. Alta cobertura de linha para `use-session-context.tsx`.
