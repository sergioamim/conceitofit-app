# Task ID: 220

**Title:** Remover unsafe-eval do CSP em produção

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** CSP atual inclui unsafe-eval no script-src. Investigar quais dependências exigem (TipTap? Next.js dev?) e remover em produção.

**Details:**

Arquivo: next.config.ts, seção headers. Investigar se TipTap exige eval. Se apenas dev, condicionar por NODE_ENV. Se necessário, avaliar nonce-based CSP. Manter unsafe-inline (Tailwind/Shadcn precisam). Testar que todas as páginas funcionam sem unsafe-eval em build de produção.

**Test Strategy:**

Produção não tem unsafe-eval no CSP. Dev funciona normalmente. TipTap editor funciona. Lighthouse não reporta CSP violations.
