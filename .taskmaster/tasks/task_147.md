# Task ID: 147

**Title:** Configurar regras de import boundaries

**Status:** pending

**Dependencies:** 146

**Priority:** low

**Description:** Adicionar eslint-plugin-boundaries para garantir separação entre domínios.

**Details:**

Instalar eslint-plugin-boundaries. Configurar eslint.config.mjs: tenant não importa backoffice e vice-versa; public só importa public/shared.

**Test Strategy:**

npm run lint e verificar erros ao tentar import inválido.
