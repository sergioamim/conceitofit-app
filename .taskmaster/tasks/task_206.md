# Task ID: 206

**Title:** Refactor: Extrair createTenantLoader utility para eliminar duplicação em 50+ páginas

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** O mesmo padrão Loader (getActiveTenantId + serverFetch + catch silencioso + Suspense) é repetido em 50+ páginas administrativas. Extrair para utility reutilizável.

**Details:**

Padrão duplicado: async function getActiveTenantId() { cookies()... } + async function Loader() { const tenantId = ...; let data = []; try { data = await serverFetch(...) } catch {} return <Content initialData={data} /> }. Criar src/lib/shared/create-tenant-loader.tsx com: function createTenantLoader<T>(url: string, queryParams?: Record<string,string>): React.FC que encapsula todo o boilerplate. Migrar pelo menos 10 páginas como prova de conceito. Manter logging nos catch blocks.

**Test Strategy:**

Páginas migradas funcionam igual ao original. Loader genérico lida com erro e loading corretamente.
