# Task ID: 339

**Title:** Corrigir boundary server/client em /admin/importacao-evo

**Status:** done

**Dependencies:** 336 ✓

**Priority:** medium

**Description:** Ajustar a tela de importação EVO para não chamar hook client-only no servidor.

**Details:**

Reprodução já observada no fluxo de tests/e2e/backoffice-seguranca.spec.ts ao navegar para /admin/importacao-evo: Attempted to call useEvoImportPage() from the server but useEvoImportPage is on the client. Estratégia: revisar o boundary de server/client em src/app/(backoffice)/admin/importacao-evo-p0 e garantir que a rota seja renderizável no shell global sem mascarar erro com remoção de asserts. Fora de escopo: mudanças na fixture de backoffice global.

**Test Strategy:**

No test strategy provided.
