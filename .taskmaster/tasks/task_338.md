# Task ID: 338

**Title:** Corrigir crashes reais em rotas globais do backoffice /admin

**Status:** done

**Dependencies:** 336 ✓

**Priority:** high

**Description:** Resolver falhas de rota/módulo no shell global do backoffice que sobraram após a estabilização de auth.

**Details:**

Escopo: tests/e2e/admin-backoffice-coverage.spec.ts, tests/e2e/admin-backoffice-global-crud.spec.ts e tests/e2e/backoffice-impersonation.spec.ts. Reproduções já catalogadas: /admin/financeiro/contratos com ERR_CONNECTION_RESET; /admin/seguranca/funcionalidades, /admin/operacional/alertas, /admin/academias e /admin/seguranca/usuarios/user-bruno com ERR_CONNECTION_REFUSED. Estratégia: revisar crashes do dev/runtime nessas rotas e garantir que o shell global continue subindo com os mesmos contratos de sessão usados na task 331. Fora de escopo: reabrir seeds operacionais ou fallback genérico de mocks.

**Test Strategy:**

No test strategy provided.
