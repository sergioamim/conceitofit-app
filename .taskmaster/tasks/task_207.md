# Task ID: 207

**Title:** Refactor: Adicionar logging nos catch blocks silenciosos (50+ arquivos)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Mais de 50 arquivos têm catch {} vazio ou catch { /* fallback */ } que engole erros silenciosamente, dificultando debugging em produção.

**Details:**

Buscar por catch blocks vazios em src/app/ e src/components/. Usar o logger existente em src/lib/shared/logger.ts para registrar erros. Padrão: catch (error) { logger.warn("[NomePagina] SSR fetch failed, falling back to client", { error }); }. Não alterar lógica de fallback, apenas adicionar visibilidade.

**Test Strategy:**

Erros de SSR aparecem nos logs. Comportamento de fallback inalterado.
