# Task ID: 138

**Title:** Criar estrutura de domínios em src/lib

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Introduzir pastas por domínio (shared/tenant/backoffice/public) e barrels iniciais para preparar a migração de código.

**Details:**

Criados src/lib/shared/index.ts, src/lib/tenant/index.ts, src/lib/backoffice/index.ts e src/lib/public/index.ts com re-exports dos módulos existentes organizados por domínio. shared: access-control, formatters, types, utils, ui-motion, business-date, feature-flags, network-subdomain. tenant: tenant-context, tenant-operational-access, tenant-theme, nav-items, administrativo-colaboradores, auth-redirect. backoffice: admin módulos + security. public: services, storage, use-public-journey.

**Test Strategy:**

Build do Next.js passa sem erros novos. Imports existentes continuam funcionando.
