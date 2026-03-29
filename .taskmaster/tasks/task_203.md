# Task ID: 203

**Title:** Fix: Corrigir hydration mismatch e Suspense sem fallback no dashboard

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** O dashboard usa new Date() em Server Component (linhas 9-11), causando hydration mismatch. Também há um Suspense sem fallback (linha 40-43). Ambos causam bugs em runtime.

**Details:**

Arquivo: src/app/(app)/dashboard/page.tsx. Problema 1: todayIso() usa new Date() que gera valores diferentes no server e client. Substituir por getBusinessTodayIso() de src/lib/shared/business-date.ts. Problema 2: <Suspense> na linha 40-43 envolve DemoBanner sem fallback prop. Adicionar fallback={null} ou um skeleton adequado.

**Test Strategy:**

Build sem warnings de hydration. Dashboard renderiza corretamente. Suspense mostra fallback durante loading.
