# Task ID: 462

**Title:** Expandir portal do aluno: Minhas Aulas com reserva e waitlist

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Completar /aluno/minhas-aulas com grade semanal, reserva online, cancelamento e waitlist em tempo real.

**Details:**

A página (aluno)/minhas-aulas/page.tsx atual é mínima. Implementar: (1) Grade semanal com aulas da unidade do aluno, (2) Botão de reservar com confirmação, (3) Botão de cancelar reserva, (4) Indicador de posição na waitlist, (5) Contador de vagas restantes, (6) Filtro por semana, (7) Histórico de presenças. Reutilizar componentes de grade do portal (src/app/(portal)/grade/) adaptados para visão do aluno. Hydration safety: grade renderiza skeleton no SSR, dados reais após mount.

**Test Strategy:**

Testes unitários dos componentes de grade e reserva. Teste E2E: reservar aula → aparece na grade → cancelar → vaga liberada. Teste de concorrência: waitlist funciona quando aula lota.
