# Task ID: 34

**Title:** Cobrir CRUD da área administrativa com Playwright

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Adicionar cobertura E2E nas telas administrativas críticas, com foco em fluxo de criação, edição, exclusão/inativação e validações em operações CRUD.

**Details:**

A cobertura atual de testes administrativos não cobre de forma homogênea os fluxos CRUD do `/admin` e `/administrativo`. Esta task organiza uma nova onda de testes Playwright para reduzir risco de regressão em mudanças da camada de gestão, sem incluir novas implementações funcionais de produto.

**Test Strategy:**

Implementar suíte por domínio com cenários de sucesso, erro de API, validações de formulário e estados vazios, com dados determinísticos e interceptação de rotas para reduzir flakiness. A validação final considera ganho claro na cobertura para as páginas alvo e execução estável de `npm run e2e -- admin*`.

## Subtasks

### 34.1. Inventariar telas e elementos estáveis para testes

**Status:** pending
**Dependencies:** None

Mapear telas e contratos atuais das áreas administrativas, priorizando operações CRUD repetíveis.

**Details:**

- Mapear `src/app/(backoffice)/admin/*` e `src/app/(app)/administrativo/*`.
- Levantar páginas com Create/Edit/Delete/List/Search por domínio.
- Confirmar seletores (roles/labels/data-testid) estáveis e pontos de fallback de navegação.

### 34.2. Padronizar infraestrutura de testes administrativos

**Status:** pending
**Dependencies:** 34.1

Criar helpers de autenticação, contexto e rotas para reduzir duplicação entre specs.

**Details:**

- Criar utilitários em `tests/e2e/support/admin*`.
- Padronizar seed de usuário, tenant/contexto e interceptação por entidade.
- Definir payload padrão por endpoint com IDs determinísticos.

### 34.3. Cobrir backoffice global (academias, unidades, segurança)

**Status:** pending
**Dependencies:** 34.2

Criar suíte para `/admin/academias`, `/admin/unidades` e fluxos de segurança global.

**Details:**

- Implementar criação/edição/listagem.
- Cobrir inativação/ativação e mensagem de sucesso/erro.
- Validar chamadas mínimas esperadas de API com rota interceptada.

### 34.4. Cobrir administração por unidade: base e equipe

**Status:** pending
**Dependencies:** 34.2

Cobrir `/administrativo/academia` e `/administrativo/funcionarios`.

**Details:**

- Criar cenários de criação/edição para cadastro e edição de perfil.
- Cobrir inativação de funcionário e validações de campos obrigatórios.
- Validar estados de error boundary e feedback UI.

### 34.5. Cobrir catálogo administrativo (serviços, produtos, planos, vouchers, convênios)

**Status:** pending
**Dependencies:** 34.4

Cobrir fluxos CRUD de páginas de catálogo administrativo.

**Details:**

- Incluir `/administrativo/servicos`, `/administrativo/produtos`, `/administrativo/planos`, `/administrativo/vouchers`, `/administrativo/convenios`.
- Validar create/edit/delete/inativar conforme operação da página.
- Cobrir cenário de erro de formulário e erro de backend.

### 34.6. Cobrir páginas financeiras e operacionais administrativas

**Status:** pending
**Dependencies:** 34.5

Cobrir `/administrativo/formas-pagamento`, `/administrativo/tipos-conta`, `/administrativo/contas-bancarias`, `/administrativo/atividades`, `/administrativo/atividades-grade`, `/administrativo/maquininhas`.

**Details:**

- Cobrir create/edit/delete/arquivar onde aplicável.
- Cobrir filtros/pesquisa e paginação se o componente possuir.
- Validar estado vazio e fallback de erro sem travas na navegação.

### 34.7. Consolidar suíte, execução e evidência de aceite

**Status:** pending
**Dependencies:** 34.3, 34.4, 34.5, 34.6

Consolidar organização dos specs e registrar evidência de cobertura por domínio.

**Details:**

- Consolidar arquivos `tests/e2e/*admin*`.
- Padronizar helpers de wait/asserção por resposta de API interceptada.
- Registrar execução por domínio e evidência de aceitação mínima.

### 34.8. Gerar prompt de alinhamento para o backend

**Status:** pending
**Dependencies:** 34.1

Produzir texto de PRD/contratos para o time de backend validar endpoints usados nos testes.

**Details:**

- Padronizar payloads esperados e status codes.
- Especificar códigos de erro e comportamento em exclusão/inativação.
- Entregar o texto no PR para criação de PRD equivalente do backend.
