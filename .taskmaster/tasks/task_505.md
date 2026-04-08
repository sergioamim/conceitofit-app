# Task ID: 505

**Title:** Componente ConversationHeader (header da conversa com ações)

**Status:** pending

**Dependencies:** 486, 498, 506

**Priority:** high

**Description:** Criar header da conversa com nome do contato, status badge clicável, e ações rápidas (atribuir owner, mudar fila, mudar unidade, encerrar).

**Details:**

Criar `src/components/atendimento/conversation-header.tsx`:

Props: `{ conversation: ConversaResponse, onStatusChange, onOwnerChange, onQueueChange, onUnidadeChange }`.

- **Esquerda:** Nome do contato (`contatoNome`) + telefone (`contatoTelefone`) em texto menor.
- **Centro:** `StatusBadge` clicável que abre dropdown com opções de status.
- **Direita:** Ações rápidas como ícones com dropdown:
  - `UserPlus` → `OwnerAssign` (atribuir responsável).
  - `ListFilter` → `QueueSelector` (mudar fila).
  - `Building` → `UnitSelector` (mudar unidade).
  - `CheckCircle` → Encerrar conversa (confirmação com dialog).
- **Responsivo:** Em mobile, ações ficam num menu `⋮` (dropdown).
- Cada ação chama a mutation correspondente e mostra toast de feedback.

**Test Strategy:**

Teste unitário: verificar renderização dos elementos. Testar que clique no status abre dropdown. Testar cada ação rápida chama callback correto. Teste E2E: mudar status → verificar mutation chamada → toast de sucesso.
