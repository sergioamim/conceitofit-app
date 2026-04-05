# Task 450: Mover storefront publico para (public) e alinhar rewrites de subdominio

## Status: pending
## Priority: high
## Dependencies: 448, 449

## Description
Migrar a arvore publica do storefront para o boundary `(public)` mantendo proxy, headers e URLs funcionando.

## Details
Mover `src/app/storefront/*` para `src/app/(public)/storefront/*` e revisar `src/proxy.ts`, `resolve-storefront-headers`, `loading.tsx`, `sitemap.ts` e paginas de not-found relacionadas. Garantir que o storefront continue resolvendo tenant por subdominio e que a area administrativa de configuracao do storefront permaneça separada na superficie operacional. Validar acesso por subdominio valido, subdominio invalido e acesso direto por URL.

## Test Strategy
Teste manual: abrir o storefront por subdominio e por URL direta, validar rewrite para a nova arvore, validar o not-found publico para subdominio invalido.
