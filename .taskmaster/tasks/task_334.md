# Task ID: 334

**Title:** Eliminar loading infinito e payloads incompletos em modulos financeiro e operacional

**Status:** done

**Dependencies:** 327 ✓, 328 ✓, 329 ✓, 330 ✓

**Priority:** high

**Description:** Resolver falhas onde a shell monta, mas a tela fica em carregamento permanente ou com dados parciais insuficientes para completar o fluxo testado.

**Details:**

Esta task depende de 327, 328, 329 e 330.

Escopo obrigatorio:
1. Priorizar as specs que no relatório exibem sinais de loading infinito ou dados faltantes: tests/e2e/admin-financeiro-integracoes.spec.ts, tests/e2e/admin-financeiro-operacional-crud.spec.ts, tests/e2e/operacional-grade-catraca.spec.ts, tests/e2e/reservas-aulas.spec.ts, tests/e2e/bi-operacional.spec.ts e demais relacionadas.
2. Identificar em cada uma qual request nunca resolve ou resolve com shape insuficiente para a UI sair do estado de loading.
3. Corrigir os mocks de dominio necessarios sem voltar a usar fallbacks 200 {} genericos.
4. Se houver polling ou dependencia assincrona legitima da UI, ajustar o teste para esperar o sinal correto de pronto, nao apenas um timeout arbitrario.
5. Registrar no detalhe da task quais endpoints passaram a ser obrigatorios para esses modulos e quais cards/listagens dependem de cada um.

Criterio de aceite: nenhuma das specs desse grupo deve permanecer presa em 'Carregando atividades...', 'Emissor fiscal da unidade ativa: Carregando...' ou equivalentes sem uma causa funcional explicita documentada.

**Test Strategy:**

Reexecutar as specs de financeiro/operacional priorizadas e confirmar que estados de loading infinito foram eliminados sem introduzir waits cegos nem respostas 200 vazias.

## Subtasks

### 334.1. Identificar endpoints bloqueantes por spec e por modulo

**Status:** done  
**Dependencies:** None  

Mapear qual request nao resolve ou resolve com shape insuficiente em cada falha de loading.

**Details:**

Cobrir integrações financeiras, atividades operacionais, grade/catraca, reservas, BI operacional e quaisquer outras telas que o relatório mostrou presas em carregamento.

### 334.2. Corrigir mocks do dominio financeiro

**Status:** done  
**Dependencies:** 334.1  

Completar payloads e transicoes necessarias para integracoes, billing e emissor fiscal sairem do loading.

**Details:**

Garantir que campos usados por cards, tabelas, status fiscais e telas administrativas de integracao estejam presentes e coerentes.

### 334.3. Corrigir mocks do dominio operacional e gerencial

**Status:** done  
**Dependencies:** 334.1  

Completar endpoints e payloads de atividades, grade, reservas e BI para destravar a UI.

**Details:**

Validar especificamente listas, cards e componentes que dependem de dados agregados ou de relacionamento entre atividades, unidades e sessões.

### 334.4. Trocar waits cegos por sinais reais de pronto

**Status:** done  
**Dependencies:** 334.2, 334.3  

Ajustar as specs para aguardarem o evento correto de renderização completa quando necessário.

**Details:**

Usar indicadores reais de UI pronta ou responses esperadas, sem mascarar regressões com timeouts arbitrários ou sleeps desnecessários.
