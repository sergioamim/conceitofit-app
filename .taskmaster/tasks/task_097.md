# Task 097: Estruturar tratamento de erro e observabilidade dos boundaries

## Objetivo
Evoluir os error boundaries para usar erros tipados do projeto e entregar recuperação, mensagem consistente e contexto técnico útil para suporte.

## Paralelização
- Pode rodar em paralelo com as Tasks 096 e 098.
- Deve terminar antes da Task 099.

## Subtarefas
- [x] Auditar o shape real de `ApiRequestError` e os helpers já existentes de normalização de erro.
- [x] Refatorar `ErrorState` para consumir erros estruturados, sem heurísticas frágeis por string.
- [x] Alinhar `src/app/error.tsx`, `src/app/(app)/error.tsx` e `src/app/not-found.tsx` para linguagem e recuperação consistentes.
- [x] Validar cenários de erro global, erro do shell e 404 com feedback correto ao usuário.

## Definição de Pronto (DoP)
- `ErrorState` entende corretamente erros HTTP tipados e erros genéricos.
- Mensagens para o usuário são claras e os detalhes técnicos ficam controlados.
- `reset()` continua funcionando corretamente nos boundaries.
- O estado 404 e os boundaries compartilham linguagem visual e de recuperação coerentes.
