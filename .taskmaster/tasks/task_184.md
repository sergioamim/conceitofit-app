# Task ID: 184

**Title:** Migrar páginas read-only para React Server Components

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 44 páginas marcadas 'use client' fazem fetch no useEffect. Páginas de listagem simples podem ser RSC.

**Details:**

Identificar páginas read-only ou com interatividade mínima: planos, atividades, salas, formas-pagamento, tipos-conta. Converter para async Server Components usando serverFetch. Extrair filtros/interações para client islands. Seguir padrão já estabelecido em dashboard/page.tsx e adesao/page.tsx. Meta: converter pelo menos 5 páginas.

**Test Strategy:**

Páginas migradas renderizam dados corretamente. Filtros e interações funcionam. LCP melhor ou igual.
