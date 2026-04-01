# Task ID: 250

**Title:** Consolidar formatters duplicados em lib/shared/formatters.ts

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 12 arquivos duplicam formatBRL, formatDate, formatDateTime localmente em vez de importar de lib/shared/formatters.ts.

**Details:**

Auditar todos os arquivos com formatBRL/formatDate/formatDateTime/formatPhone duplicados. Remover implementações locais e importar do barrel centralizado. Garantir que as assinaturas são compatíveis. Adicionar lint rule (eslint-plugin-boundaries ou import/no-restricted-paths) para prevenir novas duplicações. Arquivos conhecidos: use-contas-pagar-workspace.ts, use-contas-contabeis-workspace.ts, wizard-types.tsx, prospect-shared.ts, bi/page.tsx, bi/rede/page.tsx, contabilidade/*/page.tsx.

**Test Strategy:**

Grep por function formatBRL e function formatDate fora de lib/shared/formatters.ts retorna zero resultados. Todas as páginas renderizam valores monetários e datas corretamente.
