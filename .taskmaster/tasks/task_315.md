# Task ID: 315

**Title:** Criar página de troca de senha obrigatória no primeiro acesso

**Status:** done

**Dependencies:** 56 ✓, 64 ✓, 289 ✓

**Priority:** high

**Description:** Implementar uma nova rota `/primeiro-acesso/trocar-senha` e a lógica de redirecionamento quando o login retornar `forcePasswordChange=true`, permitindo que o usuário defina uma nova senha.

**Details:**

1.  **Criação da Rota e Página**: Crie uma nova página `src/app/(auth)/primeiro-acesso/trocar-senha/page.tsx`. Esta página deve ter um layout adequado para páginas de autenticação.2.  **Modificação do Fluxo de Login**: No arquivo `src/lib/api/auth.ts`, dentro da função `loginApi()` (e potencialmente `adminLoginApi()` se aplicável), intercepte a resposta do backend. Se a resposta contiver `forcePasswordChange: true`, redirecione o usuário para a nova rota `/primeiro-acesso/trocar-senha` utilizando `router.push()`. Certifique-se de que o token de sessão ou identificador necessário para o endpoint de troca de senha esteja disponível.3.  **Endpoint de API**: Crie uma nova função `changeForcedPasswordApi(newPassword: string, confirmNewPassword: string)` em `src/lib/api/auth.ts` que fará uma requisição POST para o endpoint de backend responsável pela troca de senha obrigatória (ex: `/api/v1/auth/force-password-change`). Esta função deve usar o token de autenticação da sessão.4.  **Formulário de Troca de Senha**: Na nova página, implemente um formulário com os seguintes campos:    *   `Nova Senha`: Campo de texto de senha.    *   `Confirmar Nova Senha`: Campo de texto de senha.    O campo 'senha atual' não é visível ou é pré-preenchido implicitamente pela sessão, conforme o fluxo de 'primeiro acesso'.5.  **Validação de Formulário (Zod)**: Utilize Zod para validação client-side dos campos `Nova Senha` e `Confirmar Nova Senha`. A validação deve incluir:    *   Mínimo de 8 caracteres.    *   Pelo menos 1 número.    *   Pelo menos 1 letra.    *   `Nova Senha` e `Confirmar Nova Senha` devem ser idênticas.6.  **Redirecionamento Pós-Sucesso**: Após a troca de senha bem-sucedida, redirecione o usuário para `/dashboard`, onde o checklist de onboarding deve ser exibido.7.  **Tratamento de Erros**: Exiba mensagens de erro claras ao usuário para falhas de validação ou erros da API.

DEPENDÊNCIA CROSS-REPO: Requer backend task academia-java#370 (POST /api/v1/auth/change-password) implementada primeiro.

**Test Strategy:**

1.  **Teste de Redirecionamento**: Simule um login onde a API de autenticação retorna `forcePasswordChange: true`. Verifique se o usuário é redirecionado automaticamente para `/primeiro-acesso/trocar-senha`.2.  **Teste de Validação**: Acesse a página `/primeiro-acesso/trocar-senha` (pode ser necessário mockar o estado de sessão ou rota para simular o primeiro acesso).    *   Tente submeter o formulário com uma nova senha com menos de 8 caracteres: Verifique a mensagem de erro.    *   Tente submeter com uma nova senha sem números ou letras: Verifique a mensagem de erro.    *   Tente submeter com 'Nova Senha' e 'Confirmar Nova Senha' diferentes: Verifique a mensagem de erro.    *   Tente submeter com senhas válidas que não atendem a todas as regras: Verifique as mensagens de erro.3.  **Teste de Troca de Senha com Sucesso**: Submeta o formulário com senhas que atendem a todos os requisitos. Mock a resposta da API de troca de senha como sucesso. Verifique se a chamada à API é feita corretamente e se o usuário é redirecionado para `/dashboard`.4.  **Teste de Falha na Troca de Senha**: Submeta o formulário com senhas válidas, mas mock a resposta da API de troca de senha como falha (ex: status 4xx). Verifique se uma mensagem de erro apropriada é exibida ao usuário e se ele permanece na página.5.  **Teste de Acesso Direto**: Tente acessar `/primeiro-acesso/trocar-senha` diretamente sem o flag `forcePasswordChange` ou sem estar em uma sessão de 'primeiro acesso'. Verifique se o usuário é redirecionado para o login ou para uma página de erro adequada, indicando que o acesso direto não é permitido sem o contexto correto.
