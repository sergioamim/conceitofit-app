# Task 092: Implementar Rascunhos e Auto-save em Formulários Críticos

## Objetivo
Proteger o usuário contra perda acidental de dados em cadastros extensos.

## Subtarefas
- [ ] Criar o hook customizado `useFormDraft` para persistência em `localStorage`.
- [ ] Implementar política de expiração de rascunhos (ex: rascunho expira em 24h).
- [ ] Adicionar um pequeno indicador de "Salvo no rascunho" no topo do formulário.
- [ ] Criar o modal "Continuar preenchimento?" ao reabrir um formulário inacabado.
- [ ] Garantir que o rascunho seja limpo após um envio (`onSubmit`) bem-sucedido.
- [ ] Implementar em: Cadastro de Cliente, Cadastro de Plano e Matrícula.

## Definição de Pronto (DoP)
- Digitar em um formulário e fechar a aba mantém os dados ao reabrir.
- O sistema oferece restaurar os dados detectados no `localStorage`.
- O rascunho não entra em conflito com dados reais vindos do backend (em caso de edição).
- Limpeza correta após sucesso.
