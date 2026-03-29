# Task ID: 230

**Title:** Splitar novo-cliente-wizard.tsx (924 LOC)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Extrair WizardStepDadosPessoais, WizardStepEndereco, WizardStepPlano e useClienteWizardState hook.

**Details:**

Manter NovoClienteWizard como orquestrador. Cada step < 200 LOC. Hook gerencia: currentStep, formData, validation state, draft persistence. Usar react-hook-form com schema por step.

**Test Strategy:**

Funcionalidade inalterada. Testes existentes passam. Cada sub-componente < 200 LOC.
