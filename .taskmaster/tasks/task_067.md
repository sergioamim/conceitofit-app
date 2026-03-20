# Task ID: 67

**Title:** Adicionar criação de usuário no Segurança global e no Admin da própria rede

**Status:** done

**Dependencies:** 50, 53

**Priority:** high

**Description:** Permitir cadastrar novos usuários por duas superfícies, com poderes distintos entre backoffice global e administração da academia.

**Details:**

Criar a jornada de novo usuário no menu `/admin/seguranca` para operadores com poder global/rede e também na área administrativa da academia, mas com escopo limitado à própria rede. A superfície global poderá criar usuários com escopo amplo, memberships multi-tenant e governança avançada; já a superfície administrativa da academia deve restringir a criação à rede corrente, sem permitir alcance global ou em outras redes. A task inclui IA, regras de autorização, validações de escopo e alinhamento com a diretriz de `Usuario` independente de `Cliente`/`Funcionario`.

**Test Strategy:**

Cobrir criação de usuário nas duas superfícies, validação de escopo permitido e bloqueio de tentativas de criar acesso fora da rede corrente na área administrativa da academia.

## Subtasks

### 67.1. Definir contrato e permissões da criação de usuário por superfície

**Status:** done  
**Dependencies:** None

Separar claramente o que o backoffice global pode fazer e o que a academia pode fazer na própria rede.

**Details:**

Mapear capabilities, endpoints e regras para dois contextos: segurança global com criação ampla e admin da academia com criação restrita à rede corrente, sem escopo global nem outras redes.

### 67.2. Adicionar ação e formulário de novo usuário no menu Segurança

**Status:** done  
**Dependencies:** 67.1

Expor o cadastro pela área global de usuários e acessos.

**Details:**

Adicionar CTA, rota/modal e formulário para criar usuário no backoffice de segurança, permitindo definir identidade, identificadores de login e escopo inicial compatível com a governança global.

### 67.3. Adicionar criação restrita de usuário na área Admin da academia

**Status:** done  
**Dependencies:** 67.1

Permitir que a academia cadastre usuários apenas para a própria rede.

**Details:**

Criar entrada de cadastro na área administrativa operacional, limitando rede, tenants e memberships à academia corrente e bloqueando qualquer tentativa de criação para outra rede ou escopo global.

### 67.4. Aplicar guardrails de escopo e mensagens de autorização

**Status:** done  
**Dependencies:** 67.2, 67.3

Evitar que a UI ofereça poderes além do contexto do operador.

**Details:**

Reforçar no frontend os limites de escopo, escondendo opções globais na área da academia, validando payloads antes do submit e mostrando mensagens claras quando o operador não puder conceder determinado alcance.

### 67.5. Cobrir regressão e handoff de criação de usuário

**Status:** done  
**Dependencies:** 67.2, 67.3, 67.4

Garantir estabilidade nas duas jornadas e registrar os limites de poder.

**Details:**

Adicionar testes unitários/e2e e documentação curta explicando que segurança global pode criar acessos amplos, enquanto o admin da academia só cria usuários para a própria rede.
