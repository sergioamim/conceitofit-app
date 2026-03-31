# Task ID: 221

**Title:** Testes unitários para sanitize.ts (security-critical)

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** sanitize.ts (19 LOC) não tem nenhum teste. Módulo security-critical que usa DOMPurify. Adicionar cobertura completa.

**Details:**

Criar tests/unit/sanitize.test.ts. Testar: tags permitidas (p, b, strong, h1-h6, ul, ol, li, table) renderizam corretamente. Tags proibidas (script, iframe, object, embed) são removidas. Atributos maliciosos (onerror, onload, onclick, javascript:) são removidos. Edge cases: string vazia, HTML malformado, entidades HTML.

**Test Strategy:**

100% coverage no sanitize.ts. Testes passam no CI.
