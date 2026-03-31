# Task ID: 202

**Title:** Criar módulo financeiro contábil (ledgers, contas, transações)

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** O backend tem 38 endpoints em /api/v1/financial/* (accounts, ledgers, ledger-entries, transactions, reports, monitoring) sem nenhuma UI.

**Details:**

Módulo completo de contabilidade: contas contábeis, livros razão, lançamentos, transações com reversão, relatórios (balanço, fluxo de caixa, DRE, ROI, extrato), exportação Excel/PDF, e monitoramento (transações suspeitas, padrões incomuns, alta frequência). Criar: src/lib/api/financial.ts, páginas em /gerencial/contabilidade/*. NOTA: Este é um módulo grande — avaliar se será implementado agora ou em fase futura.

**Test Strategy:**

CRUD de contas e transações funciona. Relatórios renderizam. Exportação gera arquivo.
