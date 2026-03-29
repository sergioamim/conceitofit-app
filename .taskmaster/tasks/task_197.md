# Task ID: 197

**Title:** Criar página admin de gestão de leads B2B

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** O backend tem 5 endpoints de leads admin (GET /admin/leads, GET stats, GET {id}, PATCH notas, PATCH status) mas o frontend não tem UI para gerenciar leads capturados.

**Details:**

Criar src/lib/api/admin-leads.ts com clients para os 5 endpoints. Criar src/app/(backoffice)/admin/leads/page.tsx com: tabela paginada de leads, filtro por status, detalhe com notas, ações (mudar status, adicionar nota). Conectar com o formulário de captura B2B (/b2b lead-form) para ciclo completo: lead entra → admin visualiza → qualifica → converte.

**Test Strategy:**

Página /admin/leads lista leads. Filtro funciona. Detalhes e notas editáveis.
