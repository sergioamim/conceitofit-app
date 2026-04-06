# Task ID: 469

**Title:** Splitar funcionario-form-page.tsx (909 LOC) e importacao EvoPacoteTab (815 LOC)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Refatorar funcionarios/funcionario-form-page.tsx (909 LOC) e importacao-evo-p0/components/EvoPacoteTab.tsx (815 LOC).

**Details:**

funcionario-form: separar em FormDadosPessoais, FormCargoDepartamento, FormAcessosUnidades, FormDocumentos. EvoPacoteTab: separar em PacoteUpload (upload + validação), PacoteAnalise (resumo + stats), PacoteJobStatus (polling + progresso), PacoteRejeicoes (lista de erros). Cada sub-componente com responsabilidade única e <200 LOC.

**Test Strategy:**

Testes unitários dos formulários com react-hook-form + zod. Teste E2E de criação de funcionário e importação EVO sem regressão.
