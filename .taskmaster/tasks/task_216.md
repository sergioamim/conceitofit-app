# Task ID: 216

**Title:** Refactor: Splitar runtime.ts monolítico por domínio

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** src/lib/tenant/comercial/runtime.ts tem 1500+ LOC com todas as operações de clientes, matrículas e pagamentos num só arquivo.

**Details:**

Splitar runtime.ts em arquivos por domínio: 1) src/lib/tenant/comercial/clients-runtime.ts - operações de listagem, busca, suspensão de clientes. 2) src/lib/tenant/comercial/enrollments-runtime.ts - operações de matrícula. 3) src/lib/tenant/comercial/payments-runtime.ts - operações de pagamento e recebimento. 4) src/lib/tenant/comercial/runtime.ts - re-exportar tudo para manter compatibilidade. Manter mesma interface pública (exports) para não quebrar consumers.

**Test Strategy:**

Testes existentes continuam passando. Imports existentes continuam funcionando via re-export. Nenhum arquivo excede 500 LOC.
