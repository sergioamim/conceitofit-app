# Task ID: 330

**Title:** Recuperar suites do app autenticado que hoje redirecionam para /login

**Status:** done

**Dependencies:** 327 ✓, 328 ✓, 329 ✓

**Priority:** high

**Description:** Fazer voltar a passar as specs do shell operacional que hoje quebram antes mesmo de exercer a funcionalidade da tela.

**Details:**

Esta task depende de 327, 328 e 329. Ela cobre as falhas agrupadas no bucket de login do app: /dashboard, /clientes, /administrativo, /planos, /treinos e fluxos semelhantes.

Escopo obrigatorio:
1. Reexecutar primeiro um subconjunto sentinela: tests/e2e/security-flows.spec.ts, tests/e2e/dashboard.spec.ts, tests/e2e/clientes-cadastro.spec.ts, tests/e2e/billing-config.spec.ts, tests/e2e/admin-financeiro-operacional-crud.spec.ts, tests/e2e/treinos-v2-editor.spec.ts e tests/e2e/sessao-multiunidade.spec.ts.
2. Confirmar que cada uma entra no shell autenticado correto sem bounce para /login.
3. Ajustar apenas o necessario nas fixtures, seeds e mocks para remover regressões de guarda/autorizacao e de contexto inicial.
4. Registrar, no detalhe da task, quais specs ainda falham depois disso por causa funcional real de tela para que possam ser tratadas em tasks posteriores.
5. Nao encobrir regressões com waits cegos: se a tela falhar depois do shell montar, registrar isso como resíduo funcional e nao como problema de autenticacao.

Criterio de aceite: o bucket de falhas que termina em heading 'Acesso' do app precisa ser reduzido a zero ou transformado em falhas funcionais explicitas de tela.

**Test Strategy:**

Reexecutar as specs sentinela do bucket de login do app e verificar que todas chegam ao shell autenticado; qualquer falha residual deve ser funcional e nao redirecionamento para /login.

## Subtasks

### 330.1. Reproduzir e confirmar o bucket de login do app

**Status:** done  
**Dependencies:** None  

Rodar as specs sentinela do shell operacional antes da correção fina.

**Details:**

Usar security-flows, dashboard, clientes-cadastro, billing-config, admin-financeiro-operacional-crud, treinos-v2-editor e sessao-multiunidade para validar a natureza do problema.

### 330.2. Destravar a entrada no shell autenticado

**Status:** done  
**Dependencies:** 330.1  

Ajustar fixture e mocks ate as paginas deixarem de cair em /login.

**Details:**

Tratar somente problemas de autenticacao, guards e contexto inicial. Nao misturar com correcoes de seletores ou bugs de tela ainda.

### 330.3. Estabilizar familias principais do app autenticado

**Status:** done  
**Dependencies:** 330.2  

Aplicar correcoes nas suites de /dashboard, /clientes, /administrativo, /planos e /treinos.

**Details:**

Agrupar por causa-raiz para que a mesma correcao derrube varios testes e nao gere retrabalho fragmentado.

### 330.4. Catalogar residuos funcionais apos o shell subir

**Status:** done  
**Dependencies:** 330.2, 330.3  

Separar claramente o que ainda e bug de tela ou mock de dominio.

**Details:**

Registrar no detalhe da task quais specs passaram da fase de login e quais falhas remanescentes devem ser tratadas em tasks de dominio posteriores.
