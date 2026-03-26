# Task 096: Higienizar base React/SSR e zerar lint crítico da UI

## Objetivo
Limpar a base antes de continuar refinando a interface, removendo smells estruturais e regressões de SSR/hidratação que hoje atrapalham evolução segura.

## Paralelização
- Pode rodar em paralelo com as Tasks 097 e 098.
- Deve terminar antes da Task 099.

## Subtarefas
- [x] Corrigir efeitos com `setState` síncrono em `useEffect` nos fluxos de rascunho, preferências e validação assíncrona.
- [x] Remover imports mortos, ruído de layout e artefatos locais como `template.tsx.bak`.
- [x] Revisar os componentes alterados recentemente contra o checklist de hydration safety do projeto.
- [x] Fechar a tarefa com `npm run lint` limpo nas áreas tocadas.

## Definição de Pronto (DoP)
- Erros atuais de lint relacionados a efeitos e estado foram eliminados.
- O shell não contém arquivos temporários ou código morto introduzido por retrabalho.
- Componentes revisados seguem os guardrails de SSR/hidratação do repositório.
- A base fica pronta para receber os próximos ajustes de motion, erro e foco.
