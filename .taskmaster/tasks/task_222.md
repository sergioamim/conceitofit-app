# Task ID: 222

**Title:** Testes unitários para feature-flags.ts

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** feature-flags.ts não tem testes. Flags controlam comportamento crítico do sistema. Adicionar cobertura.

**Details:**

Criar tests/unit/feature-flags.test.ts. Testar cada flag com env vars mockadas (true, false, undefined). Testar defaults quando env var não existe. Usar vi.stubEnv() para mockar variáveis de ambiente.

**Test Strategy:**

Todas as flags testadas com true/false/undefined. Testes passam no CI.
