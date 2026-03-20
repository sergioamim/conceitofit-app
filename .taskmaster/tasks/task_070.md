# Task ID: 70

**Title:** Implementar cadastro rapido de colaborador com criacao opcional de acesso

**Status:** done

**Dependencies:** 68, 69

**Priority:** high

**Description:** Criar o fluxo inicial de novo colaborador com ou sem usuario no mesmo formulario.

**Details:**

O cadastro rapido deve permitir nome, contato principal, cargo, perfil inicial de acesso e toggles operacionais basicos, com suporte a colaborador sem acesso por tempo indeterminado.

Subtasks:
- 70.1 Desenhar formulario inicial de criacao
- 70.2 Implementar toggle de criar acesso ao sistema
- 70.3 Integrar seleção de perfil inicial e unidade
- 70.4 Tratar usuario existente, convite e erros de vinculo
- 70.5 Fechar feedback de sucesso e continuidade

**Test Strategy:**

Cobrir envio com e sem acesso, validacoes de campos e tratamento de erros de vinculo de usuario/perfis.
