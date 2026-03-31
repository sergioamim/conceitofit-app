# Task ID: 198

**Title:** Criar página admin de BI executivo por academia

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** O backend tem 4 endpoints de BI (resumo, comparativo, série, resumo geral) que não estão conectados no frontend.

**Details:**

Criar src/lib/api/admin-bi.ts com clients para: GET /admin/bi/academias/{id}/executivo/resumo, /comparativo, /serie, e /admin/bi/academias/{id}/resumo. Criar src/app/(backoffice)/admin/bi/page.tsx ou expandir dashboard admin existente com seção BI. Exibir: KPIs por academia, comparativo entre períodos, gráfico de série temporal. Usar componentes BiMetricCard e BiTrendBars já existentes.

**Test Strategy:**

Dashboard BI renderiza com dados reais. Seleção de academia filtra. Gráficos exibem série temporal.
