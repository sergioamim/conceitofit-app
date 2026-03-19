# Task ID: 49

**Title:** Testes e regressão da exclusão controlada

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Adicionar cobertura de testes para visibilidade, validação e fluxo de exclusão.

**Details:**

Criar/estender testes Playwright em tests/e2e para: menu visível apenas com canDeleteClient; modal exige justificativa; erro 403/409/422 exibe mensagem; sucesso redireciona para /clientes e ação não aparece em cartoes sem permissão. Se houver stubs, atualizar em tests/e2e/support/backend-only-stubs.ts. Pseudo-código: expect(menu).toContain('Excluir cliente') quando capability true; interceptar DELETE/POST e retornar 409.

**Test Strategy:**

Executar playwright test focado no cenário de cliente e validar asserts de visibilidade, mensagens e redirect.
