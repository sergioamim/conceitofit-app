# Task ID: 27

**Title:** Sustentar cobertura com gates de CI e governanca continua

**Status:** done

**Dependencies:** 25, 26

**Priority:** medium

**Description:** Transformar a meta de cobertura em rotina de engenharia, com gates, dashboards e criterios de regressao.

**Details:**

Atingir 60% uma vez nao basta. Esta task foi concluida com gate automatizado de coverage core (`coverage:gate`), workflow de CI em `.github/workflows/coverage-core.yml`, suite smoke consolidada por dominio no coletor e politica operacional documentada em `docs/TEST_COVERAGE_GOVERNANCE.md`. Os artefatos publicados agora incluem resumo/LCOV/HTML do perfil core e historico em `docs/TEST_COVERAGE_HISTORY_CORE.json`.

**Test Strategy:**

Validar pipelines com gates ativos, artefatos publicados e bloqueio intencional quando a cobertura ficar abaixo dos thresholds definidos.

## Subtasks

### 27.1. Definir thresholds globais e por alteracao

**Status:** done  
**Dependencies:** None  

Converter a meta em regra automatica de merge.

**Details:**

Configurar thresholds globais de coverage e, quando fizer sentido, controles adicionais para arquivos tocados ou dominios mais criticos, evitando regressao mascarada pelo agregado.

### 27.2. Consolidar suite smoke por dominio critico

**Status:** done  
**Dependencies:** 27.1  

Garantir resposta rapida de regressao alem do percentual de coverage.

**Details:**

Definir um pack minimo de smoke para autenticacao, comercial, financeiro, treinos, backoffice e jornada publica, com execucao previsivel e sem flakiness estrutural.

### 27.3. Publicar artefatos e tendencia de coverage no CI

**Status:** done  
**Dependencies:** 27.1  

Dar visibilidade continua para a evolucao ou regressao da qualidade.

**Details:**

Publicar relatorios HTML, LCOV e resumo historico de coverage em cada pipeline relevante para que o time acompanhe tendencia e nao apenas um numero pontual.

### 27.4. Documentar politica operacional de testes e cobertura

**Status:** done  
**Dependencies:** 27.1, 27.2, 27.3  

Fixar os acordos de engenharia para manutencao do patamar atingido.

**Details:**

Documentar quais suites rodam em cada etapa, como ler os relatorios, quando aceitar excecoes, como tratar testes instaveis e qual o processo para elevar thresholds no futuro.
