# Task ID: 499

**Title:** Componente ConversationList (lista lateral de conversas)

**Status:** pending

**Dependencies:** 486, 497, 498

**Priority:** high

**Description:** Criar lista lateral de conversas com avatar, preview da última mensagem, timestamp relativo, badge de status e destaque da conversa ativa.

**Details:**

Criar `src/components/atendimento/conversation-list.tsx`:

Props: `{ conversas: ConversaResponse[], selectedId: string | null, onSelect: (id: string) => void, isLoading: boolean }`.

- Lista vertical scrollável.
- Cada item `ConversationItem`:
  - Avatar com iniciais do `contatoNome` (círculo colorido, estilo consistente com o projeto).
  - Nome do contato (`contatoNome`) em destaque.
  - Preview da última mensagem (`lastMessagePreview`) truncada com `truncate`.
  - Timestamp relativo (`lastMessageAt` via `formatRelativeTime`) no canto superior direito.
  - Badge de status pequeno no canto.
  - Fundo destacado quando `selectedId === conversa.id`.
  - Hover effect sutil.
  - `onClick` → `onSelect(conversa.id)`.
- Ordenação: por `lastMessageAt` desc (já ordenado pelo backend).
- Skeleton loading: usar `Skeleton` do shadcn quando `isLoading`.
- Acessibilidade: `role="listbox"`, cada item `role="option"`, `aria-selected` na conversa ativa, navegação por teclado (ArrowUp/Down).

**Test Strategy:**

Teste unitário: renderizar lista com 5 conversas mock, verificar que ordenação está correta. Testar seleção (clique). Testar skeleton quando loading. Testar navegação por teclado (ArrowDown seleciona próximo item).
