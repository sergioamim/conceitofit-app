# Task ID: 442

**Title:** Migrar UsuariosTable customizado para PaginatedTable com bulk actions

**Status:** done

**Dependencies:** 432 ✓, 437 ✓

**Priority:** medium

**Description:** Substituir componente customizado UsuariosTable em /admin/seguranca/usuarios por PaginatedTable com seleção múltipla e bulk actions.

**Details:**

Em /admin/seguranca/usuarios, eliminar o componente customizado UsuariosTable e substituir por PaginatedTable. Colunas: nome (com avatar initials), email, academia(s) (badges), perfil, status (StatusBadge), último acesso (data relativa), ações (DataTableRowActions). Usar TableFilters com: busca textual, academia (SuggestionInput — já migrado na task 426), perfil (Select — enum pequeno), status (Select). Implementar seleção múltipla com checkbox e bulk actions via BulkActionBar: desativar selecionados, alterar perfil em lote. Remover componente UsuariosTable antigo.

**Test Strategy:**

Teste manual: abrir /admin/seguranca/usuarios, verificar PaginatedTable com todas as colunas, filtros via SuggestionInput e Select, selecionar múltiplos usuários e executar bulk action.
