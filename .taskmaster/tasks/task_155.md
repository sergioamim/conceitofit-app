# Task ID: 155

**Title:** Implementar StorefrontTheme e CRUD no painel

**Status:** done

**Dependencies:** 154 ✓

**Priority:** medium

**Description:** Criar modelo de tema white-label e UI para edição no painel da academia.

**Details:**

Tipo StorefrontTheme em types.ts. Formulário react-hook-form + zod para campos (logo, cores, hero, favicon). Inject CSS variables no layout da storefront. Consome API backend #203/#204.

**Test Strategy:**

Salvar tema, recarregar storefront e verificar cores/logos.
