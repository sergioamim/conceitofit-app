# Task ID: 34

**Title:** Cobrir CRUD da área administrativa com Playwright

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Adicionar cobertura E2E nas telas administrativas críticas, com foco em fluxo de criação, edição, exclusão/inativação e validações em operações CRUD.

**Details:**

Escalar os testes Playwright para `/admin/*` e `/administrativo/*` com cenários repetíveis e stubs de API controlados, garantindo confiança de regressão sem alterar comportamento funcional.

**Test Strategy:**

Implementar suíte por domínio com cenários de sucesso, validação de form, erro de API e estado vazio; medir ganho de regressão sem introduzir dependência de dados globais e sem flakiness por timing.

## Subtasks

### 34.1. Inventariar telas e elementos estáveis para testes

**Status:** done  
**Dependencies:** None  

Mapear páginas CRUD da área administrativa e confirmar seletores/contratos atuais.

**Details:**

Conferir `src/app/(backoffice)/admin/*` e `src/app/(app)/administrativo/*`, identificar páginas com Create/Edit/Delete/List/Search e montar matriz de cobertura com criticidade por rota.

### 34.2. Padronizar infraestrutura de testes administrativos

**Status:** done  
**Dependencies:** 34.1  

Criar helpers para autenticação com contexto, rotas mockadas e semântica de dados determinísticos.

**Details:**

Criar utilitários em `tests/e2e/support/admin*` para login/sessão com tenant ativo, seed de admin por suite e interceptadores por entidade (`academias`, `unidades`, `funcionarios`, catálogos).

### 34.3. Cobrir backoffice global (academias, unidades, segurança)

**Status:** done  
**Dependencies:** 34.2  

Implementar testes CRUD para `/admin/academias`, `/admin/unidades` e módulos de segurança global.

**Details:**

Criar suíte para listagem, criação e edição de academias/unidades e operações de usuário/perfil/acesso em `/admin/seguranca*` com cenário de sucesso e erro de API.

### 34.4. Cobrir administração por unidade: base e equipe

**Status:** done  
**Dependencies:** 34.2  

Cobrir `/administrativo/academia` e `/administrativo/funcionarios` com CRUD operacional.

**Details:**

Implementar cenários felizes, edição, validação e exclusão/arquivamento para as páginas de configuração da unidade e gestão de funcionários, incluindo mensagens de feedback.

### 34.5. Cobrir catálogo administrativo (serviços, produtos, planos, vouchers, convênios)

**Status:** done  
**Dependencies:** 34.4  

Adicionar testes de CRUD para páginas de catálogo no fluxo administrativo unitário.

**Details:**

Cobrir `/administrativo/servicos`, `/administrativo/produtos`, `/administrativo/planos`, `/administrativo/vouchers`, `/administrativo/convenios` com fluxo create/edit/inativar e validações por formulário.

### 34.6. Cobrir páginas financeiras e operacionais administrativas

**Status:** done  
**Dependencies:** 34.5  

Adicionar e/ou ampliar testes para formas de pagamento, contas e atividades.

**Details:**

Cobrir `/administrativo/formas-pagamento`, `/administrativo/tipos-conta`, `/administrativo/contas-bancarias`, `/administrativo/atividades`, `/administrativo/atividades-grade`, `/administrativo/maquininhas` com cenários de CRUD e erro.

### 34.7. Consolidar suíte, execução e evidência de aceite

**Status:** done  
**Dependencies:** 34.3, 34.4, 34.5, 34.6  

Unificar organização dos specs e registrar critérios de aceite por página.

**Details:**

Refatorar specs para reduzir duplicação, ajustar timeouts/waits sem flakiness, rodar `npm run e2e -- admin*`, e registrar evidência de coberturas mínima feliz/erro por rota priorizada.

### 34.8. Gerar prompt de alinhamento com backend para contratos usados no PRD de testes

**Status:** done  
**Dependencies:** 34.1  

Entregar instruções objetivas de contrato para QA e backend validar payloads esperados.

**Details:**

Criar texto pronto para backend com rota esperada, status codes, contrato de erro, payloads de sucesso/empty/invalid e estratégia de versão para suportar os testes de CRUD admin.
