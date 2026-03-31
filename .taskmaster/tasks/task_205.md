# Task ID: 205

**Title:** Fix: Atualizar params para Promise syntax (Next.js 16)

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Arquivo src/app/(app)/alunos/[id]/page.tsx usa params: { id: string } (sintaxe antiga). Next.js 16 espera params: Promise<{ id: string }>. Inconsistente com outras páginas.

**Details:**

Auditar todas as dynamic routes do projeto e garantir que usam a nova sintaxe params: Promise<{...}> do Next.js 16. Arquivos conhecidos: alunos/[id]/page.tsx. Verificar também: clientes/[id], funcionarios/[id], planos/[id], treinos/[id], prospects/[id], storefront routes.

**Test Strategy:**

Build sem deprecation warnings. Todas as rotas dinâmicas funcionam corretamente.
