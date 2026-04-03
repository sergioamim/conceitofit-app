# Task 436: Migrar filtro de academia na página WhatsApp para SuggestionInput

## Status: pending
## Priority: medium
## Dependencies: 433

## Description
Substituir <Select> de filtro de academia em /admin/whatsapp por SuggestionInput.

## Details
Em src/app/(backoffice)/admin/whatsapp/page.tsx, substituir o <Select> de filtro de academia por SuggestionInput usando useAcademiaSuggestion. Manter lógica de filtragem de canais/mensagens por academia selecionada.

## Test Strategy
Teste manual: abrir /admin/whatsapp, verificar SuggestionInput de academia, buscar e selecionar, verificar filtragem funciona.
