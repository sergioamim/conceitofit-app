# Task ID: 48

**Title:** Implementar fluxo de exclusão e tratamento de erros

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Ligar o modal à API, com feedback de sucesso, redirecionamento e mensagens de erro específicas.

**Details:**

No detalhe do cliente, chamar excluirAlunoService no confirmar. Em sucesso: fechar modal, mostrar feedback (toast ou banner), limpar estado e redirecionar para /clientes. Em erro: manter modal aberto, mapear ApiRequestError.status para mensagens (403: sem permissão, 409: bloqueio por regra com motivo, 422: justificativa inválida) e usar normalizeErrorMessage como fallback. Pseudo-código: try { await excluirAlunoService(...); router.push('/clientes'); } catch (err) { if (err.status===409) setErro(motivoBloqueio); }.

**Test Strategy:**

Teste manual com backend real/estágio simulando 403/409/422 e confirmando redirecionamento no sucesso.
