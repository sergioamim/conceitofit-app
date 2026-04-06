# Task ID: 473

**Title:** Adicionar métricas de performance client-side (Web Vitals + custom)

**Status:** pending

**Dependencies:** 471

**Priority:** medium

**Description:** Instrumentar métricas de performance: Core Web Vitals, tempo de API calls, erros por página, tenant mais afetado.

**Details:**

Implementar: (1) Capturar Web Vitals (LCP, FID, CLS) via next/web-vitals e enviar ao Sentry, (2) Métrica custom de tempo de resposta por endpoint (usando interceptor http.ts), (3) Métrica de erros por página (Sentry context), (4) Métrica de tenants mais afetados (tag no Sentry), (5) Dashboard interno no Sentry com essas métricas. Respeitar hydration safety: web-vitals só após mount.

**Test Strategy:**

Teste unitário do collector de métricas. Verificar no Sentry que métricas aparecem corretamente. Lighthouse CI valida Web Vitals.
