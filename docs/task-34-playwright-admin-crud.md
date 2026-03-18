# Task 34 - Cobertura administrativa com Playwright

## Suítes adicionadas

- `tests/e2e/admin-backoffice-global-crud.spec.ts`
- `tests/e2e/admin-unidade-base-equipe.spec.ts`
- `tests/e2e/admin-catalogo-crud.spec.ts`
- `tests/e2e/admin-financeiro-operacional-crud.spec.ts`

## Comando consolidado

```bash
make e2e-admin-crud
```

## Aceite esperado

- Backoffice global cobre criação/edição de academia, criação/inativação de unidade e operação básica de segurança global.
- Área administrativa por unidade cobre atualização da academia atual, cargos e funcionários.
- Catálogo cobre CRUD principal de serviços, produtos e convênios, além do fluxo administrativo de vouchers.
- Financeiro e operacional cobre CRUD principal de formas de pagamento, tipos de conta, contas bancárias, maquininhas e atividades.

## Evidência consolidada

- Execução consolidada validada com `9 passed`.
- Infra padronizada em `tests/e2e/support/admin-crud-helpers.ts` e `tests/e2e/support/backend-only-stubs.ts`.
- Execução local isolada via `playwright.task34.config.ts` quando o app já estiver rodando em `127.0.0.1:3001`.

## Prompt para o backend

```text
Contexto:
O frontend adicionou cobertura Playwright para o CRUD administrativo e passou a depender de contratos estáveis para mocks e futuras execuções contra backend real.

Objetivo:
Gerar um PRD backend equivalente para suportar e estabilizar os contratos HTTP usados pelas suítes E2E administrativas, além de quebrar isso em tasks no task-master do backend.

Escopo mínimo do PRD:
1. Backoffice global
   - /api/v1/admin/academias
   - /api/v1/admin/unidades
   - /api/v1/admin/unidades/onboarding
   - /api/v1/admin/seguranca/overview
   - /api/v1/admin/seguranca/usuarios
   - /api/v1/admin/seguranca/usuarios/:userId
   - mutações de memberships, perfis e policy/new-units
2. Área administrativa por unidade
   - /api/v1/context/unidade-ativa
   - /api/v1/academia
   - /api/v1/unidades
   - /api/v1/administrativo/cargos
   - /api/v1/administrativo/funcionarios
3. Catálogo administrativo
   - /api/v1/comercial/servicos
   - /api/v1/comercial/produtos
   - /api/v1/comercial/planos
   - /api/v1/administrativo/convenios
   - /api/v1/administrativo/vouchers
   - /api/v1/administrativo/vouchers/:id/codigos
   - /api/v1/administrativo/vouchers/usage-counts
4. Financeiro e operacional
   - /api/v1/gerencial/financeiro/formas-pagamento
   - /api/v1/gerencial/financeiro/tipos-conta-pagar
   - /api/v1/gerencial/financeiro/contas-bancarias
   - /api/v1/gerencial/financeiro/maquininhas
   - /api/v1/administrativo/atividades

Requisitos do PRD:
- Documentar payloads de listagem, criação, edição, toggle/inativação e remoção.
- Definir comportamento para filtros como tenantId, apenasAtivos/apenasAtivas, paginação e preview elegível.
- Explicitar campos obrigatórios, defaults e respostas mínimas usadas pelo frontend.
- Incluir estratégia de testes de contrato/integrados para manter OpenAPI, controller e comportamento alinhados.
- Apontar gaps atuais e endpoints que hoje retornam formatos inconsistentes.

Saída esperada:
- PRD backend em pt-BR.
- Tasks do task-master quebradas por domínio, com subtasks para contrato, implementação, testes e documentação.
```
