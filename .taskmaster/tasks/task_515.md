# Task ID: 515

**Title:** Testes unitários dos componentes críticos de atendimento

**Status:** pending

**Dependencies:** 498, 499, 502, 503, 506

**Priority:** medium

**Description:** Criar testes Vitest para componentes críticos: StatusBadge, MessageBubble, MessageInput (validação), ConversationList (seleção), TaskCreateDialog.

**Details:**

Criar arquivos `.test.tsx` ao lado dos componentes:

**`status-badge.test.tsx`:**
- Renderizar com todos os 6 statuses.
- Verificar que label e cor estão corretos para cada status.

**`message-bubble.test.tsx`:**
- Testar inbound (alinha esquerda, fundo escuro).
- Testar outbound (alinha direita, fundo teal).
- Testar com isAutomated=true → badge "Automação".
- Testar timestamp relativo.

**`message-input.test.tsx`:**
- Testar campo vazio → botão enviar desabilitado.
- Testar Enter envia (mock onSend).
- Testar Shift+Enter insere nova linha.
- Testar debounce (2 clicks = 1 envio).

**`conversation-list.test.tsx`:**
- Renderizar lista com 5 conversas mock.
- Testar clique em item → onSelect chamado.
- Testar navegação ArrowDown → seleciona próximo.
- Testar selectedId → item destacado.

**`task-create-dialog.test.tsx`:**
- Abrir dialog → preencher titulo → submeter.
- Testar validação: titulo vazio → erro.
- Testar titulo > 160 chars → erro.

Usar `@testing-library/react` e `happy-dom` (já configurado no projeto).

**Test Strategy:**

Executar `npm run test` e verificar que todos passam. Cobertura mínima: 70% para cada componente testado.
