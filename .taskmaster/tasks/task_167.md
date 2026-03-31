# Task ID: 167

**Title:** Eliminar usos de as any no codebase

**Status:** done

**Dependencies:** 166 ✓

**Priority:** medium

**Description:** 4 instancias de as any comprometem type safety: configuracoes, acesso-unidade, rbac e crud-modal.

**Details:**

Substituir as any por tipos genericos corretos em: configuracoes/page.tsx:171, acesso-unidade/page.tsx:75, rbac/page.tsx:225, crud-modal.tsx:101. Se causado pelo zodResolver, resolver junto com task 166. Para crud-modal, usar generic type parameter.

**Test Strategy:**

grep -r 'as any' src/ retorna zero resultados. Build sem regressoes.
