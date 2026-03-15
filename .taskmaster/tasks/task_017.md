# Task ID: 17

**Title:** Operar usuarios, unidades e perfis pelo backoffice global

**Status:** done

**Dependencies:** 16

**Priority:** high

**Description:** Permitir associar usuario a unidade, remover acesso, trocar unidade padrao e gerir perfis administrativos por unidade no path `/admin`.

**Details:**

Este epico fecha a parte operacional da nova area administrativa de seguranca. A abordagem deve criar telas novas no backoffice global, mas reaproveitar os widgets e comportamentos das telas contextuais de RBAC/acesso-unidade sempre que isso reduzir duplicacao sem carregar o modelo antigo por tenant.

**Test Strategy:**

Executar `npm run lint` e testes da area administrativa cobrindo mutacoes, mensagens de feedback e atualizacao de estado apos sucesso/erro.

## Subtasks

### 17.1. Fechar UX de associacao, remocao e unidade padrao

**Status:** done  
**Dependencies:** None  

Definir o comportamento visual e de formulario para as mutacoes de acesso no backoffice.

**Details:**

Desenhar o fluxo de associar usuario a unidade, remover acesso, reativar membership e definir unidade padrao na pagina de detalhe, respeitando o modelo multiunidade do backend.

### 17.2. Extrair componentes reutilizaveis das telas contextuais de seguranca

**Status:** done  
**Dependencies:** 17.1  

Evitar duplicacao desnecessaria entre seguranca contextual e seguranca global.

**Details:**

Isolar partes reaproveitaveis como `SuggestionInput`, picks de perfil, badges de status e tabelas auxiliares de usuario/perfil para uso dentro do backoffice global.

### 17.3. Implementar gestao de memberships por unidade no detalhe do usuario

**Status:** done  
**Dependencies:** 17.1, 17.2  

Permitir operar associacao e remocao de acesso por unidade a partir da tela administrativa global.

**Details:**

Adicionar acoes para vincular usuario a unidade existente, remover ou reativar membership e alterar a unidade padrao, com refresh consistente do detalhe do usuario apos cada mutacao.

### 17.4. Implementar atribuicao e remocao de perfis administrativos por tenant

**Status:** done  
**Dependencies:** 17.2, 17.3  

Levar a gestao de perfis para a mesma tela global de seguranca.

**Details:**

Adicionar controles por unidade para atribuir e remover perfis administrativos, aproveitando a experiencia existente de RBAC onde fizer sentido, mas consumindo os novos endpoints administrativos.

### 17.5. Cobrir feedback, refresh e cenarios de erro da operacao administrativa

**Status:** done  
**Dependencies:** 17.3, 17.4  

Garantir que o fluxo operacional fique confiavel para uso por superusuarios.

**Details:**

Padronizar toasts, estados de salvamento, erros por campo e recarregamento do detalhe/listagem apos as mutacoes, sem regressao nas telas contextuais existentes.
