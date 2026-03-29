# Task ID: 192

**Title:** Migrar mais 5 páginas read-only para React Server Components

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** 106 páginas são 'use client'. Páginas de listagem simples podem ser RSC para melhor SEO e menor bundle JS.

**Details:**

Candidatas: administrativo/salas, administrativo/atividades, administrativo/formas-pagamento, administrativo/tipos-conta, administrativo/bandeiras. Para cada: remover 'use client', usar serverFetch para dados, extrair filtros interativos para client island. Seguir padrão de dashboard/page.tsx.

**Test Strategy:**

Páginas renderizam corretamente como RSC. Filtros funcionam. Bundle JS reduzido (verificar com bundle-analyzer).

## Subtasks

### 192.null. Migrar administrativo/salas para RSC

**Status:** done  
**Dependencies:** None  

### 192.null. Migrar administrativo/atividades para RSC

**Status:** done  
**Dependencies:** None  

### 192.null. Migrar administrativo/formas-pagamento para RSC

**Status:** done  
**Dependencies:** None  

### 192.null. Migrar administrativo/tipos-conta para RSC

**Status:** done  
**Dependencies:** None  

### 192.null. Migrar administrativo/bandeiras para RSC

**Status:** done  
**Dependencies:** None  

