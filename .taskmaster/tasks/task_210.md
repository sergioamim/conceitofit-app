# Task ID: 210

**Title:** Refactor: Splitar componentes com mais de 500 LOC

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Vários componentes excedem 500+ LOC: novo-cliente-wizard (924), usuarios page (942), nova-conta-pagar-modal (704), prospect-detail-modal (581), clientes-client (578).

**Details:**

Componentes a splitar: 1) novo-cliente-wizard.tsx (924 LOC) → WizardStepPessoal, WizardStepEndereco, WizardStepPlano + useClienteWizardState hook. 2) admin/seguranca/usuarios/page.tsx (942 LOC) → UsuariosFilters, UsuariosTable, UsuarioFormModal. 3) clientes-client.tsx (578 LOC, 12 useState) → useClientesWorkspace hook + ClientesTable + ClientesFilters. 4) nova-conta-pagar-modal.tsx (704 LOC) → ContaPagarForm + ContaPagarPreview. 5) prospect-detail-modal.tsx (581 LOC) → ProspectInfo + ProspectTimeline + ProspectActions.

**Test Strategy:**

Funcionalidade inalterada após split. Testes existentes continuam passando. Nenhum componente excede 300 LOC.
