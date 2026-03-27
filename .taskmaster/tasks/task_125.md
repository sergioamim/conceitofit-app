# Task ID: 125

**Title:** Backoffice: contratos de academia vinculados a planos

**Status:** pending

**Dependencies:** 124

**Priority:** high

**Description:** Criar página /admin/financeiro/contratos para vincular cada academia a um plano da plataforma, com data início/fim, ciclo de cobrança, valor negociado (override), status (ativo/suspenso/cancelado/trial) e histórico de mudanças de plano.

**Details:**

Criar src/app/(backoffice)/admin/financeiro/contratos/page.tsx com listagem de contratos por academia (filtros por status, academia, plano). Modal de novo contrato: selecionar academia + plano + data início + ciclo + valor override opcional. Adicionar tipos ContratoPlataforma em types.ts (id, academiaId, planoId, planoNome, academiaNome, dataInicio, dataFim, ciclo, valorMensal, status, motivoSuspensao, historicoPlanosIds). Criar endpoints em admin-billing.ts: listAdminContratos, createAdminContrato, updateAdminContrato, suspenderAdminContrato, reativarAdminContrato. Exibir badge de status e alerta visual para contratos vencidos ou suspensos.

**Test Strategy:**

Criar contrato para uma academia, suspender e reativar. Verificar filtros por status e por academia. Confirmar badges de status.

## Subtasks

### 125.1. Criar tipos e API client para contratos

**Status:** pending  
**Dependencies:** None  

Adicionar ContratoPlataforma em types.ts e endpoints de CRUD em admin-billing.ts

### 125.2. Criar página de listagem de contratos com filtros

**Status:** pending  
**Dependencies:** 125.1  

Criar /admin/financeiro/contratos com tabela, filtros por status/academia/plano e badges

### 125.3. Criar modal de novo contrato e ações de suspensão/reativação

**Status:** pending  
**Dependencies:** 125.2  

Modal com seletor de academia + plano + configuração de ciclo/valor. Botões de suspender/reativar com confirmação.
