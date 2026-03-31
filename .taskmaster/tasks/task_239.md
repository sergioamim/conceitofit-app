# Task ID: 239

**Title:** Criar estrutura de rotas do portal do aluno

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Criar route group (aluno) com layout mobile-first, bottom nav, auth via rede/academia. Rotas: /meu-perfil, /meus-treinos, /minhas-aulas, /meus-pagamentos, /check-in.

**Details:**

Criar src/app/(aluno)/layout.tsx com bottom navigation (ícones: treino, aulas, check-in, perfil). Reusar auth flow de /acesso/[redeSlug]. Layout responsivo mobile-first (max-width container). Session do aluno com scope UNIDADE. Proteger rotas com redirect para login se não autenticado.

**Test Strategy:**

Rotas acessíveis. Layout mobile responsivo. Auth funciona. Redirect para login se não logado.
