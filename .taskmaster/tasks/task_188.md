# Task ID: 188

**Title:** Decompor páginas entre 800-950 linhas (admin/unidades, vendas/nova, contas-a-pagar)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 3 páginas ainda excedem 800 linhas: admin/unidades (950), vendas/nova (837), contas-a-pagar (835). Aplicar padrão workspace+tabs da task 185.

**Details:**

Para cada página: 1) Extrair hook useXxxWorkspace com todo estado e handlers. 2) Extrair modais inline para componentes dedicados. 3) Extrair seções/tabs para componentes menores. Meta: cada page.tsx < 400 linhas. Começar por admin/unidades (maior). Seguir padrão já validado em clientes/[id] e rbac.

**Test Strategy:**

wc -l nas 3 pages < 400. Funcionalidades preservadas. TypeScript sem erros novos.
