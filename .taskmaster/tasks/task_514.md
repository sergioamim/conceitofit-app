# Task ID: 514

**Title:** Dashboard WhatsApp — /atendimento/dashboard

**Status:** pending

**Dependencies:** 491, 492

**Priority:** low

**Description:** Criar dashboard com métricas de WhatsApp: total de conversas por status, volume de mensagens, tempo médio de resposta e saúde das credenciais.

**Details:**

Criar `src/app/(portal)/atendimento/dashboard/page.tsx` e `src/components/atendimento/metric-card.tsx`:

**`metric-card.tsx`:**
- Componente reutilizável: `MetricCard({ label, value, icon, trend?, color? })`.
- Card com ícone lucide, valor grande, label pequeno.
- Opcional: `trend` com seta up/down e porcentagem.

**`page.tsx`:**
- Grid de metric cards (4-6 cards):
  1. **Conversas Abertas** — count de conversas com status ABERTA/EM_ATENDIMENTO.
  2. **Conversas Pendentes** — count de conversas PENDENTE.
  3. **Mensagens Hoje** — count de mensagens criadas hoje.
  4. **Tempo Médio Resposta** — média de tempo entre inbound e outbound (se disponível).
  5. **Credenciais Ativas** — count de credenciais VERIFIED.
  6. **Credenciais com Alerta** — count de credenciais com tokenExpiringSoon/tokenExpired.
- Seção "Saúde das Credenciais": lista resumida com `CredentialHealthBadge` para cada credencial.
- **Dados:** Usar `useConversas` (agregar por status) + `useWhatsAppCredentials` + stats existentes.
- **Refresh:** Polling a cada 60s.

**Test Strategy:**

Teste manual: abrir dashboard → verificar métricas corretas. Simular sem credenciais → verificar card "0". Testar responsividade do grid.
