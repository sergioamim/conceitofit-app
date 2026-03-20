# Task ID: 61

**Title:** Fechar contratos, rollout e E2E do novo modelo Rede-Unidade no frontend

**Status:** pending

**Dependencies:** 56, 57, 58, 59, 60

**Priority:** high

**Description:** Concluir a trilha com tipagens estáveis, documentação, feature flags e cobertura final de ponta a ponta.

**Details:**

Depois do ajuste de login, bootstrap, gestão administrativa, UX multiunidade e migração de cliente, o frontend precisa consolidar contratos, documentação e rollout. Esta task fecha os detalhes transversais do novo modelo contextual por rede e unidade.

**Test Strategy:**

Executar smoke e E2E cobrindo acesso por rede, bootstrap multiunidade, gestão administrativa e migração de cliente.

## Subtasks

### 61.1. Atualizar tipagens e clients compartilhados para o modelo final de rede e sessão

**Status:** pending  
**Dependencies:** None

Eliminar inconsistências entre telas e integrações.

**Details:**

Consolidar tipos de autenticação, usuário, bootstrap, tenant ativo, elegibilidade multiunidade e migração de cliente em contratos frontend únicos.

### 61.2. Aplicar feature flags e fallback transitório para a migração gradual

**Status:** pending  
**Dependencies:** 61.1

Permitir rollout controlado do novo modelo sem quebra imediata.

**Details:**

Preparar flags, roteamento progressivo e compatibilidades temporárias para a convivência entre o login antigo e o novo fluxo contextual por rede.

### 61.3. Documentar o comportamento do frontend no novo modelo contextual

**Status:** pending  
**Dependencies:** 61.1, 61.2

Dar handoff claro para produto, QA e suporte.

**Details:**

Registrar nos docs do frontend como funcionam login por rede, bootstrap, unidade-base, tenant ativo, multiunidade e migração administrativa de cliente.

### 61.4. Cobrir ponta a ponta a jornada de acesso, sessão e operação administrativa

**Status:** pending  
**Dependencies:** 61.1, 61.2

Concluir a trilha com evidência automatizada de alto valor.

**Details:**

Executar cenários E2E de login por rede, reset, bootstrap, troca de tenant ativo, operação multiunidade e `migrarClienteParaUnidade`.

### 61.5. Alinhar textos, empty states e ajuda contextual ao vocabulário final

**Status:** pending  
**Dependencies:** 61.3

Encerrar a migração de linguagem para o modelo rede-unidade.

**Details:**

Revisar labels, mensagens e estados vazios para refletir rede, unidade-base, unidade ativa, elegibilidade e migração de cliente com terminologia consistente.

### 61.6. Registrar backlog residual e critérios de aceite do rollout

**Status:** pending  
**Dependencies:** 61.4, 61.5

Fechar o lote com rastreabilidade clara e limites conhecidos.

**Details:**

Atualizar trackers e documentação com riscos residuais, dependências de backend, critérios de aceite e próximos passos do rollout do novo modelo.
