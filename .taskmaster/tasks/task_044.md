# Task ID: 44

**Title:** Criar service runtime para exclusão de cliente

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Expor um service de alto nível no runtime comercial para encapsular a chamada de exclusão.

**Details:**

Em src/lib/comercial/runtime.ts, adicionar excluirAlunoService({ tenantId, alunoId, justificativa, issuedBy }) delegando ao excluirAlunoApi. Manter assinatura simples para uso em UI. Pseudo-código: return excluirAlunoApi({ tenantId, id: alunoId, justificativa, issuedBy }).

**Test Strategy:**

Teste unitário leve verificando que o service repassa parâmetros corretamente (mock do excluirAlunoApi).
