# Task ID: 335

**Title:** Corrigir fluxo publico de conta demo e bootstrap pos-login demo

**Status:** done

**Dependencies:** 327 ✓, 329 ✓, 330 ✓

**Priority:** medium

**Description:** Fazer os testes de criacao de conta demo cobrirem o submit real, o salvamento da sessao e a entrada no dashboard demo sem regressao.

**Details:**

Esta task depende de 327, 329 e 330, porque o dashboard demo reutiliza o shell autenticado do app.

Escopo obrigatorio:
1. Revisar tests/e2e/demo-account.spec.ts e src/app/(public)/b2b/demo/demo-form.tsx.
2. Confirmar se o route pattern mockado (**/api/v1/publico/demo) casa com a chamada real de createDemoAccount.
3. Verificar se a resposta mockada entrega todas as propriedades que saveAuthSession e o shell do dashboard agora precisam.
4. Garantir que o redirect para /dashboard?demo=1 encontre bootstrap/contexto suficientes para o banner e para o shell inicial.
5. Corrigir tambem os cenarios de validacao que hoje podem estar falhando por markup/labels divergentes do formulario atual.

Criterio de aceite: os cenarios de submit valido, banner visivel e dismiss persistente devem passar sem depender de backend real.

**Test Strategy:**

Reexecutar demo-account.spec.ts e validar submit, redirect para /dashboard?demo=1, banner visível e persistencia do dismiss sem depender de backend real.

## Subtasks

### 335.1. Validar endpoint e payload do fluxo demo

**Status:** done  
**Dependencies:** None  

Confirmar que o mock da API demo casa com a chamada real de createDemoAccount.

**Details:**

Revisar route pattern, payload enviado, shape da resposta e nomes de campos consumidos por saveAuthSession no fluxo de conta demo.

### 335.2. Corrigir sessao e bootstrap pos-login demo

**Status:** done  
**Dependencies:** 335.1  

Garantir que o dashboard receba sessao valida e bootstrap suficiente apos o submit.

**Details:**

Ajustar o que for necessario para que saveAuthSession e o shell autenticado do app reconhecam o usuario demo e permitam o redirect para /dashboard?demo=1.

### 335.3. Revisar validacoes e asserts do formulario demo

**Status:** done  
**Dependencies:** 335.1  

Alinhar labels, mensagens e estados do formulario aos testes atuais.

**Details:**

Corrigir cenarios de nome, email e senha invalidos quando a falha estiver na divergencia de markup, labels ou mensagens exibidas.

### 335.4. Revalidar banner demo e persistencia do dismiss

**Status:** done  
**Dependencies:** 335.2, 335.3  

Confirmar o comportamento completo apos a criacao da conta demo.

**Details:**

Executar os cenarios de banner visivel no dashboard e de dismiss persistente na mesma sessao, registrando qualquer dependencia adicional de bootstrap.
