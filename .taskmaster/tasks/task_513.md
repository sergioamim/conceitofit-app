# Task ID: 513

**Title:** Integrar avanço de stage do prospect com conversa

**Status:** pending

**Dependencies:** 486

**Priority:** low

**Description:** Criar hook `useAvancarStageProspect` e adicionar botão "Avançar Stage" no ContactCard quando o contato é um prospect.

**Details:**

1. **Hook** — Estender `src/lib/query/use-prospects.ts` ou criar novo arquivo:
   - `useAvancarStageProspect()` — mutation chamando `PATCH /api/v1/academia/prospects-legado/{id}/stage?tenantId=X&novoStatus=Y&conversationId=Z`.
   - On success: invalidar queries do prospect e da conversa.

2. **ContactCard** — Em `src/components/atendimento/contact-card.tsx`:
   - Se `conversation.prospectId` existe, mostrar botão "Avançar Stage".
   - Ao clicar, abrir dialog confirmando: "Avançar prospect para próximo stage do funil?".
   - Ao confirmar, chamar mutation com `prospectId`, próximo status na sequência (NOVO → EM_CONTATO → AGENDOU_VISITA → VISITOU → CONVERTIDO), e `conversationId`.
   - Toast de feedback.

3. **Mapeamento de stages:** Usar o mesmo enum do backend: `NOVO, EM_CONTATO, AGENDOU_VISITA, VISITOU, CONVERTIDO, PERDIDO`.

**Test Strategy:**

Teste E2E: abrir conversa com prospect → clicar "Avançar Stage" → confirmar → verificar toast e stage atualizado no backend.
