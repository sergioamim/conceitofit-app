# Task ID: 186

**Title:** Adicionar regra ESLint max-lines e detecção de código morto

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Sem limitação de tamanho de arquivo, pages crescem descontroladamente. Sem detecção de exports não utilizados.

**Details:**

Adicionar ao eslint.config.mjs: regra max-lines com limit 500 (warn) para arquivos em src/app/ e src/components/. Instalar knip como devDependency e configurar knip.json. Adicionar script npm 'dead-code': 'knip --reporter compact'. Rodar uma vez e resolver os achados mais críticos (exports não usados, arquivos órfãos).

**Test Strategy:**

npm run lint não falha (warnings OK). npm run dead-code gera relatório. Código morto identificado é removido ou justificado.
