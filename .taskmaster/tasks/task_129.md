# Task ID: 129

**Title:** Backoffice: ranking e mapa de saúde das academias

**Status:** pending

**Dependencies:** 128

**Priority:** medium

**Description:** Criar página /admin/operacional/saude para visão comparativa de todas as academias com indicadores de saúde operacional: semáforo (verde/amarelo/vermelho), métricas-chave por academia e alertas de risco.

**Details:**

Criar src/app/(backoffice)/admin/operacional/saude/page.tsx com: (1) Grid de cards por academia com semáforo (verde = saudável, amarelo = risco, vermelho = crítico) baseado em regras: verde = alunos ativos > 50 e inadimplência < 10%, amarelo = alunos entre 10-50 ou inadimplência entre 10-20%, vermelho = alunos < 10 ou inadimplência > 20% ou sem login há 30d; (2) Tabela detalhada: academia, unidades, alunos ativos, churn mensal, inadimplência %, último login de admin, status do contrato; (3) Filtros por status de saúde e por plano contratado. Criar endpoint getAcademiasHealthMap em admin-metrics.ts. Usar StatusBadge existente para semáforos.

**Test Strategy:**

Verificar que academias com poucos alunos aparecem em vermelho. Filtrar por status e confirmar contagem.

## Subtasks

### 129.1. Criar tipos e endpoint de saúde das academias

**Status:** pending  
**Dependencies:** None  

Tipo AcademiaHealthStatus com métricas e classificação. Endpoint em admin-metrics.ts

### 129.2. Criar página com grid de semáforos e tabela detalhada

**Status:** pending  
**Dependencies:** 129.1  

Cards por academia com badge de saúde, tabela com métricas e filtros
