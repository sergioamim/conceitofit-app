# Task 444: Migrar tabela de transações do Dashboard Financeiro para PaginatedTable

## Status: pending
## Priority: low
## Dependencies: 432

## Description
Substituir tabela raw de transações recentes em /admin/financeiro por PaginatedTable, mantendo cards de KPI.

## Details
Em src/app/(backoffice)/admin/financeiro/page.tsx (dashboard), manter cards de KPI no topo intactos. Substituir apenas a seção de transações recentes (tabela raw) por PaginatedTable com colunas: data (formatada), academia, tipo (badge), valor (moeda BRL), status (StatusBadge). Adicionar filtros inline básicos: período e busca textual.

## Test Strategy
Teste manual: abrir /admin/financeiro, verificar cards de KPI intactos no topo, PaginatedTable abaixo com transações, filtros e paginação.
