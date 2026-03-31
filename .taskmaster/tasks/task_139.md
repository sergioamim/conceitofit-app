# Task ID: 139

**Title:** Extrair nav-items do backoffice e corrigir duplicidade

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Mover navegação do backoffice para arquivo dedicado e remover item duplicado de Compliance LGPD.

**Details:**

Criar src/lib/backoffice/nav-items.ts com estrutura semelhante a src/lib/nav-items.ts (incluindo ícones Lucide e agrupamento por seção). Substituir array hardcoded em src/app/(backoffice)/admin/layout.tsx por import do novo arquivo. Remover duplicidade do item 'Compliance LGPD'.

**Test Strategy:**

Abrir /admin e validar que sidebar renderiza todos os itens sem duplicações.
