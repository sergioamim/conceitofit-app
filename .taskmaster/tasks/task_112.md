# Task ID: 112

**Title:** Melhorar acessibilidade (a11y) dos componentes shared e modais

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Auditar e corrigir acessibilidade dos 56 componentes shared e modais CRUD. Apenas 9 de 56 componentes usam atributos aria-. Adicionar aria-labels, roles, focus management em modais, navegação por teclado em kanban/grade, e contraste adequado nos status badges.

**Details:**

Auditar src/components/shared/ para aria-label, aria-describedby, role, tabIndex e focus trap em Dialog/modais. Priorizar: (1) CrudModal e todos os modais CRUD — garantir focus trap, aria-labelledby no título, aria-describedby na descrição, escape para fechar; (2) PaginatedTable — aria-sort, aria-label nas colunas, role=grid; (3) SuggestionInput — aria-expanded, aria-activedescendant, role=combobox; (4) PlanoSelectorCard — role=radio/radiogroup quando usado para seleção; (5) StatusBadge — aria-label descritivo do status; (6) BulkActionBar — aria-live para contagem de seleção. Não alterar visual — apenas adicionar semântica. Testar com axe-core ou Lighthouse accessibility audit.

**Test Strategy:**

Rodar Lighthouse accessibility audit nas páginas /vendas/nova, /clientes, /administrativo/salas e /adesao. Score mínimo alvo: 90. Verificar navegação por Tab em modais e fechamento com Escape.

## Subtasks

### 112.1. Padronizar acessibilidade dos modais CRUD e Dialog wrappers

**Status:** pending  
**Dependencies:** None  

Auditar e ajustar os modais CRUD para garantir semântica e foco corretos.

**Details:**

Revisar `src/components/shared/crud-modal.tsx`, `src/components/shared/*-modal.tsx` e `src/components/ui/dialog.tsx` para adicionar `aria-labelledby`/`aria-describedby` vinculados a `DialogTitle`/`DialogDescription`, garantir `role="dialog"`, `aria-modal`, foco inicial e fechamento por Escape; tratar o modal custom `servico-modal.tsx` com foco e semântica equivalentes ao Dialog.

### 112.2. Melhorar a11y em componentes de dados e seleção

**Status:** pending  
**Dependencies:** 112.1  

Adicionar roles e atributos ARIA nos componentes de tabela, sugestões e seleção.

**Details:**

Atualizar `src/components/shared/paginated-table.tsx` (role=grid, aria-sort, labels de colunas), `suggestion-input.tsx` (combobox/listbox/activedescendant/expanded), `status-badge.tsx` (aria-label descritivo), `bulk-action-bar.tsx` (aria-live/role=status) e `plano-selector-card.tsx` (role=radio/aria-checked quando selecionável), além de revisar componentes de grade/kanban no shared para navegação por teclado com `tabIndex` e handlers de teclas.

### 112.3. Validar com Lighthouse/axe e corrigir pendências finais

**Status:** pending  
**Dependencies:** 112.2  

Executar auditoria de acessibilidade e ajustar issues restantes.

**Details:**

Rodar Lighthouse (ou axe-core) nas rotas `/vendas/nova`, `/clientes`, `/administrativo/salas` e `/adesao`, corrigindo qualquer issue remanescente nos componentes shared/modais sem alterar layout visual e respeitando segurança de hidratação SSR.
