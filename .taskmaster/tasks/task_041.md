# Task ID: 41

**Title:** Implementar endpoint de exclusão controlada de cliente

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar endpoint dedicado para excluir cliente com validações e regras impeditivas de negócio.

**Details:**

Implementar DELETE /api/v1/comercial/alunos/{id} (ou POST /api/v1/comercial/alunos/{id}/excluir) aceitando body { tenantId, justificativa, issuedBy }. Validar justificativa (422), existência do aluno (404), permissão (403) e regras impeditivas (409) com motivos de bloqueio. Pseudo-código: if (!canDeleteClient) throw 403; if (!justificativa) throw 422; if (hasDependencies) throw 409 { blockedBy: [...] }; delete aluno; return { success: true, auditId, eventType }.

**Test Strategy:**

Testes de integração no backend cobrindo 403/404/409/422 e fluxo de sucesso com payload mínimo exigido.
