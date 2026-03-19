# Task ID: 53

**Title:** Implementar Exceções, política de novas unidades, revisões e rollout da nova segurança

**Status:** done

**Dependencies:** 51, 52

**Priority:** high

**Description:** Fechar a governança avançada da nova área com exceções controladas, revisões periódicas e migração segura.

**Details:**

A fase final do frontend precisa materializar a governança avançada prevista no PRD: fluxo de exceção com justificativa e prazo, política separada para novas unidades, abas de revisão e auditoria, indicadores de acesso amplo e documentação de rollout. Esta task conclui a transição da segurança atual para a nova experiência.

**Test Strategy:**

Executar smoke e E2E do fluxo de exceções, política de novas unidades, revisões e navegação final da área de segurança.

## Subtasks

### 53.1. Implementar a UX de exceções com justificativa, prazo e destaque no acesso efetivo

**Status:** done  
**Dependencies:** None

Dar um fluxo próprio e controlado para exceções de segurança.

**Details:**

Construir o fluxo de adicionar, listar e remover exceções com justificativa, expiração e avisos visuais, sempre separado do perfil base e do fluxo de concessão principal.

### 53.2. Criar a superfície de política de novas unidades como governança separada

**Status:** done  
**Dependencies:** 53.1

Tirar a política ampla do detalhe operacional comum do usuário.

**Details:**

Implementar a leitura e edição da política de novas unidades com linguagem clara sobre origem, escopo, perfil herdado e justificativa, sem competir com as ações cotidianas de acesso local.

### 53.3. Construir a tela de Revisões e auditoria com filas e alertas

**Status:** done  
**Dependencies:** 53.1

Permitir recertificação e monitoramento contínuo dos acessos sensíveis.

**Details:**

Criar as abas de revisões pendentes, exceções vencendo, mudanças recentes, acessos amplos e perfis sem dono claro, priorizando severidade e acionabilidade.

### 53.4. Finalizar flags de risco, acessos amplos e estado de rollout da nova segurança

**Status:** done  
**Dependencies:** 53.2, 53.3

Concluir a leitura operacional da área com indicadores claros de risco e transição.

**Details:**

Adicionar indicadores de acesso amplo, risco, revisão vencida e compatibilidade transitória, além de finalizar feature flags e handoff entre área antiga e nova.

### 53.5. Fechar documentação e E2E do rollout completo da segurança

**Status:** done  
**Dependencies:** 53.4

Encerrar a trilha do frontend com evidência e documentação operacional.

**Details:**

Atualizar documentação interna, registrar critérios de aceite, riscos residuais e executar E2E dos caminhos críticos da nova área de segurança.
