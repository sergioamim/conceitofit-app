# Task ID: 411

**Title:** Adaptar camada de sessão para token único enriquecido

**Status:** done

**Dependencies:** 410 ✓

**Priority:** high

**Description:** Atualizar utilitários de sessão para suportar token único com `redeId` e `activeTenantId` ativos.

**Implementação**
- `src/lib/api/session.ts`
  - Adicionado `getSessionClaimsFromToken` para extrair `redeId`, `activeTenantId`, `tenantBaseId` e metadados da sessão diretamente do JWT quando o backend não envia os campos explícitos.
  - Normalização de scopes e campos string garantindo fallback seguro.
- `src/lib/api/auth.ts`
  - `normalizeSession` agora combina resposta do backend + claims do token + contexto preservado, evitando perda de `activeTenantId`/rede quando o contrato vier incompleto.

**Resumo do impacto**
- A sessão única passa a ser enriquecida mesmo que o backend envie apenas o token.
- Mantém compatibilidade com login administrativo e preservação de contexto quando necessário.
