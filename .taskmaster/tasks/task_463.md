# Task ID: 463

**Title:** Expandir portal do aluno: Meus Treinos com visual detalhado

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Completar /aluno/meus-treinos com visualização detalhada do treino atribuído, séries, exercícios e marcação de conclusão.

**Details:**

A página (aluno)/meus-treinos/page.tsx atual é mínima. Implementar: (1) Lista de treinos atribuídos ao aluno, (2) Visualização detalhada com séries, exercícios, reps, carga, intervalo, (3) Técnicas especiais (conjugado, drop-set, progressivo) com ícones, (4) Marcação de treino como concluído, (5) Histórico de treinos concluídos, (6) Indicador de aderência (% concluídos). Reutilizar componentes de treinos V2 do portal. Hydration safety: dados do treino vêm do backend, sem cálculo client-side no primeiro render.

**Test Strategy:**

Testes unitários do componente de visualização de treino. Teste E2E: aluno vê treinos atribuídos → marca como concluído → histórico atualiza. Teste com treino vazio e sem treinos atribuídos.
