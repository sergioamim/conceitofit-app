# Task ID: 213

**Title:** Migrar páginas administrativas simples para Server Components

**Status:** pending

**Dependencies:** 206

**Priority:** low

**Description:** 119 arquivos têm "use client" desnecessário. Muitas páginas administrativas simples poderiam ser Server Components, reduzindo bundle JS.

**Details:**

Auditar as 119 páginas "use client" e classificar: 1) Podem ser 100% server (listagens read-only sem interação) 2) Podem ser hybrid (server com client islands) 3) Precisam ser client (formulários, estado complexo). Migrar categoria 1 primeiro (estimativa: 15-20 páginas). Para categoria 2, usar pattern de Server Component pai + Client Component filho. Priorizar páginas administrativas simples como salas, bandeiras, tipos-conta.

**Test Strategy:**

Páginas migradas renderizam corretamente. Bundle size reduzido (verificar com ANALYZE=true npm run build). SSR funciona sem erros.
