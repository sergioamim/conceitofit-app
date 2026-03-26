# Task 099: Refatorar estratégia de foco e acessibilidade por primitives

## Objetivo
Preservar os ganhos da Task 093, mas migrando a política de foco para os primitives e componentes compartilhados, em vez de depender de uma regra global agressiva.

## Paralelização
- Esta é a última tarefa da proposta.
- Só deve começar após as Tasks 096, 097 e 098.

## Subtarefas
- [x] Mapear conflitos entre `*:focus-visible` global e os primitives atuais.
- [x] Definir tokens/classes utilitárias compartilhadas para focus ring.
- [x] Migrar `Button`, `Input`, `Select`, `Tabs`, links e componentes compartilhados prioritários para a nova convenção.
- [x] Simplificar o CSS global preservando skip link, contraste e navegação por teclado.

## Definição de Pronto (DoP)
- O foco visível continua forte e acessível.
- Não há mais conflito recorrente entre CSS global e primitives.
- Navegação por teclado segue consistente nos fluxos principais.
- A base de UI fica mais previsível para futuras evoluções de design system.
