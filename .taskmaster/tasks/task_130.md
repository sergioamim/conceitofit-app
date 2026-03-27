# Task ID: 130

**Title:** Backoffice: alertas operacionais e uso de features

**Status:** done

**Dependencies:** 128 ✓

**Priority:** medium

**Description:** Criar seção de alertas automáticos e painel de uso de features por academia em /admin/operacional/alertas.

**Details:**

Criar src/app/(backoffice)/admin/operacional/alertas/page.tsx com: (1) Lista de alertas gerados automaticamente: academia sem login admin há 7+ dias, unidade com 0 matrículas ativas, pico de cancelamentos (>20% no mês), contrato vencendo em 30 dias, inadimplência acima do threshold; (2) Cada alerta com badge de severidade (info/warning/critical), data, academia, ação sugerida; (3) Painel de uso de features: tabela com academia vs features (treinos, CRM, catraca, vendas online, BI) mostrando quais estão ativas e sendo usadas — insight para upsell e onboarding. Criar endpoint getAlertasOperacionais e getFeatureUsageByAcademia em admin-metrics.ts.

**Test Strategy:**

Verificar que alertas são exibidos com severidade correta. Confirmar tabela de features mostra dados por academia.

## Subtasks

### 130.1. Criar tipos e endpoints para alertas e usage

**Status:** done  
**Dependencies:** None  

Tipos AlertaOperacional e FeatureUsage. Endpoints em admin-metrics.ts

### 130.2. Criar página de alertas com lista e severidades

**Status:** done  
**Dependencies:** 130.1  

Lista de alertas com badges, data, academia e ação sugerida

### 130.3. Criar painel de uso de features por academia

**Status:** done  
**Dependencies:** 130.1  

Tabela academia x features com indicadores de ativação e uso real
