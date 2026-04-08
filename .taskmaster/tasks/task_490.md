# Task ID: 490

**Title:** Adicionar query keys para conversas e credenciais

**Status:** done

**Dependencies:** 486

**Priority:** high

**Description:** Adicionar entries `conversas` e `credentials` em `src/lib/query/keys.ts` para centralizar todas as chaves de query do React Query.

**Details:**

Em `src/lib/query/keys.ts`, adicionar ao objeto `queryKeys`:

```ts
conversas: {
  all: (tenantId: string) => ["conversas", tenantId] as const,
  list: (tenantId: string, filters: Record<string, unknown>, page: number) =>
    ["conversas", "list", tenantId, filters, page] as const,
  detail: (tenantId: string, id: string) =>
    ["conversas", "detail", tenantId, id] as const,
  thread: (tenantId: string, id: string, page: number) =>
    ["conversas", "thread", tenantId, id, page] as const,
},
credentials: {
  all: (tenantId: string) => ["whatsapp", "credentials", tenantId] as const,
  health: (tenantId: string, id: string) =>
    ["whatsapp", "credentials", "health", tenantId, id] as const,
},
```

Seguir o padrão existente do arquivo (arrow functions, `as const`, hierarquia de escopo).

**Test Strategy:**

Verificar que TypeScript compila sem erros. Verificar que as keys são únicas e consistentes com o padrão do arquivo.
