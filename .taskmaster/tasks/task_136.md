# Task ID: 136

**Title:** Backoffice: compliance LGPD e dashboard de dados pessoais

**Status:** pending

**Dependencies:** None

**Priority:** low

**Description:** Criar página /admin/compliance com visão de compliance LGPD: volume de dados pessoais por academia, solicitações de exclusão pendentes, termos aceitos e relatório de exposição.

**Details:**

Criar src/app/(backoffice)/admin/compliance/page.tsx com: (1) Cards KPI: total dados pessoais armazenados (estimativa por academia), solicitações de exclusão pendentes, termos aceitos vs pendentes; (2) Tabela por academia: quantidade de alunos com CPF, email, telefone armazenados, última solicitação de exclusão, status de termos; (3) Lista de solicitações de exclusão pendentes com ação de executar/rejeitar; (4) Relatório de exposição: quais campos sensíveis cada academia coleta. Criar endpoint getComplianceDashboard em src/lib/api/admin-compliance.ts.

**Test Strategy:**

Verificar que dados pessoais são contados corretamente por academia. Processar uma solicitação de exclusão.

## Subtasks

### 136.1. Criar tipos e endpoint de compliance

**Status:** pending  
**Dependencies:** None  

ComplianceDashboard, SolicitacaoExclusao em types.ts. Endpoint em admin-compliance.ts

### 136.2. Criar dashboard de compliance com KPIs e tabela

**Status:** pending  
**Dependencies:** 136.1  

Cards de dados pessoais, solicitações pendentes, termos. Tabela por academia.

### 136.3. Criar lista de solicitações de exclusão com ações

**Status:** pending  
**Dependencies:** 136.2  

Listagem com filtros e botões executar/rejeitar com confirmação
