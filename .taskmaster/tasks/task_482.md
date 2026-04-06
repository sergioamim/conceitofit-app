# Task ID: 482

**Title:** Integrar WhatsApp nas cadências e automações do CRM

**Status:** pending

**Dependencies:** 480, 481

**Priority:** medium

**Description:** Conectar envio real de WhatsApp nas cadências CRM, follow-ups automatizados e playbooks.

**Details:**

Integrar: (1) Cadência com passo 'Enviar WhatsApp' dispara mensagem real via API, (2) Follow-up automatizado: se prospect não responde em X dias, enviar WhatsApp de follow-up, (3) Lembrete de pagamento: enviar WhatsApp se pagamento está pendente e próximo do vencimento, (4) Aniversário: enviar WhatsApp automático no dia, (5) Log de mensagens no timeline do prospect/cliente, (6) Métricas de efetividade (taxa de resposta por template).

**Test Strategy:**

Teste E2E: cadência dispara WhatsApp → mensagem enviada → resposta registrada no timeline. Teste de fallback: se WhatsApp indisponível, cadência registra falha e continua.
