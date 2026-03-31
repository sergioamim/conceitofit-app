# Task ID: 200

**Title:** Criar dashboard de métricas SaaS e onboarding

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** O backend tem endpoints de métricas SaaS (GET /admin/metrics/saas, /saas/series, /saas/onboarding) e onboarding (GET /admin/unidades/onboarding) sem UI.

**Details:**

Criar src/lib/api/admin-saas-metrics.ts com clients para: GET /admin/metrics/saas, /saas/series, /saas/onboarding, GET /admin/unidades/onboarding, GET /admin/unidades/{id}/onboarding. Criar página ou seção no dashboard admin com: métricas SaaS (MRR, churn, LTV), pipeline de onboarding de unidades, status de ativação por unidade.

**Test Strategy:**

Métricas SaaS renderizam. Onboarding lista unidades em processo.
