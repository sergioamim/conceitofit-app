# Task ID: 456

**Title:** Auditar e mapear todos os dados de sessão em localStorage

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Inventariar todas as chaves localStorage usadas para sessão, contexto e tenant, classificando por sensibilidade e impacto de segurança.

**Details:**

Mapear todas as chaves em session.ts (901 LOC) e token-store.ts: academia-auth-token, academia-auth-refresh-token, academia-auth-token-type, user-id, user-kind, display-name, network-id, network-subdomain, network-slug, network-name, active-tenant-id, base-tenant-id, available-tenants, available-scopes, broad-access, force-password-change-required, preferred-tenant-id, impersonation-state. Classificar cada chave como: (a) token/secreto, (b) dado sensível de negócio, (c) preferência UI. Gerar matriz de risco para cada chave.

**Test Strategy:**

Teste unitário que lê session.ts e token-store.ts e valida que nenhuma chave sensível nova é adicionada sem aprovação. Teste E2E que verifica conteúdo de localStorage após login.
