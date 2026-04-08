# Task ID: 506

**Title:** Componentes de ação da conversa (QueueSelector, OwnerAssign, UnitSelector, TaskCreateDialog)

**Status:** done

**Dependencies:** 486, 496

**Priority:** medium

**Description:** Criar componentes para ações de roteamento e tarefas vinculadas à conversa.

**Details:**

Criar em `src/components/atendimento/`:

**`queue-selector.tsx`** — `QueueSelector({ currentQueue, onQueueChange })`:
- Dropdown (`Select` do shadcn) com filas disponíveis.
- Filas são strings livres definidas pelo cliente.
- Options podem vir de lista predefinida OU input livre com autocomplete.
- Ao selecionar, chamar `onQueueChange(queue)`.

**`owner-assign.tsx`** — `OwnerAssign({ currentOwnerUserId, onOwnerChange })`:
- Busca de usuários do tenant (usar endpoint existente de funcionários ou `GET /api/v1/usuarios` se disponível).
- Se endpoint não disponível, usar `Select` estático com lista de usuários carregada via prop.
- Input com autocomplete (search).
- Ao selecionar, chamar `onOwnerChange(ownerUserId)`.
- Opção "Desatribuir" para remover owner.

**`unit-selector.tsx`** — `UnitSelector({ currentUnidadeId, onUnidadeChange })`:
- Usar `GET /api/v1/unidades` (já existe no OpenAPI).
- Dropdown com lista de unidades do tenant.
- Ao selecionar, chamar `onUnidadeChange(unidadeId)`.

**`task-create-dialog.tsx`** — `TaskCreateDialog({ open, onOpenChange, conversationId, onSubmit })`:
- Dialog com form react-hook-form + zodResolver (`criarTarefaSchema`).
- Campos: titulo (obrigatório, max 160), descricao (textarea), responsavel (select), prioridade (select BAIXA/MEDIA/ALTA), prazoEm (datetime picker).
- Botões: Cancelar, Criar Tarefa.
- On submit: chamar `onSubmit(data)` e fechar dialog.
- Toast de feedback.

**Test Strategy:**

Teste unitário para cada componente: verificar renderização e callbacks. Testar TaskCreateDialog com validação (titulo vazio = erro). Testar OwnerAssign com e sem owner selecionado.
