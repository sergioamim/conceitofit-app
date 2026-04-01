# Task ID: 241

**Title:** Página "Minhas Aulas" com reserva online no portal do aluno

**Status:** done

**Dependencies:** 239 ✓

**Priority:** medium

**Description:** Listar aulas disponíveis na grade semanal. Reservar vaga, ver status, cancelar reserva.

**Details:**

Usar API existente: GET /api/v1/agenda/aulas/sessoes, POST /api/v1/agenda/reservas. Grid semanal com slots disponíveis. Indicar: vagas livres, lotado, lista de espera. Reservar com um tap. Cancelar reserva. Exibir status (confirmada, espera).

**Test Strategy:**

Aluno reserva aula. Vaga atualiza. Cancelamento funciona.
