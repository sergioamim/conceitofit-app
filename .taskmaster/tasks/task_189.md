# Task ID: 189

**Title:** Centralizar chamadas ViaCEP em helper fetchCep()

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 2 arquivos fazem fetch() direto ao viacep.com.br: novo-cliente-wizard.tsx e cliente-edit-form.tsx. Devem usar helper centralizado.

**Details:**

Criar src/lib/shared/cep-lookup.ts com função fetchCep(cep: string): Promise<CepResult>. Tratar erros (CEP inválido, timeout, API fora). Substituir os 2 fetch() diretos pelos imports do helper. Reutilizável para futuros formulários com CEP.

**Test Strategy:**

grep 'viacep.com.br' src/ retorna apenas cep-lookup.ts. Teste unitário para fetchCep com mock. Busca de CEP funciona nos 2 formulários.
