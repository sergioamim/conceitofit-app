# Task ID: 479

**Title:** Backend: Implementar integração WhatsApp Business API

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Implementar no backend Java a integração com WhatsApp Business API para envio de mensagens do CRM.

**Details:**

Implementar: (1) POST /api/v1/whatsapp/enviar — enviar mensagem para prospect/cliente, (2) POST /api/v1/whatsapp/webhook — receber mensagens/respostas, (3) GET /api/v1/whatsapp/status/{messageId} — status de envio, (4) Configuração de template de mensagem (boas-vindas, follow-up, lembrete de pagamento, aniversário), (5) Integração com provider (Twilio WhatsApp, Zenvia, ou similar), (6) Rate limiting e fila de envio. Model: WhatsAppMessage com templateId, recipientId, content, status (ENVIADA, ENTREGUE, LIDA, FALHOU).

**Test Strategy:**

Testes de integração backend para cada endpoint. Teste de webhook simulando resposta do WhatsApp. Teste de rate limiting.
