# Task ID: 84

**Title:** Adicionar command palette global de navegação

**Status:** done

**Dependencies:** 83 ✓

**Priority:** high

**Description:** Implementar uma command palette global acionada por teclado para abrir páginas, localizar clientes rapidamente e alternar unidades sem depender da navegação extensa da sidebar.

**Details:**

Usar `cmdk`/Command do Shadcn para criar um modal global disparado por `CMD/CTRL + K`, com busca incremental de páginas, atalhos para módulos críticos, suporte a navegação por teclado e bloco de troca rápida de tenant. A primeira fase deve priorizar frontend e reutilizar dados/rotas já existentes, preservando hidratação estável e evitando conteúdos client-only assimétricos no primeiro render.

**Test Strategy:**

Cobrir com testes unitários e E2E a abertura por atalho, fechamento por teclado, filtragem de páginas, navegação por setas/enter e troca rápida de unidade sem regressão visual em desktop.
