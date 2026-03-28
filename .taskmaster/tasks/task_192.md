# Task ID: 192

**Title:** Migrar mais 5 páginas read-only para React Server Components

**Status:** done

**Dependencies:** []

**Priority:** low

**Description:** 106 páginas são 'use client'. Páginas de listagem simples podem ser RSC para melhor SEO e menor bundle JS.

**Details:**

Candidatas:
- administrativo/salas
- administrativo/atividades
- administrativo/formas-pagamento
- administrativo/tipos-conta
- administrativo/bandeiras

Para cada: remover 'use client', usar serverFetch para dados, extrair filtros interativos para client island. Seguir padrão de dashboard/page.tsx.

**Subtasks:**

- [x] Migrar administrativo/salas para RSC
- [x] Migrar administrativo/atividades para RSC
- [x] Migrar administrativo/formas-pagamento para RSC
- [x] Migrar administrativo/tipos-conta para RSC
- [x] Migrar administrativo/bandeiras para RSC

**Test Strategy:**

Páginas renderizam corretamente como RSC. Filtros funcionam. Bundle JS reduzido (verificar com bundle-analyzer).
