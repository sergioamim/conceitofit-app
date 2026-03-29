# Task ID: 170

**Title:** Avaliar e atualizar vendor hookform-resolvers

**Status:** done

**Dependencies:** 166 ✓

**Priority:** medium

**Description:** Fork vendored em src/vendor/hookform-resolvers/zod pode estar causando type mismatches com zodResolver.

**Details:**

Verificar se @hookform/resolvers@3.10.0 oficial resolve os problemas de tipo com Zod 4. Se sim, remover src/vendor/hookform-resolvers/ e usar pacote oficial. Se nao, documentar motivo do fork e atualizar tipos.

**Test Strategy:**

Formularios de adesao, B2B e backoffice funcionam sem erros de tipo. Build OK.
