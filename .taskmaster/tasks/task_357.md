# Task ID: 357

**Title:** Revalidar buckets Playwright após correções frontend e isolar resíduo final

**Status:** done

**Dependencies:** 353 ✓, 354 ✓, 355 ✓, 356 ✓, 352 ✓

**Priority:** high

**Description:** Reexecutar os buckets impactados depois das correções frontend e documentar o que restar como dependência real de backend ou fixture.

**Details:**

Escopo: rerun focalizado dos buckets afetados nesta rodada, com nova consolidação de evidências. O objetivo não é “passar pano” nos testes, mas confirmar que as correções frontend removeram stuck-loaders, guard loops, problemas de carrinho e bootstrap de backoffice. Em seguida, registrar o residual final com separação explícita entre: frontend resolvido, backend ainda necessário e ruído de harness. Reutilizar como referência os documentos `docs/PLAYWRIGHT_RESIDUOS_BACKEND_TASK_352_2026-04-02.md` e `docs/PLAYWRIGHT_FRONTEND_TASKS_2026-04-02.md`.

**Test Strategy:**

Executar, no mínimo, `tests/e2e/app-multiunidade-contrato.spec.ts`, `tests/e2e/sessao-multiunidade.spec.ts`, `tests/e2e/auth-rede.spec.ts`, `tests/e2e/onboarding-fluxo-completo.spec.ts`, `tests/e2e/comercial-fluxo.spec.ts`, `tests/e2e/backoffice-seguranca.spec.ts` e `tests/e2e/bi-operacional.spec.ts`. Consolidar novo relatório e validar que qualquer falha remanescente está claramente classificada como frontend, backend ou fixture.
