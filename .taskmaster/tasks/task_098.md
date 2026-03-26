# Task 098: Consolidar política de motion com reduced motion e custo controlado

## Objetivo
Transformar motion em uma política compartilhada do app, respeitando `prefers-reduced-motion` e evitando efeitos espalhados sem critério único.

## Paralelização
- Pode rodar em paralelo com as Tasks 096 e 097.
- Deve terminar antes da Task 099.

## Subtarefas
- [x] Inventariar as animações atuais e classificar o que é estrutural, tátil ou cosmético.
- [x] Definir a política de motion do app, com tempos, easing e fallback para `reduced motion`.
- [x] Criar uma camada shared de motion para os componentes permitidos.
- [x] Migrar componentes animados para essa política e remover efeitos redundantes ou custo sem retorno.

## Definição de Pronto (DoP)
- O app tem uma convenção única para motion.
- `prefers-reduced-motion` é respeitado nos componentes afetados.
- Não há dependência ou efeito animado mantido sem caso de uso claro.
- Feedback tátil e transições remanescentes ficam consistentes entre componentes.
