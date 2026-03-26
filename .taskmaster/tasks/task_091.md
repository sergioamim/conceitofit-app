# Task 091: Implementar Validação Inline e Feedback Assíncrono

## Objetivo
Fornecer feedback imediato de erros para o usuário, evitando o "medo do submit".

## Subtarefas
- [ ] Configurar os formulários principais para o modo de validação `onBlur` ou `onChange`.
- [ ] Implementar mensagens de erro dinâmicas (Zod) em tempo real.
- [ ] Criar o componente `FieldAsyncFeedback` que exibe estado de "Checando..." e depois "OK" ou "Erro" (ex: "E-mail já cadastrado").
- [ ] Integrar busca de unicidade (CPF/Email) no backend enquanto o usuário digita.
- [ ] Melhorar visual dos campos com erro (borda vermelha e texto de ajuda).

## Definição de Pronto (DoP)
- Erros de formato (ex: email inválido) aparecem logo após o usuário sair do campo.
- Feedback de "Checking" (Spinner discreto) em campos de unicidade.
- Botão "Salvar" é desativado se houver erros críticos visíveis.
