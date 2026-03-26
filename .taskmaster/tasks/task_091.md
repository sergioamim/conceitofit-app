# Task ID: 91

**Title:** Implementar Validação Inline e Feedback Assíncrono

**Status:** done

**Dependencies:** 90 ✓

**Priority:** high

**Description:** Fornecer feedback imediato de erros para o usuário, evitando o medo do submit.

**Details:**

Configurar os formulários principais para o modo de validação onBlur ou onChange. Implementar mensagens de erro dinâmicas (Zod) em tempo real. Criar o componente FieldAsyncFeedback que exibe estado de Checando... e depois OK ou Erro. Integrar busca de unicidade (CPF/Email) no backend enquanto o usuário digita.

**Test Strategy:**

Erros de formato (ex: email inválido) aparecem logo após o usuário sair do campo. Feedback de Checking (Spinner discreto) em campos de unicidade. Botão Salvar é desativado se houver erros críticos visíveis.
