# Task ID: 416

**Title:** Reestabilizar login e jornadas públicas de aquisição

**Status:** done

**Dependencies:** 353 ✓, 354 ✓

**Priority:** high

**Description:** Corrigir regressões em login e fluxos públicos para que o usuário avance do formulário inicial ao destino esperado sem ficar preso na tela de entrada ou falhar no handoff para o app autenticado.

**Details:**

Escopo: `tests/e2e/security-flows.spec.ts`, `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/demo-account.spec.ts`. Evidências atuais: `security-flows` ainda para na tela `Acesso` em `test-results/security-flows-Fluxos-crít-f8bd5--redireciona-para-dashboard-chromium/error-context.md`; `demo-account` permanece no formulário público sem redirecionar para `/dashboard?demo=1` em `test-results/demo-account-Fluxo-de-cont-2e921-a-para-dashboard-com-demo-1-chromium/error-context.md`; `adesao-publica` sobe com tenant/plano e formulário preenchido, mas ainda precisa voltar a convergir até checkout/pendências no runtime atual, conforme histórico consolidado em `docs/PLAYWRIGHT_RESIDUOS_BACKEND_TASK_352_2026-04-02.md` e `docs/PLAYWRIGHT_STABILIZATION_BASELINE_2026-04-01.md`. Revisar principalmente bootstrap de sessão e redirect em `src/lib/api/session.ts`, `src/app/login`, `src/app/(public)/adesao*` e `src/app/(public)/b2b/demo/*`.

**Test Strategy:**

Executar `tests/e2e/security-flows.spec.ts`, `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/demo-account.spec.ts` em chromium. Validar que o login redireciona para o dashboard com tenant resolvido, que a conta demo persiste a sessão e abre `/dashboard?demo=1`, e que a jornada pública volta a avançar até as etapas finais sem travar no formulário inicial.
