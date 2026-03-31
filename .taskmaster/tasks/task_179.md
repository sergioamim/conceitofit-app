# Task ID: 179

**Title:** Quebrar importacao-evo-p0/page.tsx (4096 linhas) em módulos

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Maior arquivo do projeto com 4096 linhas e 45 useState. Mistura upload, parsing, polling, validação, tabs, forms e localStorage.

**Details:**

Extrair em: 1) hooks/useEvoImportJob.ts (estado de jobs, polling, retry), 2) hooks/useEvoFileUpload.ts (upload, parsing, validação de CSV/ZIP), 3) components/EvoUploadTab.tsx (tab de nova importação), 4) components/EvoPacoteTab.tsx (tab de pacote), 5) components/EvoAcompanhamentoTab.tsx (tab de acompanhamento), 6) services/evo-file-parser.ts (lógica de parsing pura). Page.tsx final deve ter <200 linhas.

**Test Strategy:**

Navegar para /admin/importacao-evo-p0, todas as tabs funcionam. Upload de arquivo funciona. Polling de jobs funciona. Page.tsx < 200 linhas.
