# Task ID: 225

**Title:** Configurar TanStack Query provider e devtools

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Criar QueryClient com defaults, adicionar provider no layout (app), devtools em dev.

**Details:**

Criar src/lib/query/query-client.ts com: staleTime 5min, retry 2, refetchOnWindowFocus false. Adicionar QueryClientProvider no src/app/(app)/layout.tsx. Adicionar ReactQueryDevtools condicional (process.env.NODE_ENV === "development"). TanStack Query já está instalado (5.95.2).

**Test Strategy:**

Provider funciona sem erros. Devtools visível em dev. Páginas existentes não quebram.
