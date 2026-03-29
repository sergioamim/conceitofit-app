# Task ID: 164

**Title:** Corrigir build quebrado por auth-redirect.ts

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** O arquivo src/lib/tenant/auth-redirect.ts exporta de ./shared/auth-redirect que nao existe, quebrando o build do Next.js.

**Details:**

Investigar se o modulo shared/auth-redirect foi deletado ou nunca existiu. Criar o modulo faltante com buildLoginHref e resolvePostLoginPath, ou corrigir imports em layout.tsx, conta/sair, sidebar, legacy-login-flow e network-access-flow. Validar com npx next build.

**Test Strategy:**

Build deve completar sem erros relacionados a auth-redirect. Navegar pelas rotas afetadas sem erros.
