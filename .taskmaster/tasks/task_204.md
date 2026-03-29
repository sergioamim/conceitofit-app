# Task ID: 204

**Title:** Fix: Corrigir Suspense sem fallback no layout do backoffice

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** O layout do backoffice (src/app/(backoffice)/layout.tsx) usa <Suspense>{children}</Suspense> sem fallback prop.

**Details:**

Arquivo: src/app/(backoffice)/layout.tsx, linha 4. O Suspense sem fallback causa tela branca durante loading. Adicionar fallback com skeleton ou loading indicator adequado para o contexto admin.

**Test Strategy:**

Navegar para rotas /admin/* não mostra tela branca durante carregamento.
