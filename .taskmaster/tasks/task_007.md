# Task ID: 7

**Title:** Expandir modulos administrativos, financeiros e de integracao

**Status:** pending

**Dependencies:** 1

**Priority:** medium

**Description:** Cobrir configuracoes e operacao de NFSe, agregadores, recebimentos, dashboards e areas administrativas ausentes.

**Details:**

Inclui telas de configuracao, monitoramento, recebimentos e integracoes operacionais.

**Test Strategy:**

No test strategy provided.

## Subtasks

### 7.1. Inventariar lacunas administrativas e financeiras existentes

**Status:** pending  
**Dependencies:** None  

Mapear páginas faltantes e inconsistências nas áreas administrativas e financeiras.

**Details:**

Revisar rotas em `src/app/(app)/administrativo/*` e `src/app/(app)/gerencial/*`, listar telas ausentes de NFSe, agregadores, recebimentos e dashboards, e priorizar por impacto operacional.

### 7.2. Implementar telas de configuração de NFSe e integrações fiscais

**Status:** pending  
**Dependencies:** 7.1  

Criar interfaces para configurar emissor, prefeitura e parâmetros fiscais.

**Details:**

Definir fluxo de cadastro/edição de dados fiscais, campos obrigatórios, estados de configuração e feedback de validação para NFSe e integrações fiscais.

### 7.3. Criar telas operacionais de agregadores e recebimentos

**Status:** pending  
**Dependencies:** 7.1  

Adicionar páginas para operação de agregadores e controle de recebimentos.

**Details:**

Modelar listagens, filtros e detalhes de transações, status de repasse e conciliação, com navegação consistente com o módulo gerencial.

### 7.4. Integrar status e monitoramento de integrações

**Status:** pending  
**Dependencies:** 7.2, 7.3  

Exibir indicadores de saúde e alertas para integrações operacionais.

**Details:**

Adicionar painéis de monitoramento com status por integração, histórico de falhas, e links para ações corretivas ou reprocessamento.

### 7.5. Fechar permissões, perfis e testes básicos

**Status:** pending  
**Dependencies:** 7.2, 7.3, 7.4  

Garantir controle de acesso e validações para novos módulos.

**Details:**

Definir permissões por perfil para novas rotas, ajustar guardas de acesso e criar testes básicos de renderização e navegação onde houver infraestrutura.
