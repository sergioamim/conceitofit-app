# Task ID: 258

**Title:** Padronizar top 10 formulários com react-hook-form + zod

**Status:** done

**Dependencies:** 250 ✓

**Priority:** medium

**Description:** Apenas 23 de 130+ formulários usam zodResolver. Padronizar os 10 mais usados.

**Details:**

Priorizar: prospect-modal, nova-matricula-modal, nova-conta-pagar-modal, editar-conta-pagar-modal, pagar-conta-modal, receber-pagamento-modal, plano-form (já usa RHF mas sem zod), cliente-edit-form. Criar schemas zod co-localizados. Inferir tipos via z.infer.

**Test Strategy:**

Formulários validam corretamente com dados válidos e inválidos. Zero regressão nos fluxos existentes.
