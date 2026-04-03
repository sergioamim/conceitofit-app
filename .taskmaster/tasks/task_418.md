# Task ID: 418

**Title:** Reestabilizar módulos avançados do backoffice global

**Status:** done

**Dependencies:** 356 ✓

**Priority:** high

**Description:** Resolver as falhas remanescentes do backoffice global depois do bootstrap básico, cobrindo rotas satélite, impersonação, onboarding/unidades e importação EVO.

**Details:**

Escopo: `tests/e2e/admin-backoffice-coverage.spec.ts`, `tests/e2e/backoffice-global.spec.ts`, `tests/e2e/backoffice-impersonation.spec.ts`, `tests/e2e/backoffice-importacao-evo.spec.ts` e `tests/e2e/backoffice-seguranca-rollout.spec.ts`. Evidências atuais: vários buckets ainda ficam presos em `Validando permissões do backoffice...`, como em `test-results/admin-backoffice-coverage--9a392-anceiro-e-modulos-satelites-chromium/error-context.md`, `test-results/backoffice-impersonation-B-275c4-rra-com-trilha-no-audit-log-chromium/error-context.md` e `test-results/backoffice-seguranca-rollo-3f6bd-registra-exceção-controlada-chromium/error-context.md`; já `backoffice-global` entra em `/admin/academias`, então o resíduo ali é funcional de rota/mutação; `backoffice-importacao-evo` rende o fluxo de unidades, mas acusa `Não foi possível carregar o onboarding global: Unidade não encontrada` em `test-results/backoffice-importacao-evo--ab6ba-ui-job-pelo-fluxo-principal-chromium/error-context.md`. Revisar `src/app/(backoffice)/admin/*`, guards globais, resolução de academia/unidade no contexto administrativo, impersonação e a jornada de importação EVO.

**Test Strategy:**

Executar os cinco specs do escopo em chromium. Validar que o shell global sai do estado de validação, que impersonação/audit log voltam a completar a trilha esperada e que o fluxo de onboarding/importação EVO consegue localizar o contexto correto sem erro de unidade inexistente.
