# Task ID: 56

**Title:** Implementar login contextual por Rede e fluxos de acesso iniciais

**Status:** done

**Dependencies:** 53

**Priority:** high

**Description:** Adaptar o frontend para autenticação orientada por rede, com rota contextual, identificador neutro e recuperação isolada.

**Details:**

O frontend precisa sair do modelo implícito de login global e assumir o contexto de rede como primeira informação da jornada. Esta task cobre as rotas e superfícies de `/acesso/{redeSlug}`, o formulário por identificador neutro, recuperação de senha, primeiro acesso e mensagens específicas da rede corrente.

**Test Strategy:**

Validar rotas, formulários e estados de autenticação com smoke e testes E2E do fluxo de acesso por rede.

## Subtasks

### 56.1. Criar a casca de rotas contextuais `/acesso/{redeSlug}`

**Status:** done  
**Dependencies:** None

Fazer o frontend resolver a rede pela própria URL da jornada de login.

**Details:**

Estruturar as páginas de autenticação para operar com `redeSlug` explícito, permitindo a experiência no estilo EVO sem depender de seleção de tenant no primeiro passo.

### 56.2. Trocar o formulário de login para `identifier` neutro em vez de email fixo

**Status:** done  
**Dependencies:** 56.1

Permitir email ou CPF no mesmo campo de autenticação.

**Details:**

Atualizar labels, máscara opcional, validação e mensagens do formulário para trabalhar com um identificador neutro contextualizado pela rede.

### 56.3. Implementar recuperação de senha e primeiro acesso no contexto da rede

**Status:** done  
**Dependencies:** 56.1, 56.2

Manter todos os fluxos de credencial isolados por rede.

**Details:**

Criar as telas e chamadas de recuperar senha e primeiro acesso sem perder o `redeSlug`, com mensagens coerentes para usuários homônimos em redes distintas.

### 56.4. Aplicar branding e contexto da rede nas superfícies de acesso

**Status:** done  
**Dependencies:** 56.1

Deixar clara para o usuário a rede na qual ele está autenticando.

**Details:**

Exibir nome, identidade visual, instruções e variações da rede corrente nas telas de acesso, reforçando a separação entre redes diferentes.

### 56.5. Adaptar clientes HTTP, tipagens e guards ao novo contrato de autenticação por rede

**Status:** done  
**Dependencies:** 56.2, 56.3

Preparar a camada de integração para o payload novo do backend.

**Details:**

Atualizar SDKs, DTOs, hooks e interceptors para consumir o contrato com `identifier`, bootstrap de rede e erros específicos do novo fluxo.

### 56.6. Cobrir a jornada de acesso por rede com smoke e E2E

**Status:** done  
**Dependencies:** 56.3, 56.4, 56.5

Garantir que login, reset e primeiro acesso não regressem.

**Details:**

Criar ou adaptar cenários automatizados para a rota contextual de acesso, incluindo mensagens de erro, recuperação de senha e redes distintas.
