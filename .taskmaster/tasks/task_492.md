# Task ID: 492

**Title:** React Query hooks para WhatsApp Credentials

**Status:** done

**Dependencies:** 488, 490

**Priority:** high

**Description:** Criar `src/lib/query/use-whatsapp-credentials.ts` com hooks de query e mutation para CRUD de credenciais WABA, health check e refresh token.

**Details:**

Criar `src/lib/query/use-whatsapp-credentials.ts` exportando:

**Queries:**
- `useWhatsAppCredentials({ tenantId, enabled })` — `useQuery<WhatsAppCredentialResponse[]>`, `staleTime: 5 * 60 * 1000`.
- `useCredentialHealth({ tenantId, id, enabled })` — `useQuery<HealthResponse>`, `staleTime: 30_000`, `refetchInterval: 60_000` (health check periódico).

**Mutations:**
- `useCreateWhatsAppCredential()` — mutation `createCredentialApi`. On success: invalidar `credentials.all`.
- `useUpdateWhatsAppCredential()` — mutation `updateCredentialApi`. On success: invalidar `credentials.all`, `credentials.health`.
- `useDeleteWhatsAppCredential()` — mutation `deleteCredentialApi`. On success: invalidar `credentials.all`.
- `useRefreshCredentialToken()` — mutation `refreshCredentialTokenApi`. On success: invalidar `credentials.all`, `credentials.health`.

Seguir padrões de `src/lib/query/use-whatsapp.ts`.

**Test Strategy:**

Testes unitários mockando `queryClient` e verificando invalidation. Testar que `useCredentialHealth` faz polling a cada 60s.
