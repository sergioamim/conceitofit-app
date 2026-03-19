# Task ID: 46

**Title:** Atualizar ClienteHeader e usos para ação Excluir

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar entrada de menu Excluir cliente e novos props de controle, mantendo compatibilidade com outras telas.

**Details:**

Em src/components/shared/cliente-header.tsx, aceitar props canDeleteCliente e onExcluir; renderizar item de menu abaixo das ações existentes, fechando o menu antes de chamar o callback. Manter árvore estável e sem condicional client-only. Atualizar usos em src/app/(app)/clientes/[id]/page.tsx e src/app/(app)/clientes/[id]/cartoes/page.tsx para passar canDeleteCliente (do useTenantContext) e onExcluir (abre modal). Pseudo-código: if (canDeleteCliente && onExcluir) render <button>Excluir cliente</button>.

**Test Strategy:**

Teste manual nas duas telas garantindo que o menu não quebra e que a ação só aparece com a flag true.
