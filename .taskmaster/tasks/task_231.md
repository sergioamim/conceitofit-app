# Task ID: 231

**Title:** Splitar clientes-client.tsx (578 LOC, 12 useState)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Extrair useClientesWorkspace() hook, ClientesFilterBar e ClientesTable.

**Details:**

Hook consolida os 12 useState em estado único. ClientesFilterBar gerencia busca, filtro de status, page size. ClientesTable renderiza listagem com bulk actions. Cada arquivo < 250 LOC.

**Test Strategy:**

Funcionalidade inalterada. Testes existentes passam.
