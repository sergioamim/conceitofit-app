# Task ID: 219

**Title:** Fix: Corrigir build error em seguranca/acesso-unidade/page.tsx

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** zodResolver tem type mismatch com CreateUserFormValues. Build falha com TS2786. Investigar incompatibilidade Zod 4 + @hookform/resolvers e corrigir.

**Details:**

Arquivo: src/app/(app)/seguranca/acesso-unidade/page.tsx:67. Erro: Type CreateUserFormValues does not satisfy constraint ZodType. Provável incompatibilidade entre Zod 4.3.6 e @hookform/resolvers/zod. Corrigir tipagem ou atualizar resolver. npm run build deve completar sem type errors.

**Test Strategy:**

npm run build completa com sucesso. Página /seguranca/acesso-unidade funciona normalmente.
