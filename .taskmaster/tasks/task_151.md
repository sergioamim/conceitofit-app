# Task ID: 151

**Title:** Migrar listagens do tenant para Server Components

**Status:** pending

**Dependencies:** 150

**Priority:** high

**Description:** Converter /clientes, /planos, /matriculas, /pagamentos, /prospects para RSC.

**Details:**

Remover 'use client' das pages. Cada page.tsx faz fetch server-side e passa dados para ClientTable. Manter filtros/search no client.

**Test Strategy:**

Abrir cada rota e validar SSR com dados iniciais + filtros client-side.
