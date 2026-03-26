# Task 090: Implementar Sticky Action Footer para Formulários Longos

## Objetivo
Manter os botões de ação (Salvar/Cancelar) sempre acessíveis, independente da posição de scroll.

## Subtarefas
- [ ] Criar o componente `StickyActionFooter` em `src/components/shared/`.
- [ ] Implementar comportamento "Sticky" no rodapé que aparece apenas em telas longas (ou permanentemente em mobile).
- [ ] Adicionar suporte a estados: `isDirty` (botão de salvar muda de cor ou pulsa quando há mudanças não salvas).
- [ ] Refatorar formulário de `Cadastro de Cliente` para utilizar o novo footer.
- [ ] Garantir que o conteúdo do formulário tenha `padding-bottom` extra para não ser obstruído pelo footer.

## Definição de Pronto (DoP)
- Barra de ações visível na parte inferior da tela.
- Botões de "Salvar" e "Cancelar" funcionando corretamente.
- Layout responsivo (em mobile ocupa toda a largura).
- Visual integrado ao tema escuro da aplicação.
