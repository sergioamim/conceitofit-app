# Task ID: 235

**Title:** Testes para novo-cliente-wizard (após split)

**Status:** done

**Dependencies:** 230 ✓

**Priority:** low

**Description:** Testar navegação entre steps, validação por step, draft persistence, submit final.

**Details:**

Criar tests/components/novo-cliente-wizard.test.tsx. Testar happy path (dados válidos em todos os steps → submit). Testar error path (validação falha em cada step). Testar draft persistence (recarregar mantém dados).

**Test Strategy:**

Happy path + error path cobertos. Draft persistence testado.
