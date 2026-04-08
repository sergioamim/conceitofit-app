# Task ID: 498

**Title:** Componentes base de UI do atendimento (StatusBadge, MessageBubble, MessageMediaPreview, EmptyInboxState, RealTimeIndicator)

**Status:** pending

**Dependencies:** 486, 497

**Priority:** high

**Description:** Criar componentes visuais fundamentais do atendimento: badge de status, bolha de mensagem, preview de mídia, estado vazio do inbox e indicador de tempo real.

**Details:**

Criar em `src/components/atendimento/`:

**`status-badge.tsx`** — `StatusBadge({ status }: { status: ConversationStatus })`:
- Badge colorido por status: ABERTA (blue), EM_ATENDIMENTO (green/teal), PENDENTE (yellow/amber), ENCERRADA (gray), SPAM (gray muted), BLOQUEADA (red).
- Usar componente `Badge` do shadcn.
- Label em pt-BR: "Aberta", "Em atendimento", "Pendente", "Encerrada", "Spam", "Bloqueada".

**`message-bubble.tsx`** — `MessageBubble({ message }: { message: MensagemResponse })`:
- Layout: inbound (alinha à esquerda, fundo cinza escuro) vs outbound (alinha à direita, fundo teal/blue).
- Conteúdo: texto com `white-space: pre-wrap`.
- Timestamp relativo abaixo (usar `formatRelativeTime`).
- Status de entrega para outbound: ícone (✓ pendente, ✓✓ entregue, ✓✓✓ lido, ✗ falhou).
- Se `isAutomated`: badge pequeno "Automação".

**`message-media-preview.tsx`** — `MessageMediaPreview({ contentType, mediaUrl, content })`:
- IMAGEM: thumbnail clicável (max 200px) que abre modal.
- AUDIO: player `<audio controls>` com controls nativos.
- DOCUMENTO: ícone de arquivo + link de download + nome do arquivo.
- VIDEO: thumbnail com ícone play.
- LOCALIZACAO: link "Ver no mapa" → Google Maps.
- CONTATO: card com nome + telefone.
- TEXTO: renderizar texto normal.

**`empty-inbox-state.tsx`** — `EmptyInboxState()`:
- Ilustração simples (ícone `MessageSquare` grande do lucide).
- Título: "Nenhuma conversa ainda".
- Subtítulo: "Quando mensagens chegarem via WhatsApp, elas aparecerão aqui."
- Design com gradient subtle matching o estilo do projeto.

**`realtime-indicator.tsx`** — `RealTimeIndicator({ isConnected })`:
- Ponto verde pulsante (connected) / amarelo (reconectando) / cinza (offline).
- Tooltip: "Tempo real" / "Reconectando..." / "Offline — atualização a cada 15s".
- Usar animação CSS `pulse` do Tailwind.

**Test Strategy:**

Testes unitários com Vitest: verificar renderização de cada componente com props variados. Testar StatusBadge com todos os 6 statuses. Testar MessageBubble inbound vs outbound. Testar EmptyInboxState snapshot.
