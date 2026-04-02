# Task ID: 413

**Title:** Alinhar guards, bootstrap e navegação ao tenant ativo do token

**Status:** in-progress

**Dependencies:** 412 ✓

**Priority:** high

**Description:** Garantir que guards operacionais usem `activeTenantId` inicial do token enriquecido.

**Implementação**
- `src/lib/tenant/hooks/use-session-context.tsx`
  - Quando o token muda e existe sessão válida, o tenant context é resetado e o estado passa a `loading` antes do refresh. Isso evita herdar tenant antigo após o handoff e força o bootstrap a usar o `activeTenantId` do token recém-emitido.

