# Task ID: 249

**Title:** Criar testes E2E para a página de billing config

**Status:** done

**Dependencies:** 187 ✓, 49 ✓

**Priority:** low

**Description:** Implementar testes end-to-end para validar a funcionalidade e interface da página de configuração de faturamento, localizada em /administrativo/billing.

**Details:**

Criar um novo arquivo de teste Playwright em `tests/e2e/billing-config.spec.ts`. Os testes devem cobrir os seguintes pontos:
1. Login na aplicação como um usuário com permissões administrativas para acessar a área `/administrativo`.
2. Navegação direta para a rota `/administrativo/billing`.
3. Verificação do carregamento correto de todos os elementos da página, como títulos, campos de entrada, seletores e botões (e.g., 'Salvar Configurações').
4. Testes de interação com os componentes da página, incluindo preenchimento de campos de texto, seleção de opções em dropdowns e toggles.
5. Simular o fluxo de salvamento das configurações de faturamento, validando que os dados são enviados corretamente para a API. Pode ser necessário mockar respostas da API usando `page.route()` para controlar cenários de sucesso e falha.
6. Testar cenários de validação, onde dados inválidos são inseridos e as mensagens de erro apropriadas são exibidas.
7. Assegurar que a página é acessível apenas para usuários com as permissões corretas (e.g., tentar acessar com um usuário sem permissão e verificar o redirecionamento ou mensagem de erro).

**Test Strategy:**

1. Iniciar o servidor de desenvolvimento e o ambiente de testes Playwright.
2. Realizar login com um usuário administrador válido.
3. Navegar para a URL `/administrativo/billing`.
4. Validar que todos os campos e botões da página de configuração de faturamento são renderizados e interativos.
5. Executar um cenário 'happy path': preencher todos os campos com dados válidos e clicar no botão 'Salvar Configurações', verificando a mensagem de sucesso e a persistência dos dados (se aplicável, via mock ou requisição de leitura).
6. Executar cenários de 'error path': tentar salvar com campos obrigatórios vazios ou com dados em formato inválido, validando que as mensagens de erro são exibidas corretamente.
7. Testar o acesso à página com um usuário sem permissão administrativa, verificando se o usuário é redirecionado ou se uma mensagem de erro de acesso é exibida.
8. Executar os testes via `npx playwright test tests/e2e/billing-config.spec.ts` e garantir que todos os testes passem.
