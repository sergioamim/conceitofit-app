# Task ID: 327

**Title:** Estabilizar contrato de sessao E2E e fixture compartilhada

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Consolidar um helper unico de autenticacao Playwright alinhado ao contrato atual de sessao, eliminando redirecionamentos indevidos para login em testes autenticados.

**Details:**

Contexto: os layouts protegidos do app e do backoffice agora usam hasActiveSession() e o token-store considera a flag academia-auth-session-active, alem do estado em memoria. Muitas specs ainda gravam somente token/tenant diretamente no localStorage, o que derruba suites inteiras para /login ou /admin-login.

Escopo obrigatorio:
1. Auditar todos os helpers e seeds de sessao existentes em tests/e2e/support/backend-only-stubs.ts e nas specs que fazem page.addInitScript manual.
2. Definir um helper canônico de sessao autenticada E2E que persista todos os campos minimos hoje esperados pelo frontend: flag de sessao ativa, token type, tenant ativo/preferido, availableTenants, baseTenant quando aplicavel, displayName/userKind/userId quando a tela depender disso, availableScopes e broadAccess quando afetarem guardas.
3. Garantir compatibilidade com os dois shells protegidos: src/app/(app)/layout.tsx e src/app/(backoffice)/admin/layout.tsx.
4. Ajustar o helper para ser reutilizavel por specs operacionais, specs administrativas e fluxos publicos que autenticam no meio do teste.
5. Documentar no detalhe da task quais chaves de storage sao obrigatorias, quais sao opcionais e quais dependem do papel do usuario ou do modulo.

Fora de escopo: corrigir seletores de tela ou mocks de dominio especificos. Esta task deve apenas criar a base segura para que as demais deixem de falhar por autenticação/regressão de fixture.

**Test Strategy:**

Executar um smoke E2E minimo para /dashboard e /admin apos semear sessao via helper compartilhado, confirmando que ambos os layouts reconhecem a sessao e nao redirecionam para login.

## Subtasks

### 327.1. Auditar todas as sementes de sessao E2E existentes

**Status:** done  
**Dependencies:** None  

Localizar helpers e specs que escrevem chaves de sessao manualmente no localStorage.

**Details:**

Mapear page.addInitScript, helpers em tests/e2e/support e qualquer seed inline usada por suites autenticadas. Registrar quais chaves cada variante grava hoje e quais gaps existem em relacao ao contrato atual de hasActiveSession().

### 327.2. Definir o contrato canonico de sessao Playwright

**Status:** done  
**Dependencies:** 327.1  

Listar campos obrigatorios, opcionais e condicionais para sessao autenticada em E2E.

**Details:**

Documentar explicitamente flag academia-auth-session-active, token type, tenant ativo/preferido, availableTenants, baseTenantId, userId, userKind, displayName, availableScopes, broadAccess e qualquer outro campo exigido pelos shells atuais.

### 327.3. Implementar helper compartilhado aderente ao contrato atual

**Status:** done  
**Dependencies:** 327.2  

Concentrar a criacao da sessao autenticada E2E em um helper reutilizavel no support do Playwright.

**Details:**

Atualizar tests/e2e/support/backend-only-stubs.ts ou helper equivalente para aceitar overrides controlados e persistir todos os campos necessarios ao runtime atual sem depender de seeds duplicadas nas specs.

### 327.4. Validar o helper contra os shells do app e do backoffice

**Status:** done  
**Dependencies:** 327.3  

Confirmar que a nova fixture atende src/app/(app)/layout.tsx e src/app/(backoffice)/admin/layout.tsx.

**Details:**

Executar pelo menos um teste sentinela de cada shell e registrar no detalhe da task quais chaves permanecem obrigatorias por modulo para evitar regressao futura de fixture.
