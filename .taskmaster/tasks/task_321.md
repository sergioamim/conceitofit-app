# Task ID: 321

**Title:** Validação de env vars com Zod schema no startup

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Criar schema Zod que valida variaveis de ambiente obrigatorias no build/startup do Next.js.

**Details:**

Criar src/lib/env.ts com z.object({BACKEND_PROXY_TARGET: z.string().url(), NEXT_PUBLIC_SENTRY_DSN: z.string().optional(), ...}). Importar no layout.tsx raiz (server-side) para validar no startup. Se falhar, log claro com variaveis faltantes. Nao usar t3-env (overhead desnecessario), Zod puro basta.

**Test Strategy:**

Build falha com mensagem clara se BACKEND_PROXY_TARGET nao definido. Build passa com todas vars definidas.
