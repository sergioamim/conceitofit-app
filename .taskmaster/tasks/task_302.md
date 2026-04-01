# Task ID: 302

**Title:** Testes unitários — src/lib/tenant/treinos (v2-runtime + v2-domain)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar testes unitários para o lifecycle de treinos, lógica de renovação/revisão e cálculos de progressão nos módulos `v2-runtime.ts` e `v2-domain.ts`.

**Details:**

Criar o arquivo `tests/unit/treinos-v2-full.spec.ts`. Implementar testes para: 1. Ciclo de vida de um treino (criação, atribuição, execução, encerramento). 2. Lógica de renovação e revisão de treinos. 3. Cálculos de progressão (volume, carga, repetições). 4. Cenários de borda como treino sem exercícios, exercício desativado, aluno sem histórico. Mockar quaisquer dependências de dados ou serviços. Pseudo-código: `describe('workout lifecycle', () => {
   it('should correctly mark a workout as completed', () => {
     const workout = { status: 'active', exercises: [{ id: 1, completed: false }] };
     const updatedWorkout = completeWorkout(workout);
     expect(updatedWorkout.status).toBe('completed');
   });
 });`

**Test Strategy:**

Executar os testes unitários. Validar as transições de estado dos treinos, a precisão dos cálculos de progressão e o tratamento de cenários negativos. Assegurar alta cobertura de linha para `v2-runtime.ts` e `v2-domain.ts`.
