# Task ID: 42

**Title:** Auditoria backend para exclusão e tentativas negadas

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Registrar eventos de auditoria obrigatórios para exclusão e negativas, garantindo rastreabilidade.

**Details:**

Adicionar eventos CLIENTE_EXCLUIDO, CLIENTE_EXCLUSAO_NEGADA_SEM_PERMISSAO e CLIENTE_EXCLUSAO_NEGADA_POR_REGRA. Incluir payload mínimo (tenantId, alunoId, alunoNome, justificativa, executadoPor, perfilEfetivo, origem, timestamp, auditId/requestId). Pseudo-código: audit.log({ eventType, tenantId, alunoId, justificativa, ... }). Garantir retorno de auditId/eventType no sucesso.

**Test Strategy:**

Validar no backend que eventos são emitidos em sucesso e falhas, e que o response de sucesso inclui auditId/eventType.
