# Task ID: 247

**Title:** Auditar e classificar 119 páginas "use client" para migração RSC

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Classificar em: (A) 100% server, (B) hybrid, (C) precisa client. Listar 15-20 candidatas para migração.

**Details:**

Grep todas as páginas com "use client". Para cada uma, verificar: usa hooks? usa useState/useEffect? usa event handlers? Se não, é candidata a RSC. Se usa apenas 1 hook simples, pode ser hybrid. Produzir lista classificada em docs/RSC_MIGRATION_CANDIDATES.md.

**Test Strategy:**

Lista classificada com justificativa. Sem falsos positivos.
