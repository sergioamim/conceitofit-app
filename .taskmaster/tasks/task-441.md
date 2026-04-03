# Task 441: Migrar tabelas de WhatsApp para PaginatedTable

## Status: pending
## Priority: medium
## Dependencies: 432, 436

## Description
Substituir tabelas HTML raw de canais e mensagens em /admin/whatsapp por duas PaginatedTables.

## Details
Em src/app/(backoffice)/admin/whatsapp/page.tsx, a página tem duas seções tabulares: (1) canais/instâncias WhatsApp e (2) mensagens recentes. Cada uma deve virar PaginatedTable independente. Canais: colunas nome, academia, telefone, status (badge), mensagens/dia, ações. Mensagens: colunas data, canal, destinatário, tipo, status, preview. Adicionar TableFilters integrado (já migrado para SuggestionInput na task 425).

## Test Strategy
Teste manual: abrir /admin/whatsapp, verificar duas PaginatedTables, filtros funcionam, paginação funciona em ambas.
