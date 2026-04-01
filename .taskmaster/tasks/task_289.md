# Task ID: 289

**Title:** Frontend: Adaptar página /admin-login para nova API administrativa

**Status:** done

**Dependencies:** 16 ✓, 56 ✓, 64 ✓

**Priority:** high

**Description:** Atualizar o frontend da página /admin-login para utilizar o novo endpoint POST /api/v1/admin/auth/login, criando uma função `adminLoginApi()` dedicada em `src/lib/api/auth.ts` e garantindo que a função `loginApi()` existente continue exigindo o `redeIdentifier` para logins de academia.

**Details:**

1. Localizar o componente de login administrativo, provavelmente em `src/app/(admin)/admin-login/page.tsx`.2. Em `src/lib/api/auth.ts`, criar e exportar uma nova função assíncrona `adminLoginApi(credentials: AdminLoginCredentials)` que fará uma requisição POST para `/api/v1/admin/auth/login`. Esta função deve manipular o token de autenticação recebido (e.g., armazenar em localStorage/cookies) de forma similar à `loginApi()`.3. Modificar o formulário de login na página `/admin-login` para chamar `adminLoginApi()` ao invés de `loginApi()`.4. Revisar a função `loginApi()` existente em `src/lib/api/auth.ts` para confirmar que ela continua a receber e exigir um `redeIdentifier` como parte de seu contrato, garantindo que o fluxo de login para academias não seja afetado. Recomenda-se adicionar um `// TODO` ou comentário explícito indicando esta separação de responsabilidades.5. Garantir que os tipos de dados para `AdminLoginCredentials` sejam definidos apropriadamente, se necessário.

**Test Strategy:**

1. Testar o fluxo de login administrativo: Acessar `/admin-login`, inserir credenciais válidas de administrador e verificar se o login ocorre com sucesso, redirecionando para a área administrativa.2. Testar o fluxo de login de academia: Acessar o login contextual (e.g., `/acesso/{redeSlug}`), inserir credenciais válidas de academia e verificar se o login ocorre com sucesso, redirecionando para o dashboard da academia.3. Validar que as chamadas de API corretas estão sendo feitas (usar ferramentas de rede do navegador): `POST /api/v1/admin/auth/login` para admin e `POST /api/v1/auth/login` (ou similar) para academias.4. Testar cenários de erro para ambos os logins (credenciais inválidas, falha de rede) e verificar o tratamento de erro apropriado na UI.
