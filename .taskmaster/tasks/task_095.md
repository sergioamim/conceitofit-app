# Task 095: Implementar Global Error Boundaries e Resiliência

## Objetivo
Tratar erros críticos sem quebrar a aplicação inteira e oferecer um caminho claro de recuperação.

## Subtarefas
- [ ] Criar o componente `ErrorState` reutilizável em `src/components/shared/`.
- [ ] Implementar `src/app/error.tsx` (Error Boundary Global).
- [ ] Implementar `src/app/(app)/error.tsx` (Error Boundary do Shell Operacional).
- [ ] Adicionar botão de "Tentar Novamente" (`reset()`) nas páginas de erro.
- [ ] Capturar erros de `ApiRequestError` no Boundary para exibir mensagens técnicas úteis para o suporte.
- [ ] Criar uma "Página 404" (`not-found.tsx`) estilizada.

## Definição de Pronto (DoP)
- Falhas em componentes individuais não causam "tela branca" total.
- Usuário vê uma interface clara explicando o erro.
- O botão de "Tentar" recarrega apenas a parte quebrada do app.
- Registro visual de erros capturados.
