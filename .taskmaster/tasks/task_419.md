# Task ID: 419

**Title:** Reestabilizar jornadas operacionais de clientes e CRM

**Status:** done

**Dependencies:** 353 ✓, 355 ✓

**Priority:** high

**Description:** Corrigir os fluxos de cadastro de cliente e workspace CRM para que navegação, criação e módulos principais voltem a convergir no runtime atual.

**Details:**

Escopo: `tests/e2e/clientes-cadastro.spec.ts` e `tests/e2e/crm-operacional.spec.ts`. Evidências atuais: `clientes-cadastro` cai na listagem de `/clientes` sem completar o fluxo esperado de `Novo cliente`, com shell já carregada em `test-results/clientes-cadastro-Cadastro-9580d-iente-com-plano-e-pagamento-chromium/error-context.md`; `crm-operacional` renderiza o menu e o workspace CRM, mas ainda falha antes de validar campanhas, funil, playbooks e tarefas em `test-results/crm-operacional-CRM-operac-205e2-módulos-operacionais-do-CRM-chromium/error-context.md`. Revisar especialmente `src/app/(app)/clientes/*`, `src/components/clientes/*`, `src/app/(app)/crm/*`, `src/components/crm/*` e contratos mínimos/mocks compartilhados pelos helpers E2E dessas jornadas.

**Test Strategy:**

Executar `tests/e2e/clientes-cadastro.spec.ts` e `tests/e2e/crm-operacional.spec.ts` em chromium. Validar que o wizard/modal de cliente volta a abrir e concluir a jornada com plano/pagamento e que o workspace CRM navega pelos módulos operacionais esperados sem regressão de contexto.
