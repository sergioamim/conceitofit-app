# Task ID: 324

**Title:** Smoke test E2E: Prospect → Cliente → Matrícula → Pagamento

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Teste Playwright que valida o pipeline comercial completo end-to-end.

**Details:**

Fluxo: (1) login como operador, (2) criar prospect via modal, (3) converter prospect em cliente, (4) criar matricula para o cliente com plano, (5) verificar pagamento gerado, (6) marcar pagamento como recebido. Se esse teste passa, o core do produto funciona. Usar fixtures para dados de teste. Rodar no CI com backend real (docker-compose).

**Test Strategy:**

Teste passa com backend ativo. Teste falha graciosamente se backend offline. Coverage do fluxo mais critico do produto.
