# Task ID: 412

**Title:** Implementar fluxo “Entrar como academia/unidade” usando endpoint oficial

**Status:** done

**Dependencies:** 411 ✓

**Priority:** high

**Description:** Consumir `POST /api/v1/admin/auth/entrar-como-unidade` e reemitir sessão enriquecida.

**Details:**

Escopo: atualizar UI do backoffice para enviar `academiaId`, `tenantId` e justificativa opcional, persistir o token retornado e redirecionar para `/dashboard` com contexto ativo definido.

**Test Strategy:**

Testar manualmente no backoffice com mock/fixture e validar que o redirecionamento acontece com a sessão atualizada.
