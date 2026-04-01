# Task ID: 248

**Title:** Migrar 10 páginas administrativas simples para RSC

**Status:** done

**Dependencies:** 247 ✓

**Priority:** low

**Description:** Usar createTenantLoader() onde aplicável. Priorizar páginas read-only. Verificar bundle size antes/depois.

**Details:**

Selecionar 10 páginas da lista classificada (task 247). Migrar removendo "use client" e usando RSC patterns. Usar createTenantLoader para data fetching. Medir bundle com ANALYZE=true npm run build antes e depois.

**Test Strategy:**

Páginas migradas renderizam corretamente. Bundle size reduzido. Testes E2E passam.
