# Task ID: 414

**Title:** Atualizar tipos, contratos e cobertura do handoff contextualizado

**Status:** done

**Dependencies:** 413 ✓

**Priority:** high

**Description:** Propagar tipos do endpoint e ajustar testes/mocks relacionados ao handoff.

**Implementação**
- `src/lib/api/auth.ts`: tipo `AdminEntrarComoUnidadeRequest` exposto e usado no helper do endpoint.
- `tests/e2e/support/auth-session.ts`: JWT mock agora inclui claims canônicas (`activeTenantId`, `tenantBaseId`, `redeId`, etc.) para refletir sessão única.
- `tests/e2e/support/backend-only-stubs.ts`: stub do endpoint `/api/v1/admin/auth/entrar-como-unidade` atualizado para reemitir sessão com tenant selecionado.
