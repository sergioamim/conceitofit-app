# Task ID: 25

**Title:** Estabelecer baseline real de cobertura automatizada

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Instrumentar cobertura de codigo, publicar baseline e definir medicao confiavel para a meta de 60%.

**Details:**

Hoje o repositorio tem baseline funcional de 116 testes Playwright, sendo 29 testes E2E em 19 arquivos e 87 testes unitarios em 26 arquivos. Ainda nao existe percentual instrumentado de cobertura em linhas, statements, branches ou functions. Esta task fecha a medicao real, scripts de coleta, politicas de exclusao e o relatorio base para orientar o aumento ate 60%.

Baseline fechado em 2026-03-14 com cobertura instrumentada de 9.54% lines, 13.47% statements, 11.73% functions e 16.54% branches. Os artefatos foram publicados em `coverage/` e `docs/TEST_COVERAGE_BASELINE.*`, com smoke suite reprodutível de 5 arquivos e gates iniciais documentados rumo a 60%.

**Test Strategy:**

Executar scripts de coverage em ambiente local e CI, gerar relatorios HTML, LCOV e JSON, e validar que o baseline e reproduzivel.

## Subtasks

### 25.1. Auditar stack atual e definir estrategia de instrumentacao

**Status:** done  
**Dependencies:** None  

Escolher a forma de medir cobertura de codigo com confiabilidade no stack atual.

**Details:**

Revisar Playwright unit/E2E, Next.js, TypeScript e scripts existentes para decidir entre V8, Istanbul ou combinacao equivalente, incluindo limites da coleta em browser e em codigo de servidor.

### 25.2. Adicionar scripts e artefatos de coverage

**Status:** done  
**Dependencies:** 25.1  

Criar comandos reproduziveis para gerar cobertura localmente e no CI.

**Details:**

Adicionar scripts npm e configuracoes para emitir relatorios HTML, LCOV e JSON, cobrindo pelo menos as suites unitarias e uma trilha smoke representativa para integracao/E2E.

### 25.3. Gerar baseline atual e publicar snapshot inicial

**Status:** done  
**Dependencies:** 25.2  

Transformar o estado atual dos testes em um dado de cobertura auditavel.

**Details:**

Produzir o primeiro relatorio com percentuais reais por linhas, statements, branches e functions, destacando a diferenca entre o baseline funcional atual de 116 testes Playwright e a cobertura instrumentada efetiva do codigo.

### 25.4. Mapear exclusoes legitimas e gaps por dominio

**Status:** done  
**Dependencies:** 25.3  

Separar o que deve entrar na meta do que pode ficar fora por criterio tecnico.

**Details:**

Definir exclusoes documentadas para arquivos gerados, bootstrap inevitavel ou cascas de framework e classificar os dominios com maior risco e menor cobertura para priorizacao objetiva.

### 25.5. Definir meta incremental e gates iniciais rumo a 60%

**Status:** done  
**Dependencies:** 25.3, 25.4  

Fechar a politica de evolucao da cobertura a partir do baseline.

**Details:**

Registrar meta global de 60%, metas intermediarias por dominio e thresholds iniciais de controle para impedir regressao enquanto a cobertura sobe gradualmente.
