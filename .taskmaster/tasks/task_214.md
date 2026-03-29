# Task ID: 214

**Title:** Melhorar acessibilidade: aria labels, keyboard navigation e semântica

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Apenas ~44 atributos aria em 200+ componentes (~22% cobertura). Forms sem aria-label, tabelas sem headers semânticos, modais sem keyboard trap.

**Details:**

Fases: 1) Formulários: adicionar aria-label ou aria-labelledby em todos os inputs, selects e textareas. aria-describedby para mensagens de erro. aria-required para campos obrigatórios. 2) Tabelas: role="grid" onde aplicável, scope="col" em th, aria-sort em colunas ordenáveis. 3) Modais: verificar que shadcn Dialog já tem role="dialog" + aria-modal. Adicionar aria-labelledby apontando para título. Focus trap já deve existir via Radix. 4) Navegação: aria-current="page" no link ativo do sidebar. Skip-to-content link. 5) Status: aria-live="polite" em notificações e feedbacks.

**Test Strategy:**

Lighthouse accessibility score > 90. axe-core sem critical violations. Tab navigation funciona em todos os modais.
