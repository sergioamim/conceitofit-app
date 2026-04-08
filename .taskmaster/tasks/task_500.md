# Task ID: 500

**Title:** Componente ConversationFilters

**Status:** done

**Dependencies:** 486

**Priority:** medium

**Description:** Criar filtros de conversas usando componente `TableFilters` existente, suportando busca textual, status, fila, responsável e período.

**Details:**

Criar `src/components/atendimento/conversation-filters.tsx`:

Usar o componente existente `TableFilters` de `@/components/shared/table-filters` com `FilterConfig`:

```ts
const CONVERSATION_FILTER_CONFIGS: FilterConfig[] = [
  { type: "text", key: "busca", label: "Buscar", placeholder: "Nome, telefone ou mensagem..." },
  { type: "select", key: "status", label: "Status", options: [
    { value: "ABERTA", label: "Aberta" },
    { value: "EM_ATENDIMENTO", label: "Em atendimento" },
    { value: "PENDENTE", label: "Pendente" },
    { value: "ENCERRADA", label: "Encerrada" },
    { value: "SPAM", label: "Spam" },
    { value: "BLOQUEADA", label: "Bloqueada" },
  ]},
  { type: "text", key: "queue", label: "Fila", placeholder: "Qualquer fila" },
  { type: "text", key: "ownerUserId", label: "Responsável", placeholder: "Qualquer responsável" },
];
```

- O backend usa `busca` para buscar por nome, telefone e preview de mensagem.
- `periodoInicio` e `periodoFim` podem ser adicionados como date pickers numa fase posterior.
- Os filtros são aplicados via URL search params para compartilhamento de estado.
- Integrar com `useTableSearchParams` hook existente se aplicável.

**Test Strategy:**

Teste manual: aplicar filtros e verificar que a URL search params é atualizada. Verificar que limpar filtros restaura a lista completa. Teste unitário: verificar que config de filtros está correto.
