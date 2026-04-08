# Task ID: 503

**Title:** Componente MessageInput (envio de mensagens com idempotência)

**Status:** done

**Dependencies:** 487, 491, 495, 496, 497, 498

**Priority:** high

**Description:** Criar input de envio de mensagens com textarea auto-resize, botão enviar, suporte a anexos (mídia via URL), templates rápidos, idempotência no envio e debounce de duplo-clique.

**Details:**

Criar `src/components/atendimento/message-input.tsx`:

Props: `{ conversationId: string, onSend: (data: EnviarMensagemRequest, idempotencyKey: string) => Promise<void>, isSending: boolean }`.

- **Textarea auto-resize:** Usar `useEffect` para ajustar `style.height` baseado no `scrollHeight`. Min 40px, max 120px. Depois vira scrollable.
- **Envio:** `Enter` envia, `Shift+Enter` nova linha.
- **Botão enviar:** Desabilitado quando texto vazio ou `isSending`. Spinner durante envio.
- **Idempotência:** Gerar key via `IdempotencyKeyStore.acquireKey(conversationId)` antes de enviar. Liberar após sucesso.
- **Debounce:** Desabilitar botão por 2s após envio para prevenir duplo-clique.
- **Mídia:** Botão "Anexar" que abre flow de upload:
  1. Selecionar arquivo (imagem, áudio, documento).
  2. Upload para `POST /api/v1/storage/upload` (endpoint existente).
  3. Obter URL e setar `mediaUrl` no form.
  4. Preview do anexo antes de enviar.
- **Templates rápidos:** Se houver templates disponíveis, mostrar botões rápidos acima do input (ex: "Boas-vindas", "Cobrança"). Ao clicar, preenche conteúdo e envia.
- **Form validation:** Usar schema `enviarMensagemSchema` (Task 496) com react-hook-form.
- **Erro de envio:** Mensagem inline "Falha ao enviar — tente novamente" com botão "Reenviar".

**Test Strategy:**

Teste unitário: verificar que Enter envia, Shift+Enter insere nova linha. Testar debounce (2 clicks rápidos = 1 envio). Testar idempotência (mesma key para mesma operação). Testar validação de campo vazio. Teste E2E: digitar mensagem → enviar → verificar que mutation é chamada → verificar feedback visual.
