# Task ID: 95

**Title:** Implementar Global Error Boundaries e Resiliência

**Status:** done

**Dependencies:** 83 ✓

**Priority:** high

**Description:** Tratar erros críticos sem quebrar a aplicação inteira e oferecer um caminho claro de recuperação.

**Details:**

Criar o componente ErrorState reutilizável. Implementar src/app/error.tsx e src/app/(app)/error.tsx. Adicionar botão de Tentar Novamente (reset()). Capturar erros de ApiRequestError no Boundary para exibir mensagens técnicas úteis.

**Test Strategy:**

Falhas em componentes individuais não causam tela branca total. Usuário vê uma interface clara explicando o erro. O botão de Tentar recarrega apenas a parte quebrada do app.
