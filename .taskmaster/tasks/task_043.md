# Task ID: 43

**Title:** Adicionar tipos e API client de exclusão no frontend

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Definir contratos de resposta/erro e implementar chamada de exclusão no client de alunos.

**Details:**

Em src/lib/types.ts, criar tipos para resposta de exclusão (success, auditId, eventType) e payload de bloqueio (ex.: blockedBy, motivo). Em src/lib/api/alunos.ts, adicionar excluirAlunoApi usando apiRequest com method DELETE ou POST, enviando tenantId, justificativa e issuedBy. Pseudo-código: return apiRequest<ClienteExclusaoResponse>({ path: `/api/v1/comercial/alunos/${id}`, method: "DELETE", query: { tenantId }, body: { tenantId, justificativa, issuedBy } }).

**Test Strategy:**

Teste unitário/contractual do client garantindo método, path e payload corretos; validação manual com backend real.
