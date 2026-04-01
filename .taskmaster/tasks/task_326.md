# Task ID: 326

**Title:** Mockar fetchs externos nos testes unitarios/a11y

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Remover dependencia de backend/localhost nos testes de componentes e a11y.

**Details:**

Adicionar mocks de fetch para testes que carregam recursos externos (ex: prospect modal e wizard). Usar MSW ou mocks pontuais no setup dos testes para impedir requests reais para localhost/evil.com. Garantir que os testes de a11y e unitarios nao dependam de servidor rodando.

**Test Strategy:**

npm run test:coverage passa sem backend ativo e sem conexoes para localhost.
