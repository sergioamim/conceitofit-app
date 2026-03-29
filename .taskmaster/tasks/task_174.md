# Task ID: 174

**Title:** Adicionar testes e2e para fluxo de conta demo

**Status:** done

**Dependencies:** 173 ✓

**Priority:** low

**Description:** Fluxo de conta demo (/b2b/demo) implementado sem teste e2e.

**Details:**

Criar tests/e2e/demo-account.spec.ts: acessar /b2b/demo e verificar formulario, validacao de campos (nome vazio, email invalido, senha curta), submissao com dados validos (mock API), redirecionamento para /dashboard?demo=1, banner Conta Demonstracao visivel, dismiss do banner persiste na sessao.

**Test Strategy:**

npx playwright test demo-account.spec.ts passa.
