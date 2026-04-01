# Task ID: 285

**Title:** Migrar portal do aluno (meus-treinos, check-in) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** meus-treinos e check-in usam useState para dados do aluno logado.

**Details:**

Criar useMeusTreinos() e useCheckIn() hooks. Mutation para registrar execução/presença com invalidação.

**Test Strategy:**

Portal carrega com cache. Concluir treino invalida. Check-in registra e atualiza.
