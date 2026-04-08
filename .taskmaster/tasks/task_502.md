# Task ID: 502

**Title:** Componente MessageThread (thread de mensagens com paginação)

**Status:** pending

**Dependencies:** 486, 497, 498, 491

**Priority:** high

**Description:** Criar thread de mensagens com scroll, paginação "load more" no topo, auto-scroll para novas mensagens via SSE e agrupamento por data.

**Details:**

Criar `src/components/atendimento/message-thread.tsx`:

Props: `{ conversationId: string, mensagens: MensagemPageResponse, isLoading: boolean, hasNextPage: boolean, onLoadMore: () => void }`.

- **Layout:** Container scrollable com `flex-col` (mensagens empilhadas).
- **Ordenação:** Backend retorna `createdAt DESC` (mais novas primeiro). Exibir do mais antigo para o mais novo (inverter array).
- **Paginação:** Botão "Carregar mensagens anteriores" no topo quando `hasNextPage`. Spinner durante loading.
- **Auto-scroll:** Quando nova mensagem chega via SSE (detectar por nova mensagem no final), auto-scroll para baixo. Se o usuário scrollou para cima, mostrar badge "↓ Nova mensagem" em vez de auto-scroll.
- **Agrupamento por data:** Separador visual entre dias diferentes (ex: "— 7 de abril de 2026 —").
- **Renderização:** Usar `MessageBubble` para cada mensagem.
- **Performance:** Para threads > 200 msgs, virtualização com `@tanstack/react-virtual` (instalar se necessário).
- **Skeleton loading:** 5-8 bolhas skeleton quando carregando.
- **Empty state:** "Nenhuma mensagem nesta conversa ainda" quando `content.length === 0`.

**Test Strategy:**

Teste unitário: renderizar thread com 10 mensagens mock, verificar ordenação (mais antigas no topo). Testar botão "Carregar mais" aparece quando hasNextPage. Testar agrupamento por data. Teste E2E: scroll para cima, receber nova mensagem via SSE mock, verificar badge "Nova mensagem".
