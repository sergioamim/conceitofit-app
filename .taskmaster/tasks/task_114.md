# Task ID: 114

**Title:** Implementar exportação de relatórios (PDF/Excel) no gerencial

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** As páginas do módulo gerencial (DRE, contas a pagar/receber, recebimentos, formas de pagamento, BI) exibem dados apenas em tela. Adicionar botões de exportação para PDF e Excel/CSV nos relatórios financeiros, usando geração client-side para não depender de endpoint backend adicional.

**Details:**

Criar utilitário src/lib/export/table-export.ts com funções exportToCSV(data, columns, filename) e exportToPDF(data, columns, filename, title). Para CSV usar Blob + download link nativo. Para PDF usar biblioteca leve (ex: jspdf + jspdf-autotable, já que não há dependência de PDF no projeto). Adicionar componente ExportMenu em src/components/shared/export-menu.tsx com dropdown (CSV, PDF) que receba os dados da tabela. Integrar nas páginas: /gerencial/dre, /gerencial/contas-a-receber, /gerencial/contas-a-pagar, /gerencial/recebimentos, /gerencial/formas-pagamento, /vendas. Manter formatação BRL nos valores exportados.

**Test Strategy:**

Exportar CSV e PDF de cada página listada. Validar que os valores batem com o exibido em tela. Abrir CSV no Excel/Google Sheets e confirmar encoding UTF-8 e separador correto. Abrir PDF e confirmar layout legível.

## Subtasks

### 114.1. Criar utilitário de exportação CSV/PDF

**Status:** done  
**Dependencies:** None  

Adicionar utilitário client-side para exportar tabelas em CSV e PDF.

**Details:**

Criar `src/lib/export/table-export.ts` com tipos de coluna (label, accessor/formatter) e funções `exportToCSV` e `exportToPDF`. Para CSV, gerar conteúdo UTF-8 (com BOM opcional) e disparar download via Blob/URL; para PDF, adicionar `jspdf` + `jspdf-autotable` no `package.json` e montar tabela com título, cabeçalhos e dados formatados (incluindo valores em BRL via `formatBRL`).

### 114.2. Implementar componente compartilhado ExportMenu

**Status:** done  
**Dependencies:** 114.1  

Criar dropdown reutilizável para exportar os dados visíveis.

**Details:**

Adicionar `src/components/shared/export-menu.tsx` como componente client-side, usando `Button` + `Select` (ou UI equivalente existente) para opções CSV e PDF. Receber props `data`, `columns`, `filename`, `title`, `disabled` e acionar `exportToCSV/exportToPDF` do utilitário. Manter texto estável no SSR e evitar valores dinâmicos no render inicial.

### 114.3. Integrar ExportMenu nas páginas gerenciais

**Status:** done  
**Dependencies:** 114.2  

Adicionar botões de exportação nos relatórios financeiros e vendas.

**Details:**

Incluir `ExportMenu` nas páginas `src/app/(app)/gerencial/dre/page.tsx`, `src/app/(app)/gerencial/contas-a-receber/page.tsx`, `src/app/(app)/gerencial/contas-a-pagar/page.tsx`, `src/app/(app)/gerencial/recebimentos/page.tsx` e `src/app/(app)/vendas/page.tsx`. Para `formas-pagamento`, integrar no `src/app/(app)/administrativo/formas-pagamento/page.tsx` (já que `/gerencial/formas-pagamento` redireciona). Mapear colunas com rótulos iguais aos cabeçalhos das tabelas, exportar somente dados filtrados e excluir colunas de ação, mantendo formatação BRL e datas já exibidas na UI.
