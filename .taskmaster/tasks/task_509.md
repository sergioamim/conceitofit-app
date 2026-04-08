# Task ID: 509

**Title:** Adicionar navegação "Atendimento" na sidebar do portal

**Status:** pending

**Dependencies:** 507

**Priority:** high

**Description:** Adicionar item "Atendimento" ao `operationGroup` em `src/lib/tenant/nav-items-v2.ts` apontando para `/atendimento/inbox`.

**Details:**

Em `src/lib/tenant/nav-items-v2.ts`:

1. Importar ícone `MessageSquare` de `lucide-react` (já disponível).
2. Adicionar ao `operationGroup.items` (após "Clientes" ou no início do grupo):

```ts
{ href: "/atendimento/inbox", label: "Atendimento", icon: MessageSquare, description: "Inbox WhatsApp" },
```

3. Verificar que o item aparece corretamente na sidebar.
4. Verificar que o highlight da nav funciona quando em `/atendimento/inbox` e `/atendimento/inbox/[id]` (usar `exact: false` ou match de prefixo).

**Test Strategy:**

Teste manual: abrir portal → verificar item "Atendimento" na sidebar → clicar → navegar para `/atendimento/inbox`. Verificar highlight correto em sub-rotas.
