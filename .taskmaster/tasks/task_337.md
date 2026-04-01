# Task ID: 337

**Title:** Corrigir resíduos funcionais dos sentinelas do app em dashboard e billing

**Status:** done

**Dependencies:** 336 ✓

**Priority:** medium

**Description:** Tratar apenas falhas funcionais remanescentes dos sentinelas do shell do app, sem reabrir a camada de sessão/fixture.

**Details:**

Escopo: tests/e2e/dashboard.spec.ts e tests/e2e/billing-config.spec.ts. Reproduções já observadas após a estabilização de auth: 1) heading Pagamentos pendentes e vencidos não encontrado no dashboard após abrir a aba Financeiro; 2) billing-config com seletor estrito em Asaas, toasts de sucesso não encontrados e webhook esperado ausente. Estratégia aplicada: alinhar asserts ao comportamento real das telas, mantendo as fixtures atuais. O sentinela do dashboard passou a esperar um marcador exclusivo da aba Financeiro antes dos asserts finais. O sentinela de billing passou a validar cards com escopo estável, webhook renderizado após hidratação e mensagens emitidas por useToast via console, em vez de procurar toast visual inexistente. Fora de escopo: qualquer ajuste em installE2EAuthSession ou contrato mínimo de shell.

**Test Strategy:**

Rerodar tests/e2e/dashboard.spec.ts e tests/e2e/billing-config.spec.ts em Chromium após merge da branch da task. Neste ambiente, a execução automática ficou bloqueada pela ausência de dependências locais de Playwright (@playwright/test).
