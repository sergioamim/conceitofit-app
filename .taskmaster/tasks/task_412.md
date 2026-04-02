# Task ID: 412

**Title:** Implementar fluxo “Entrar como academia/unidade” usando endpoint oficial

**Status:** done

**Dependencies:** 411 ✓

**Priority:** high

**Description:** Consumir `POST /api/v1/admin/auth/entrar-como-unidade` e reemitir sessão enriquecida.

**Implementação**
- `src/lib/api/auth.ts`: adicionada `adminEntrarComoUnidadeApi` para consumir o endpoint oficial e salvar a sessão única.
- `src/app/(backoffice)/admin/entrar-como-academia/page.tsx`: fluxo atualizado para usar o endpoint, com justificativa opcional e redirecionamento para `/dashboard` após atualizar a sessão.
