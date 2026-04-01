# Task ID: 234

**Title:** Splitar runtime.ts (~1500 LOC) por domínio

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Criar clients-runtime.ts, enrollments-runtime.ts, payments-runtime.ts. Manter runtime.ts como barrel re-export.

**Details:**

Arquivo: src/lib/tenant/comercial/runtime.ts. Separar por responsabilidade: operações de clientes, matrículas e pagamentos. Re-exportar tudo de runtime.ts para manter imports existentes funcionando.

**Test Strategy:**

Testes existentes passam. Imports existentes funcionam via re-export. Nenhum arquivo > 500 LOC.
