# Task ID: 306

**Title:** Testes unitários — src/lib/query/ (hooks TanStack Query)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários para os hooks de `TanStack Query` em `src/lib/query/`, verificando chaves, exports e estrutura básica.

**Details:**

Criar o arquivo `tests/unit/query-hooks.spec.ts`. Implementar testes para: 1. Verificar que as `query keys` são únicas e determinísticas para cada hook. 2. Validar que todos os hooks esperados são exportados corretamente pelo `index.ts` do diretório `query`. 3. Assegurar que a estrutura básica dos hooks (existência de `queryFn`, `queryKey`, e `enabled` quando aplicável) está correta, sem testar a renderização de React diretamente. Foco na lógica de configuração do `TanStack Query`. Pseudo-código: `import * as queryExports from 'src/lib/query';
 describe('query hooks', () => {
   it('should have unique query keys for different parameters', () => {
     const key1 = ['myQuery', 1];
     const key2 = ['myQuery', 2];
     expect(key1).not.toEqual(key2);
   });
   it('should export all expected hooks', () => {
     expect(queryExports).toHaveProperty('useSomeDataQuery');
   });
 });`

**Test Strategy:**

Executar os testes unitários. Validar a conformidade dos hooks com as melhores práticas do `TanStack Query`, assegurando consistência nas chaves e exports. Não é necessário testar o comportamento de caching ou fetching da biblioteca em si, mas sim a integração e configuração correta dos hooks.
