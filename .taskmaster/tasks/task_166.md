# Task ID: 166

**Title:** Corrigir type errors nos formularios de adesao publica e B2B

**Status:** done

**Dependencies:** 164 ✓

**Priority:** high

**Description:** Type errors em cadastro/page.tsx (Sexo), checkout/page.tsx (zodResolver/SubmitHandler) e lead-form.tsx (zodResolver).

**Details:**

Ajustar tipos do zodResolver nos formularios de adesao e B2B. Corrigir tipo Sexo em cadastro. Resolver incompatibilidade do Resolver<CheckoutFormValues> e SubmitHandler no checkout. Corrigir cast do resolver no lead-form. Verificar se o vendor hookform-resolvers/zod precisa de ajuste.

**Test Strategy:**

tsc --noEmit sem erros nos arquivos de adesao e b2b.
