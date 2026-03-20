# Task ID: 58

**Title:** Redesenhar a gestão administrativa de usuários, identidades e escopos por Rede

**Status:** done

**Dependencies:** 53, 57

**Priority:** high

**Description:** Levar a área de segurança para o novo modelo de identidade por rede, escopos e vínculos operacionais.

**Details:**

Com o novo desenho de auth, a área administrativa precisa mostrar usuário por rede, identificadores de login, escopo efetivo, unidade-base, unidade ativa e vínculos relevantes de forma inteligível para gestores. Esta task fecha a UX das leituras administrativas do modelo rede-unidade.

**Test Strategy:**

Cobrir navegação, listagens, detalhe e filtros da área administrativa de usuários com testes de regressão funcional.

## Subtasks

### 58.1. Atualizar listagem de usuários para o contexto de Rede

**Status:** done  
**Dependencies:** None

Fazer a tela principal operar por rede e não por visão global implícita.

**Details:**

Revisar filtros, cabeçalhos, colunas e navegação para exibir claramente a rede corrente, os escopos do usuário e sua unidade-base.

### 58.2. Exibir identificadores de login e origem do acesso no detalhe do usuário

**Status:** done  
**Dependencies:** 58.1

Dar visibilidade para email, CPF e escopos sem expor jargão excessivo.

**Details:**

Adicionar blocos de detalhe mostrando identificadores de login, escopo efetivo, origem do acesso e diferenças entre acesso local, de rede e global.

### 58.3. Refletir unidade-base, unidade ativa e vínculos operacionais nas superfícies administrativas

**Status:** done  
**Dependencies:** 58.1, 58.2

Ajudar o gestor a entender onde o usuário atua de fato.

**Details:**

Mostrar quando o cadastro pertence a uma unidade-base, quais unidades adicionais o usuário/funcionário possui e quando a unidade ativa é apenas contexto temporário.

### 58.4. Ajustar filtros, pesquisa e estados vazios ao novo modelo rede-unidade

**Status:** done  
**Dependencies:** 58.1, 58.2

Evitar ambiguidade quando a mesma pessoa existir em redes diferentes.

**Details:**

Revisar busca por identificador, filtros por escopo e mensagens de empty state para que a operação fique sempre contextualizada pela rede corrente.

### 58.5. Preparar a UI para leituras gerenciais agregadas por Grupo sem confundir escopo operacional

**Status:** done  
**Dependencies:** 58.2, 58.4

Diferenciar visão gerencial de permissão operacional.

**Details:**

Adicionar espaços ou componentes próprios para agregações gerenciais por grupo, deixando explícito que isso é visão read-only e não escopo de login.

### 58.6. Cobrir a nova área administrativa de usuários com regressão funcional

**Status:** done  
**Dependencies:** 58.3, 58.4, 58.5

Validar filtros, detalhes e leitura dos novos conceitos.

**Details:**

Criar ou ajustar testes para listagem, detalhe, filtros e exibição correta de identificadores, rede, escopos e vínculos operacionais.
