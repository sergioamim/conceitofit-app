# Task ID: 175

**Title:** Remover tokens admin expostos como NEXT_PUBLIC no client

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Variáveis NEXT_PUBLIC_CATRACA_ADMIN_TOKEN, NEXT_PUBLIC_INTEGRATION_ADMIN_TOKEN e NEXT_PUBLIC_ADMIN_TOKEN são incluídas no bundle JS do browser, permitindo extração por qualquer usuário.

**Details:**

Arquivos afetados: src/app/(app)/administrativo/unidades/page.tsx. Mover validações que usam esses tokens para Server Components ou Server Actions. Substituir por chamadas server-side que verificam permissões no backend. Remover as variáveis NEXT_PUBLIC_* do .env e substituir por variáveis server-only (sem prefixo NEXT_PUBLIC). Auditar todo o codebase com grep 'NEXT_PUBLIC.*TOKEN' para garantir que nenhum token sensível está exposto.

**Test Strategy:**

grep -r 'NEXT_PUBLIC.*TOKEN' src/ retorna zero resultados. Build OK. Funcionalidade de catraca e integrações continua operando via server-side.
