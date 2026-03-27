# Task ID: 127

**Title:** Backoffice: dashboard financeiro B2B (MRR, churn, inadimplência)

**Status:** done

**Dependencies:** 126 ✓

**Priority:** high

**Description:** Criar página /admin/financeiro com dashboard de métricas financeiras da plataforma: MRR (receita recorrente mensal), churn de academias, inadimplência, aging de boletos, previsão de receita e comparativo mensal.

**Details:**

Criar src/app/(backoffice)/admin/financeiro/page.tsx como hub financeiro com: (1) Cards KPI: MRR atual, MRR projetado, total academias ativas, total inadimplentes, churn rate mensal; (2) Gráfico de evolução MRR (últimos 12 meses — pode ser barras simples com divs estilizadas como na DRE); (3) Tabela de aging: cobranças por faixa de atraso (0-15d, 16-30d, 31-60d, 60+d) com valor e quantidade; (4) Lista de academias inadimplentes com ação rápida de contato/suspensão; (5) Comparativo MRR por plano. Criar endpoint getDashboardFinanceiroAdmin em admin-billing.ts que retorne as métricas agregadas. Adicionar tipo DashboardFinanceiroAdmin em types.ts.

**Test Strategy:**

Verificar que cards mostram valores em BRL. Conferir que o aging agrupa corretamente por faixa. Testar filtro por período.

## Subtasks

### 127.1. Criar tipos e endpoint do dashboard financeiro

**Status:** done  
**Dependencies:** None  

Adicionar DashboardFinanceiroAdmin em types.ts e getDashboardFinanceiroAdmin em admin-billing.ts

### 127.2. Criar página do dashboard com cards KPI e gráfico MRR

**Status:** done  
**Dependencies:** 127.1  

Cards: MRR, academias ativas, inadimplentes, churn rate. Barras de evolução MRR.

### 127.3. Adicionar tabela de aging e lista de inadimplentes

**Status:** done  
**Dependencies:** 127.2  

Aging por faixa de atraso, lista de academias com ação rápida, comparativo por plano
