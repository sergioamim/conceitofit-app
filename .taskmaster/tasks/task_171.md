# Task ID: 171

**Title:** Implementar logger estruturado para producao

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 9 instancias de console.warn/error espalhadas. Produção precisa de logger com niveis e contexto.

**Details:**

Criar src/lib/shared/logger.ts com logger.warn(), logger.error(), logger.info() encapsulando console.* com metadata (timestamp, modulo). Substituir os 9 console.* existentes em: tenant/hooks, importacao-evo-p0, error-state.tsx, commercial-flow. Preparar para integracao com Sentry/Datadog.

**Test Strategy:**

Nenhum console.warn ou console.error direto no codigo (exceto no logger). Logger funciona em dev e build.
