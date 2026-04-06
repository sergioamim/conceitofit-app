# Task ID: 470

**Title:** Criar testes para componentes splitados e estabelecer padrão

**Status:** pending

**Dependencies:** 466, 467, 468, 469

**Priority:** medium

**Description:** Criar testes unitários para todos os sub-componentes resultantes do split e documentar padrão de max 300 LOC por componente.

**Details:**

Para cada componente splitado (tasks 466-469), criar: (1) Teste de renderização com dados válidos, (2) Teste de estados de loading/error/empty, (3) Teste de interações (cliques, submissão de form), (4) Teste de acessibilidade básico. Atualizar AGENTS.md com guideline de max 300 LOC para componentes, com exceções justificadas. Adicionar regra ESLint max-lines warning em 300.

**Test Strategy:**

30+ novos testes de componentes cobrindo os sub-componentes splitados. Coverage de componentes sobe de ~14% para ~30%.
