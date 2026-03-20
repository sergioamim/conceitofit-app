# Task ID: 55

**Title:** Enriquecer a tela de contratos com resumo mensal e indicadores visuais

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Atualizar /matriculas para priorizar os contratos mais recentes do mes e adicionar indicadores executivos da carteira.

**Details:**

Refatorar src/app/(app)/matriculas/page.tsx para destacar os ultimos contratos do mes na tabela principal e introduzir um bloco superior com indicadores resumidos da carteira da unidade ativa. A nova experiencia deve incluir cards com total do mes, valor medio de contrato, receita contratada do mes, percentual de contratos ativos e um grafico em pizza agrupando os contratos ativos por plano, sem adicionar dependencia externa de chart. Revisar estados de loading, empty state e ordenacao local para manter consistencia com o contrato atual da API.

**Test Strategy:**

Cobrir a pagina de contratos com teste de regressao visual/funcional validando resumo mensal, agrupamento de ativos e recorte dos contratos mais recentes do mes.

## Subtasks

### 55.1. Modelar o recorte mensal e as metricas derivadas da tela de contratos

**Status:** done  
**Dependencies:** None

Calcular resumo do mes atual e agrupamentos sem depender de endpoint novo.

**Details:**

Derivar em memoria os contratos do mes atual, ordenar pelos mais recentes e calcular indicadores como total do mes, ticket medio, receita contratada e percentual de ativos.

### 55.2. Criar o bloco superior com KPIs e contexto da carteira

**Status:** done  
**Dependencies:** 55.1

Dar leitura executiva imediata antes da tabela.

**Details:**

Adicionar cards superiores com valor medio do contrato, receita do mes, total de contratos recentes, percentual de ativos e sugestoes de leitura operacional.

### 55.3. Adicionar grafico em pizza dos contratos ativos agrupados

**Status:** done  
**Dependencies:** 55.1

Visualizar distribuicao da carteira ativa por plano na propria pagina.

**Details:**

Construir um grafico em pizza com legenda, usando CSS e utilitarios nativos do projeto, agrupando os contratos ativos por plano e destacando os principais grupos.

### 55.4. Reorganizar a tabela para exibir os ultimos contratos do mes

**Status:** done  
**Dependencies:** 55.1, 55.2

Fazer a listagem principal refletir o recorte mensal e a ordenacao mais relevante.

**Details:**

Substituir a leitura generica por uma tabela focada nos contratos do mes atual, ordenados do mais recente para o mais antigo, com empty state e mensagens coerentes quando nao houver contratos recentes.

### 55.5. Cobrir regressao da nova leitura mensal de contratos

**Status:** done  
**Dependencies:** 55.2, 55.3, 55.4

Garantir estabilidade visual e funcional da pagina.

**Details:**

Adicionar ou ajustar testes para validar os cards superiores, o agrupamento de ativos no grafico e a listagem dos contratos mais recentes do mes.
