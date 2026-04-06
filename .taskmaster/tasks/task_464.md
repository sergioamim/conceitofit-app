# Task ID: 464

**Title:** Expandir portal do aluno: Meus Pagamentos com 2ª via e NFSe

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Completar /aluno/meus-pagamentos com lista de pagamentos, 2ª via de boletos, download de NFSe e status financeiro.

**Details:**

A página (aluno)/meus-pagamentos/page.tsx atual é mínima. Implementar: (1) Lista de pagamentos com status (Pago/Pendente/Vencido), (2) Filtro por período e status, (3) 2ª via de boleto para pagamentos pendentes (link ou QR Code), (4) Download de NFSe emitida, (5) Resumo financeiro: total pago, total pendente, total vencido, (6) Alerta visual para pagamentos vencidos. Reutilizar componentes de pagamentos do portal. Hydration safety: valores vêm serializados do backend.

**Test Strategy:**

Testes unitários de resumo financeiro e lista de pagamentos. Teste E2E: aluno com pagamento pendente gera 2ª via, aluno com NFSe faz download. Teste de acessibilidade.
