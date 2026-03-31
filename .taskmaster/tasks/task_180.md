# Task ID: 180

**Title:** Criar hooks useAsyncData e useDialogState reutilizáveis

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** O padrão loading/error/data com useState é repetido 300+ vezes. Modal open/close com estado fragmentado aparece em 20+ páginas.

**Details:**

Criar src/hooks/use-async-data.ts: hook genérico useAsyncData<T>(fetcher) que retorna { data, loading, error, refetch, run }. Criar src/hooks/use-dialog-state.ts: hook useDialogState() que retorna { isOpen, open, close, toggle }. Refatorar 3-5 páginas como prova de conceito (dashboard, alunos, pagamentos). Documentar padrão de uso.

**Test Strategy:**

Testes unitários para useAsyncData e useDialogState. Páginas refatoradas funcionam sem regressão.
