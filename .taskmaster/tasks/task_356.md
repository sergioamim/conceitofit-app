# Task ID: 356

**Title:** Estabilizar bootstrap de permissão e sessão do backoffice global

**Status:** done

**Dependencies:** 348 ✓, 350 ✓

**Priority:** high

**Description:** Corrigir o shell global do backoffice para não ficar preso em validação de permissões ou redirecionar incorretamente para guard legado.

**Details:**

Escopo: `tests/e2e/backoffice-seguranca.spec.ts`, `tests/e2e/admin-backoffice-global-crud.spec.ts`, `tests/e2e/bi-operacional.spec.ts` e rotas que dependem do layout global de `/admin`. Evidências atuais: `Validando permissões do backoffice...` preso em `test-results/backoffice-seguranca-Backo-73db2-de-em-unidades-e-onboarding-chromium/error-context.md` e o bucket de BI caindo numa tela genérica de login em `test-results/bi-operacional-BI-operacio-e6feb-rede-com-filtros-gerenciais-chromium/error-context.md`. Revisar `src/app/(backoffice)/admin/layout.tsx`, bootstrap de autenticação administrativa, resolução de `access.loading`, comportamento de redirect e acoplamento entre shell global e áreas operacionais. Fora de escopo: mudanças de backend em RBAC global que alterem o contrato de permissões.

**Test Strategy:**

Executar `tests/e2e/backoffice-seguranca.spec.ts`, `tests/e2e/admin-backoffice-global-crud.spec.ts` e `tests/e2e/bi-operacional.spec.ts` em chromium. Validar que o backoffice sai do estado de validação, renderiza o conteúdo esperado e não cai em login indevido quando a fixture fornece sessão válida.
