# Task ID: 318

**Title:** Criar página de provisionamento de academias no backoffice

**Status:** done

**Dependencies:** 16 ✓, 289 ✓

**Priority:** medium

**Description:** Desenvolver a página `/admin/onboarding/provisionar` no backoffice para permitir o provisionamento de novas academias, incluindo um formulário de dados e a exibição das credenciais geradas.

**Details:**

1.  **Criação da Rota e Componente**: Criar o arquivo `src/app/(admin)/onboarding/provisionar/page.tsx` para a nova página. Esta rota deve fazer parte do layout administrativo `(admin)`.2.  **Desenvolvimento do Formulário**: Implementar um formulário com os seguintes campos: `nome da academia`, `CNPJ`, `nome da unidade principal`, `nome do administrador`, `email do administrador` e `telefone`. Utilizar componentes de UI existentes em `src/components/ui/` para inputs, botões, etc.3.  **Validação com Zod**: Integrar validação de esquema com Zod para todos os campos do formulário. Criar um esquema Zod apropriado que inclua regras para cada campo (e.g., email válido, CNPJ no formato correto, campos obrigatórios).4.  **Integração com API de Provisionamento**: Ao submeter o formulário, fazer uma requisição POST para o endpoint `/api/v1/admin/onboarding/provision`. Criar ou estender um cliente de API em `src/lib/api/admin-onboarding-api.ts` (ou um arquivo similar na pasta `admin`) para encapsular essa chamada. A requisição deve enviar os dados do formulário no corpo.5.  **Exibição de Credenciais**: Após uma resposta de sucesso da API, exibir um card contendo as credenciais geradas (email e senha temporária) da nova academia. Este card deve incluir um botão para 'Copiar Credenciais' (copiar para a área de transferência) e outro para 'Enviar Credenciais' (via WhatsApp/email, que pode abrir um cliente de email ou WhatsApp com um texto pré-preenchido).6.  **Tratamento de Erros**: Implementar o tratamento de erros para requisições falhas à API, exibindo mensagens de feedback apropriadas ao usuário.7.  **Estilização**: Garantir que a página e o formulário sigam o padrão de design do backoffice.

DEPENDÊNCIA CROSS-REPO: Requer backend task academia-java#369 (POST /api/v1/admin/onboarding/provision) implementada primeiro.

**Test Strategy:**

1.  **Navegação e Acesso**: Acessar a rota `/admin/onboarding/provisionar` após realizar o login administrativo (dependência 289). Verificar se a página carrega corretamente.2.  **Validação do Formulário**: Testar a submissão do formulário com dados inválidos (e.g., email mal formatado, CNPJ inválido, campos obrigatórios vazios). Confirmar que as mensagens de erro do Zod são exibidas corretamente e a submissão é bloqueada.3.  **Submissão com Sucesso**: Preencher o formulário com dados válidos e submeter. Verificar se a requisição POST para `/api/v1/admin/onboarding/provision` é feita corretamente (via ferramentas de desenvolvedor). Confirmar que, após o sucesso, o card de credenciais é exibido com o email e a senha temporária.4.  **Funcionalidade 'Copiar Credenciais'**: Clicar no botão 'Copiar Credenciais' e verificar se o texto das credenciais é copiado para a área de transferência.5.  **Funcionalidade 'Enviar Credenciais'**: Clicar no botão 'Enviar Credenciais' e verificar se a ação de envio (e.g., abrir cliente de email/WhatsApp) é disparada com o conteúdo pré-preenchido.6.  **Tratamento de Erros da API**: Simular uma falha na resposta da API (e.g., código de status 500 ou 4xx) e verificar se a mensagem de erro é exibida adequadamente na UI.
