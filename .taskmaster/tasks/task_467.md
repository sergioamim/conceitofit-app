# Task ID: 467

**Title:** Splitar treino-v2-editor.tsx (978 LOC) em sub-componentes

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Refatorar src/components/treinos/treino-v2-editor.tsx de 978 LOC em 5-6 componentes de editor de treino.

**Details:**

O editor mistura: (1) Canvas de séries, (2) Drawer de exercícios (biblioteca lateral), (3) Editor inline de série (reps, carga, intervalo), (4) Toolbar de técnicas especiais (conjugado, drop-set, progressivo), (5) Header do treino (nome, frequência, semanas), (6) Ações (salvar, publicar, replicar). Separar em: EditorCanvas (séries), ExerciseDrawer (biblioteca), SeriesEditor (inline), TechniqueToolbar, EditorHeader. Usar pattern de compound components.

**Test Strategy:**

Testes unitários de SeriesEditor e TechniqueToolbar. Teste E2E do editor completo sem regressão. Teste de acessibilidade do editor.
