# Task ID: 70

**Title:** Implementar cadastro rapido de colaborador com criacao opcional de acesso

**Status:** done

**Dependencies:** 68 ✓, 69 ✓

**Priority:** high

**Description:** Criar o fluxo inicial de novo colaborador com ou sem usuario no mesmo formulario.

**Details:**

O cadastro rapido deve permitir nome, contato principal, cargo, perfil inicial de acesso e toggles operacionais basicos, com suporte a colaborador sem acesso por tempo indeterminado.

**Test Strategy:**

Cobrir envio com e sem acesso, validacoes de campos e tratamento de erros de vinculo de usuario/perfis.

## Subtasks

### 70.1. Desenhar formulario inicial de criacao

**Status:** done  
**Dependencies:** None  

Definir os campos minimos e a organizacao do fluxo.

**Details:**

Fechar campos obrigatorios, opcionais e toggles do formulario rapido de colaborador, alinhando com o novo caso de uso do backend.

### 70.2. Implementar toggle de criar acesso ao sistema

**Status:** done  
**Dependencies:** 70.1  

Permitir separar colaborador operacional de identidade de acesso.

**Details:**

Adicionar comportamento condicional para criar colaborador sem acesso ou com onboarding de usuario, exibindo campos adicionais apenas quando necessario.

### 70.3. Integrar seleção de perfil inicial e unidade

**Status:** done  
**Dependencies:** 70.1, 70.2  

Conectar o fluxo de onboarding de acesso ao contexto da unidade ativa.

**Details:**

Consumir as opcoes de role/perfil aceitas pelo backend e refletir a unidade ativa no cadastro do membership inicial.

### 70.4. Tratar usuario existente, convite e erros de vinculo

**Status:** done  
**Dependencies:** 70.2, 70.3  

Exibir mensagens claras para conflitos de identidade.

**Details:**

Cobrir erros como email ja existente, usuario ja vinculado, role invalida ou falta de permissao para conceder acesso.

### 70.5. Fechar feedback de sucesso e continuidade

**Status:** done  
**Dependencies:** 70.4  

Guiar o operador apos salvar o colaborador.

**Details:**

Definir se o fluxo retorna para a listagem, abre o perfil completo ou mostra CTA para completar contratacao/horario, sem perder contexto.
