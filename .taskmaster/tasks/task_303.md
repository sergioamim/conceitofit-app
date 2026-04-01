# Task ID: 303

**Title:** Testes unitários — src/lib/tenant/rbac/hooks.ts

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários para os hooks de controle de acesso (`useAuthAccess`, `useRbacTenant`, `canAccessElevatedModules`) no módulo `rbac/hooks.ts`.

**Details:**

Criar o arquivo `tests/unit/rbac-hooks.spec.ts`. Utilizar `@testing-library/react-hooks` ou similar para testar os hooks de forma isolada. Implementar testes para: 1. Resolução de permissões baseada em roles para `useAuthAccess`. 2. Contexto de tenant para RBAC em `useRbacTenant`. 3. Lógica de acesso elevado em `canAccessElevatedModules`. 4. Cenários de borda: usuário sem roles, múltiplos perfis, perfil inativo, ausência de contexto. Mockar dependências de autenticação ou contexto global. Pseudo-código: `describe('useAuthAccess', () => {
   it('should grant access for allowed role', () => {
     // Mock useSessionContext to return a user with 'admin' role
     const { result } = renderHook(() => useAuthAccess(['admin']));
     expect(result.current.can('manage_users')).toBe(true);
   });
 });`

**Test Strategy:**

Executar os testes unitários. Validar que as permissões são concedidas ou negadas conforme a configuração das roles e o contexto do tenant. Assegurar que os cenários de borda são tratados corretamente e que o módulo `rbac/hooks.ts` atinja alta cobertura.
