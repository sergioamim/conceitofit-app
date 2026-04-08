# Task ID: 504

**Title:** Componente ContactCard (informações do contato)

**Status:** pending

**Dependencies:** 486, 497

**Priority:** medium

**Description:** Criar card com informações do contato: nome, telefone, origem, vínculo aluno/prospect, consentimentos e pendências.

**Details:**

Criar `src/components/atendimento/contact-card.tsx`:

Props: `{ contato: ContactContext | null, conversation: ConversaResponse }`.

- **Header:** Nome do contato + telefone + badge de origem (WHATSAPP_INBOUND, CADASTRO_MANUAL, etc).
- **Seção Vínculos:**
  - Se `alunoId`: badge "Aluno" + link para `/alunos/{alunoId}`.
  - Se `prospectId`: badge "Prospect" + link para `/prospects/{prospectId}` + botão "Avançar Stage" (se prospect).
  - Se nenhum: "Sem vínculo".
- **Seção Consentimentos:** Checkmarks para `consentimentoWhatsApp`, `consentimentoAt`, `consentimentoConteudo`.
- **Seção Observações:** `obsFinais` se existir.
- **Layout:** Card colapsável (accordion) para não ocupar muito espaço. Usar componente existente se houver, ou criar simples.
- **Empty state:** "Selecione uma conversa para ver o contato."

**Test Strategy:**

Teste unitário: renderizar com contato completo (aluno + prospect). Renderizar com contato sem vínculos. Verificar links corretos. Testar accordion expand/colapse.
