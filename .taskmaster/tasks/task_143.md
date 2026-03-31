# Task ID: 143

**Title:** Migrar módulos do tenant para src/lib/tenant

**Status:** done

**Dependencies:** 141 ✓

**Priority:** high

**Description:** Realocar APIs e lógica da app do gestor para o domínio tenant.

**Details:**

Mover ~25 módulos: alunos, matriculas, pagamentos, planos, crm, treinos, comercial, financeiro, administrativo-*, tenant-context.ts, tenant-operational-access.ts, tenant-theme.ts para src/lib/tenant. Atualizar imports em ~60 páginas.

**Test Strategy:**

Abrir páginas do tenant (/clientes, /planos) e validar carregamento.
