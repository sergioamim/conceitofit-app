# Task ID: 477

**Title:** Frontend: Página de configuração de billing por academia

**Status:** pending

**Dependencies:** 476

**Priority:** high

**Description:** Criar página administrativo/billing-config para configurar gateway, API keys, planos recorrentes e regras de cobrança.

**Details:**

Implementar página com: (1) Seleção de gateway (Pagar.me, Stripe, outro), (2) Campos de API key (com mask), (3) Configuração de ciclo de cobrança (mensal, trimestral, anual), (4) Regras de retry para pagamento falho (3 tentativas em 7 dias), (5) Configuração de multa por atraso (%), (6) Toggle de billing automatizado on/off. Formulário com react-hook-form + zod. Salvar configuração via API. Exibir status atual do gateway (conectado/desconectado).

**Test Strategy:**

Testes unitários do formulário com validação. Teste E2E: configurar billing → salvar → carrega configuração correta → toggle on/off.
