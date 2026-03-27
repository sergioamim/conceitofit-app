# Task ID: 113

**Title:** Otimizar bundle: avaliar RSC boundaries e code splitting

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** 77 de 82 páginas usam "use client" no topo, forçando todo o código para o bundle do cliente. Avaliar quais páginas podem ter o data fetching movido para Server Components (RSC), reduzindo JS enviado ao browser. Implementar lazy loading para modais pesados e componentes não-críticos.

**Details:**

Mapear as 77 páginas "use client" e classificar: (A) páginas que fazem fetch em useEffect e poderiam buscar dados no servidor (ex: listagens como /alunos, /planos, /matriculas, /pagamentos); (B) páginas com interação pesada que precisam ser client (ex: /vendas/nova, CRM kanban); (C) páginas mistas que podem ter RSC wrapper + client island. Para tipo A, criar versão com async Server Component que passa dados via props. Para modais pesados (>500 linhas), usar next/dynamic com ssr:false. Avaliar impacto no bundle com next build --analyze (ou @next/bundle-analyzer). Meta: reduzir First Load JS em 20%+ nas listagens.

**Test Strategy:**

Comparar métricas de next build antes e depois: First Load JS shared, por-rota. Rodar Lighthouse Performance nas 5 rotas mais acessadas. Garantir que nenhuma funcionalidade quebrou com smoke manual.

## Subtasks

### 113.1. Mapear páginas com "use client" e classificar A/B/C

**Status:** pending  
**Dependencies:** None  

Levantar todas as páginas com "use client" e classificar por tipo de migração RSC.

**Details:**

Usar o resultado de `rg "use client" src/app` para gerar uma lista completa e documentar em `docs/RSC_BUNDLE_AUDIT.md` com rota, arquivo e classificação (A: fetch em useEffect, B: interação pesada, C: híbrida). Registrar exemplos observados como `src/app/(app)/planos/page.tsx`, `src/app/(app)/matriculas/page.tsx`, `src/app/(app)/pagamentos/page.tsx` e `src/app/(app)/clientes/page.tsx`, além de notas sobre páginas com modais pesados.

### 113.2. Converter listagens-chave para RSC com client islands

**Status:** pending  
**Dependencies:** 113.1  

Migrar listagens principais para Server Components e manter interações em ilhas client.

**Details:**

Para `/planos`, `/matriculas`, `/pagamentos` e `/clientes` (e notar que `/alunos` redireciona), criar um wrapper server component async em cada `page.tsx` e extrair a UI interativa para um componente client separado. Fazer o data fetching no servidor (usando funções API compatíveis com RSC) e passar dados iniciais via props. Manter ações e estados locais (filtros, toggles, modais) no client component, evitando hooks de contexto no server e preservando o comportamento atual.

### 113.3. Lazy load de modais pesados e bundle analyzer

**Status:** pending  
**Dependencies:** 113.1  

Aplicar code splitting em modais grandes e medir impacto no bundle.

**Details:**

Identificar modais >500 linhas (ex.: `src/components/shared/novo-cliente-wizard.tsx`, `src/components/shared/prospect-detail-modal.tsx`, `src/components/shared/treino-modal.tsx`) e trocar imports diretos por `next/dynamic` com `ssr:false` e fallback estável nas páginas que usam esses modais. Adicionar suporte a bundle analyzer (ex.: `@next/bundle-analyzer` em `next.config.ts` via `ANALYZE=true`) para comparar First Load JS antes/depois.
