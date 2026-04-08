# Task ID: 501

**Title:** Componente InboxLayout (layout split do atendimento)

**Status:** pending

**Dependencies:** 499

**Priority:** high

**Description:** Criar layout split-screen do inbox: sidebar com lista de conversas (colapsável em mobile) + área principal (thread/detalhe ou estado vazio).

**Details:**

Criar `src/components/atendimento/inbox-layout.tsx`:

Props: `{ children: React.ReactNode, sidebar: React.ReactNode, selectedConversationId: string | null }`.

- **Desktop (≥ lg):** Layout flex com sidebar fixa de 320px (colapsável para 60px com ícones) + main area flex-1.
- **Mobile (< lg):** Mostrar sidebar OU main area (não ambos). Se `selectedConversationId` existe, mostrar main area; senão, mostrar sidebar. Botão "Voltar" no header da main area para retornar à lista.
- Usar `framer-motion` para transições de resize e seleção.
- Borda sutil entre sidebar e main area.
- Fundo do main area: `bg-background` (dark mode padrão do projeto).
- Acessibilidade: `aria-label="Lista de conversas"` na sidebar, `aria-label="Detalhe da conversa"` no main.

**Test Strategy:**

Teste manual responsive: redimensionar browser e verificar que layout adapta corretamente. Testar colapso/expansão da sidebar. Testar mobile: selecionar conversa → ver detalhe → clicar voltar → ver lista.
