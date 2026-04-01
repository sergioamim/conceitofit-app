# Task ID: 259

**Title:** Configurar staging environment com deploy automático

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Deploys vão direto para produção sem ambiente de staging. Risco de bugs em prod.

**Details:**

Criar ambiente staging no Cloud Run (ou similar). GitHub Actions: push para main deploya em staging automaticamente. Deploy para prod via manual approval ou tag. Variáveis de ambiente separadas por ambiente.

**Test Strategy:**

Push para main deploya em staging. Staging acessível via URL dedicada. Prod só atualiza com approval.

## Subtasks

### 259.1. Configurar projeto Vercel para ambiente de staging

**Status:** done  
**Dependencies:** None  

Conectar o repositório GitHub à Vercel e configurar a branch principal (main) para gerar deployments de 'Preview' que servirão como ambiente de staging, permitindo um fluxo de trabalho onde a main é revisada antes de ir para produção.

**Details:**

Criar um novo projeto na Vercel, vinculando-o ao repositório GitHub (academia-app). Nas configurações do projeto Vercel, certificar-se de que a branch 'main' não está configurada como 'Production Branch' diretamente, para que os pushes na 'main' gerem 'Preview Deployments'. Isso pode exigir o uso de uma branch 'production' separada para o deploy de produção final.

### 259.2. Gerenciar variáveis de ambiente específicas por ambiente na Vercel

**Status:** done  
**Dependencies:** 259.1  

Configurar variáveis de ambiente na Vercel para que valores distintos (ex: URLs de API, chaves de serviço) sejam aplicados automaticamente em ambientes de staging (preview) e produção, garantindo isolamento e segurança.

**Details:**

No dashboard da Vercel, navegar até as 'Environment Variables' do projeto. Adicionar as variáveis necessárias (ex: 'NEXT_PUBLIC_API_URL', 'DATABASE_URL') e atribuir seus respectivos valores para os escopos 'Preview' (staging) e 'Production'. Definir o valor do 'NEXT_PUBLIC_API_URL' para apontar para um backend de staging no ambiente 'Preview'.

### 259.3. Criar GitHub Action para deploy automático da main em staging

**Status:** done  
**Dependencies:** 259.1, 259.2  

Desenvolver um workflow no GitHub Actions que, a cada push para a branch 'main', construa e implante a aplicação em um ambiente de preview na Vercel, atuando como o ambiente de staging para testes e validação.

**Details:**

Criar o arquivo '.github/workflows/staging-deploy.yml'. Este workflow deve ser acionado em 'push' para a branch 'main'. Ele utilizará o Vercel CLI (necessário instalar e autenticar com um 'VERCEL_TOKEN' como secret no GitHub) para realizar um deploy do projeto na Vercel como um Preview Deployment, garantindo que a URL de staging seja sempre atualizada.

### 259.4. Implementar GitHub Action para deploy em produção com aprovação manual

**Status:** done  
**Dependencies:** 259.3  

Desenvolver um workflow no GitHub Actions que permita o deploy para o ambiente de produção na Vercel. Este deploy será acionado manualmente ou por tag, e exigirá aprovação explícita de um revisor antes de ser publicado, garantindo controle de qualidade e mitigação de riscos.

**Details:**

Criar o arquivo '.github/workflows/production-deploy.yml'. Este workflow deve ser acionado 'on: workflow_dispatch' (para acionamento manual) ou 'on: push: tags'. Ele utilizará o Vercel CLI para promover um deployment de Preview existente para Produção, ou criar um novo deployment de Produção. Incluirá um passo com 'environment: production' e 'reviewers' no GitHub Actions para exigir aprovação manual antes da execução.
