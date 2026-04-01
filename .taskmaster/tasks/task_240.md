# Task ID: 240

**Title:** Página "Meus Treinos" no portal do aluno

**Status:** done

**Dependencies:** 239 ✓

**Priority:** medium

**Description:** Listar treinos atribuídos ao aluno logado. Exibir divisão, exercícios, séries, carga, aderência. Marcar execução.

**Details:**

Usar API existente: GET /api/v1/treinos?alunoId=. Exibir cards por divisão (A, B, C). Cada card com exercícios, séries, reps, carga sugerida. Botão "Concluir treino" chama POST execução. Exibir aderência % e status do ciclo.

**Test Strategy:**

Aluno vê treinos atribuídos. Registra execução. Aderência atualiza.
