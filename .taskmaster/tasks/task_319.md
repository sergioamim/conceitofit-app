# Task ID: 319

**Title:** [E2E] Criar teste Playwright end-to-end do fluxo completo de onboarding

**Status:** done

**Dependencies:** 9 ✓, 163 ✓, 286 ✓, 314 ✓, 315 ✓, 318 ✓

**Priority:** high

**Description:** Este teste validará o happy path completo do onboarding de uma nova academia, desde o provisionamento por um administrador no backoffice até a conclusão das etapas iniciais do checklist por um novo usuário admin da academia.

**Details:**

Criar um novo arquivo de teste Playwright em `tests/e2e/onboarding.spec.ts` para cobrir o fluxo completo de onboarding.

O teste deve seguir os seguintes passos:
1.  **Login do Admin Global**: Navegar para `/admin/login`. Fazer login utilizando as credenciais de um administrador global (podem ser lidas de variáveis de ambiente como `process.env.ADMIN_EMAIL`, `process.env.ADMIN_PASSWORD`).
2.  **Provisionar Academia**: Navegar para a página `/admin/academias`. Clicar no botão 'Nova Academia'. Preencher o formulário de criação de academia com dados válidos e únicos (nome da academia, CNPJ, e-mail do primeiro administrador da academia). Submeter o formulário. O teste deve capturar a senha temporária gerada para o novo administrador da academia.
    *   Referência: Task 9 tratou da estrutura de `admin/academias`, e Task 286 refatorou estas páginas com TanStack Query, garantindo a estabilidade da interface.
3.  **Login do Administrador da Nova Academia**: Navegar para `/login`. Fazer login utilizando o e-mail do administrador da academia (criado no passo 2) e a senha temporária capturada.
4.  **Troca de Senha Obrigatória**: Após o login com senha temporária, o sistema deve redirecionar para uma página de troca de senha (ex: `/trocar-senha`). Preencher os campos com uma nova senha forte e confirmá-la. Submeter o formulário.
5.  **Página de Boas-vindas**: Verificar se o usuário é direcionado para uma página de boas-vindas (ex: `/boas-vindas`) e se o conteúdo esperado está presente.
6.  **Redirecionamento para Dashboard com Checklist**: Validar que o usuário é redirecionado para o dashboard (ex: `/dashboard`) e que o componente de checklist de onboarding (por exemplo, `data-testid="onboarding-checklist"`) é visível.
    *   Referência: Task 163 aborda a experiência inicial do dashboard e o redirecionamento.
7.  **Completar 'Dados da Academia' no Checklist**: Clicar no item do checklist 'Dados da Academia'. Navegar para a página de configurações da academia (ex: `/app/configuracoes/academia`). Preencher campos adicionais como endereço, telefone, horário de funcionamento. Salvar as alterações.
8.  **Completar 'Criar Plano' no Checklist**: Retornar ao dashboard. Clicar no item do checklist 'Criar Plano'. Navegar para a página de gestão de planos (ex: `/app/planos`). Criar um novo plano com nome, valor e recorrência. Salvar o plano.
9.  **Verificar Progresso do Checklist**: Navegar novamente para o dashboard (se não for redirecionado automaticamente). Verificar se os itens 'Dados da Academia' e 'Criar Plano' estão marcados como concluídos no checklist de onboarding e se o progresso geral foi atualizado.

Utilizar seletores robustos (ex: `data-testid`, `role`, texto) para interagir com os elementos da interface. Implementar asserções claras para cada passo.

**Test Strategy:**

1.  Criar o arquivo `tests/e2e/onboarding.spec.ts`.
2.  Implementar os 9 passos detalhados acima, utilizando `test.describe` e `test.step` para estruturar o teste.
3.  Garantir que os dados da academia e do administrador criados sejam únicos para cada execução do teste, para evitar colisões.
4.  Executar o teste E2E localmente via `pnpm playwright test tests/e2e/onboarding.spec.ts`.
5.  Verificar que todos os passos são executados com sucesso e que as asserções passam.
6.  Monitorar logs do console e rede para identificar quaisquer erros inesperados durante o fluxo.
7.  Considerar um passo de 'limpeza' (teardown) para remover a academia e o usuário criados, se viável, para manter o ambiente de teste limpo.
