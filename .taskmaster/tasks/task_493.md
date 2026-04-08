# Task ID: 493

**Title:** SSE Provider para atualizações em tempo real (Atendimento)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Criar `src/lib/sse/sse-provider.tsx` com `SSEConnectionProvider` e hook `useSSE` para gerenciar conexão SSE com reconexão automática e fallback polling.

**Details:**

Criar `src/lib/sse/sse-provider.tsx` e `src/lib/sse/index.ts`:

**`SSEConnectionProvider`** (React Context provider):
- Props: `{ children, tenantId }`.
- Usa `EventSource` nativo: `new EventSource(\`/api/v1/conversas/stream?tenantId=${tenantId}&timeout=300000\`)`.
- **Auth:** Cookies são enviados automaticamente (same-origin). Não precisa de token na query string.
- **Eventos SSE:** escutar `connected`, `nova_mensagem`, `conversa_atualizada`, `conversa_encerrada`, `heartbeat`.
- **Reconexão:** On error, fechar EventSource e reconectar após 3s (backoff exponencial: 3s → 6s → 12s → 30s, max 30s).
- **Estado:** `isConnected: boolean` (true quando `onopen`, false quando `onerror`).
- **Subscribe pattern:** `subscribe(handler: (event: string, data: unknown) => void) => unsubscribe()`. Usar `useRef<Set<handler>>`.

**Hook `useSSE()`:**
- Retorna `{ isConnected, subscribe }`.
- Lançar erro se usado fora do provider.

**Fallback polling:**
- Detectar suporte SSE: `typeof EventSource === "undefined"`.
- Se sem SSE, NÃO criar provider. O fallback será feito via `refetchInterval` nos hooks React Query (já configurado em Task 491).

**Hydration safety:** Não usar `EventSource` durante SSR. Verificar `typeof window !== "undefined"` antes de conectar.

**Test Strategy:**

Teste unitário: verificar que `subscribe`/`unsubscribe` funcionam corretamente com handlers. Teste de integração mock: simular eventos SSE via EventSource mock e verificar que handlers são chamados. Testar reconexão com mock de erro.
