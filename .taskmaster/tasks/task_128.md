# Task ID: 128

**Title:** Backoffice: dashboard operacional global (métricas cross-tenant)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Expandir o dashboard /admin com métricas operacionais agregadas de todos os tenants: total de alunos ativos, matrículas ativas, vendas do mês, ticket médio global, novos alunos/mês e tendência de crescimento.

**Details:**

Atualizar src/app/(backoffice)/admin/page.tsx (ou criar /admin/operacional/page.tsx) com: (1) Cards KPI: total alunos ativos (soma de todos tenants), total matrículas ativas, vendas do mês (quantidade + valor), ticket médio global, novas matrículas no mês; (2) Evolução mensal: barras de novos alunos por mês (últimos 6 meses); (3) Distribuição por academia: tabela com academia, unidades, alunos, matrículas, vendas — ordenável por qualquer coluna. Criar endpoint getMetricasOperacionaisGlobal em src/lib/api/admin-metrics.ts. Adicionar tipo MetricasOperacionaisGlobal em types.ts.

**Test Strategy:**

Verificar que os totais batem com a soma individual de cada academia (spot-check manual). Verificar ordenação da tabela.

## Subtasks

### 128.1. Criar tipos e API client para métricas operacionais

**Status:** pending  
**Dependencies:** None  

Adicionar MetricasOperacionaisGlobal em types.ts e criar admin-metrics.ts

### 128.2. Criar dashboard com cards KPI e evolução mensal

**Status:** pending  
**Dependencies:** 128.1  

Cards de alunos, matrículas, vendas, ticket médio. Barras de tendência.

### 128.3. Adicionar tabela de distribuição por academia

**Status:** pending  
**Dependencies:** 128.2  

Ranking com academia, unidades, alunos, matrículas, vendas — ordenável
