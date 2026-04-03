# Task 440: Migrar tabelas de Alertas Operacionais para PaginatedTable

## Status: pending
## Priority: medium
## Dependencies: 432, 433

## Description
Substituir tabela HTML raw em /admin/operacional/alertas por PaginatedTable com filtros por severidade e academia.

## Details
Em src/app/(backoffice)/admin/operacional/alertas/page.tsx, substituir tabela raw por PaginatedTable. Colunas: tipo (badge), severidade (badge colorido — critical/warning/info), academia (texto), mensagem (texto truncado com tooltip), data/hora (formatada), ações (resolver/silenciar). Adicionar TableFilters com: severidade (Select), academia (SuggestionInput via useAcademiaSuggestion), período (date-range).

## Test Strategy
Teste manual: abrir /admin/operacional/alertas, verificar PaginatedTable com colunas e filtros, testar filtro por severidade e academia.
