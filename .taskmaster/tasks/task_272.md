# Task ID: 272

**Title:** Migrar DRE (dre/page.tsx) para TanStack Query

**Status:** done

**Dependencies:** 225 ✓

**Priority:** medium

**Description:** DRE usa useState para dados do relatório. Relatório financeiro consultado frequentemente.

**Details:**

Criar useDre() hook. Query key: ["dre", tenantId, periodo]. staleTime 5min (dados financeiros mudam pouco).

**Test Strategy:**

DRE carrega com cache. Trocar período invalida. Voltar ao período anterior usa cache.

## Subtasks

### 272.1. Definir Fun
R

R

R

**Status:** pending  
**Dependencies:** None  

