# Task ID: 322

**Title:** Adicionar --coverage ao Vitest e gate no CI

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Medir cobertura de testes real e publicar no CI.

**Details:**

Adicionar provider: 'v8' ao vitest.config.ts. Adicionar script 'test:coverage' no package.json. No GitHub Actions workflow, rodar test:coverage e publicar report como artifact. Adicionar badge de coverage no README. Nao bloquear merge por enquanto (apenas medir), threshold pode vir depois.

**Test Strategy:**

npm run test:coverage gera relatorio. CI publica artifact com coverage HTML.
