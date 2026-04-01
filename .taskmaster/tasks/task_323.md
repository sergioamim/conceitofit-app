# Task ID: 323

**Title:** Limpar rotas legadas do storefront

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Remover rotas duplicadas e arquivos orfaos do storefront apos migracao para [academiaSlug].

**Details:**

Remover: src/app/storefront/unidade/ (substituido por [academiaSlug]/unidades/), src/app/storefront/resolve-storefront-headers.ts (nao mais necessario), referencias a STOREFRONT_DEV_TENANT_ID e STOREFRONT_DEV_ACADEMIA_SLUG. Atualizar storefront/page.tsx para redirecionar para /storefront ou mostrar listagem de academias. Verificar que nenhum link interno aponta para rotas removidas.

**Test Strategy:**

Acessar /storefront/unidade/xxx retorna 404. Acessar /storefront/demo funciona. Links internos apontam para novas rotas.
