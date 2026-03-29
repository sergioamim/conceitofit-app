# Task ID: 190

**Title:** Substituir console.error por logger.error em useEvoImportPage

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** 3 console.error restantes em useEvoImportPage.ts devem usar o logger estruturado criado na task 171.

**Details:**

Substituir os 3 console.error em src/app/(backoffice)/admin/importacao-evo-p0/hooks/useEvoImportPage.ts por logger.error() de @/lib/shared/logger. Passar contexto do módulo ('evo-import'). Verificar se há outros console.* remanescentes no codebase.

**Test Strategy:**

grep 'console.error' src/ retorna zero (exceto logger.ts). grep 'console.warn' src/ retorna zero.

## Subtasks

### 190.0. Substituir console.error em useEvoImportPage.ts

**Status:** done  
**Dependencies:** None  

### 190.0. Verificar outros console.error no codebase

**Status:** done  
**Dependencies:** None  

