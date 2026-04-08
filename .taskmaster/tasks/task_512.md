# Task ID: 512

**Title:** Estender playbooks CRM com triggers de WhatsApp

**Status:** pending

**Dependencies:** 486

**Priority:** medium

**Description:** Estender página `/crm/playbooks` existente para suportar triggers de WhatsApp (CONVERSA_ABERTA, MENSAGEM_RECEBIDA, SEM_RESPOSTA) e mostrar execuções vinculadas a conversas.

**Details:**

Em `src/app/(portal)/crm/playbooks/playbooks-content.tsx`:

1. **Novos triggers de WhatsApp** no form de criação/edição de playbook:
   - Adicionar ao select de gatilhos: "Conversa Aberta", "Mensagem Recebida", "Sem Resposta (24h)", "Sem Resposta (48h)", "Sem Resposta (72h)".
   - Mapear para valores: `CONVERSA_ABERTA`, `MENSAGEM_RECEBIDA`, `SEM_RESPOSTA_24H`, `SEM_RESPOSTA_48H`, `SEM_RESPOSTA_72H`.

2. **Novos passos de WhatsApp** no step de playbook:
   - Adicionar ação "Enviar WhatsApp" ao select de ações de passo.
   - Quando selecionada, mostrar campos: templateName (select de templates), templateVariables (inputs dinâmicos).

3. **Link para execuções vinculadas a conversas**:
   - Na lista de execuções do playbook, se a execução tem `conversationId`, mostrar link "Ver conversa" → `/atendimento/inbox/{conversationId}`.

4. **Tipos**: Adicionar novos tipos de trigger e ação ao arquivo de tipos CRM existente ou criar extensão.

**Test Strategy:**

Teste manual: criar playbook com trigger "Conversa Aberta" → salvar → verificar que aparece na lista. Adicionar passo "Enviar WhatsApp" → salvar → verificar persistência. Testar link para conversa em execução.
