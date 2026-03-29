# Task ID: 211

**Title:** Refactor: Substituir string matching de erros por error codes estruturados

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** clientes-client.tsx faz message.toLowerCase().includes("x-context-id sem unidade ativa") para decidir retry. Padrão frágil que quebra com mudanças no backend.

**Details:**

Arquivo principal: src/app/(app)/clientes/components/clientes-client.tsx linhas 106-150. Criar src/lib/shared/utils/error-codes.ts com enum de error codes conhecidos. Atualizar normalizeErrorMessage em api-error.ts para extrair error codes do response body (se o backend enviar). Criar isRetryableError(error): boolean que centraliza a lógica de retry. Aplicar em clientes-client e outros locais que façam string matching de erros.

**Test Strategy:**

Retry funciona com error codes. Sem string matching de mensagens de erro no código.
