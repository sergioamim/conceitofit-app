# Task 443: Redesenhar página de Unidades com PaginatedTable e SuggestionInput

## Status: pending
## Priority: high
## Dependencies: 432, 433

## Description
Substituir layout sidebar com lista de botões (UnitsTableCard) por PaginatedTable com SuggestionInput para academia.

## Details
Em /admin/unidades, substituir o layout de sidebar com lista de botões de academias (UnitsTableCard) por: (1) SuggestionInput para selecionar academia no topo usando useAcademiaSuggestion, (2) PaginatedTable para listar unidades da academia selecionada com colunas: nome, CNPJ (formatado), cidade/UF, status (StatusBadge), alunos ativos (número), ações (DataTableRowActions: editar, desativar). Se nenhuma academia selecionada, mostrar TODAS as unidades com coluna "Academia" visível. Adicionar TableFilters com busca textual, status (Select), cidade (text). Eliminar componente UnitsTableCard. Paginação server-side.

## Test Strategy
Teste E2E: abrir /admin/unidades, verificar SuggestionInput no topo, selecionar academia, verificar que PaginatedTable filtra unidades, limpar filtro e verificar todas as unidades com coluna Academia visível.
