# Task 437: Migrar filtros de academia em Segurança/Usuários para SuggestionInput

## Status: pending
## Priority: medium
## Dependencies: 433

## Description
Substituir <Select> de academia nos filtros de /admin/seguranca/usuarios por SuggestionInput.

## Details
Em src/app/(backoffice)/admin/seguranca/usuarios/page.tsx, substituir todos os <Select> de academia nos filtros por SuggestionInput usando useAcademiaSuggestion. Foco apenas nos filtros — a migração da tabela customizada UsuariosTable para PaginatedTable será na Fase 3 (task separada).

## Test Strategy
Teste manual: abrir /admin/seguranca/usuarios, verificar filtros com SuggestionInput, buscar academia, verificar filtragem funciona.
