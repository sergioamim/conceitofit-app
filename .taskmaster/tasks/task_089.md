# Task 089: Bulk Actions Architecture na PaginatedTable

## Objetivo
Permitir a execução de ações em massa em registros de tabelas para aumentar a produtividade.

## Subtarefas
- [ ] Adicionar suporte a `rowSelection` na `PaginatedTable`.
- [ ] Criar a coluna de Checkbox na cabeçalho e linhas.
- [ ] Criar o componente `BulkActionBar` (flutuante) que aparece no rodapé da página quando 1+ itens são selecionados.
- [ ] Definir a interface de `BulkAction` (label, icon, handler).
- [ ] Implementar as primeiras ações em massa:
  - Exportar Selecionados (CSV).
  - Alterar Status em Massa (ex: Inativar selecionados).
- [ ] Adicionar modal de confirmação para ações destrutivas em massa.

## Definição de Pronto (DoP)
- Checkboxes funcionam corretamente (Selecionar Tudo/Individual).
- Floating Action Bar aparece e desaparece no momento certo.
- Ações são executadas corretamente para todos os IDs selecionados.
- A barra exibe a contagem de itens selecionados.
