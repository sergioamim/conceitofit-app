# PRD: Cobertura Playwright para CRUD da Área Administrativa

## 1. Contexto

Grande parte da área administrativa já está operacionalizada no frontend e já possui fluxos críticos de criação/edição/exclusão, porém ainda sem cobertura E2E suficiente para CRUD completo das telas administrativas.

Objetivo desta iniciativa é elevar a confiança de regressão em telas de administração global (backoffice) e administrativa por unidade, com foco em:

- operações de CRUD (criar, editar, listar, excluir/arquivar, visualizar),
- validações de estado vazio/erro/sucesso,
- consistência de navegação e mensagens,
- estabilidade de selectors e semântica de formulário,
- reduzir risco de regressão antes de novas mudanças em massa no módulo administrativo.

## 2. Escopo

### 2.1 Em escopo

Implementar e consolidar testes Playwright para as páginas abaixo, garantindo cenários reais de CRUD e cobertura mínima por domínio:

### A) Backoffice global

1. ` /admin/academias` (listar/criar/editar)
2. ` /admin/unidades` (listar/criar/editar)
3. ` /admin/seguranca/usuarios` (listar/criar/editar/perfil/atribuir unidade)

### B) Administrativo por unidade

1. ` /administrativo/academia` (configuração básica da unidade)
2. ` /administrativo/funcionarios` (listar/criar/editar/inativar)
3. ` /administrativo/servicos`
4. ` /administrativo/produtos`
5. ` /administrativo/planos`
6. ` /administrativo/vouchers`
7. ` /administrativo/convenios`
8. ` /administrativo/formas-pagamento`
9. ` /administrativo/tipos-conta`
10. ` /administrativo/contas-bancarias`
11. ` /administrativo/atividades`
12. ` /administrativo/atividades-grade`
13. ` /administrativo/maquininhas`

### 2.2 Fora de escopo inicial

1. Fluxos de importação e arquivos de integração (`/admin/importacao-evo-p0`, `/admin/importacao-evo`) no primeiro ciclo.
2. Telas de operação sem CRUD persistente (p.ex. operações puramente de leitura/relatórios).
3. Validação de performance completa e acessibilidade profunda (serão tratadas em tarefas correlatas de qualidade).

## 3. Requisitos funcionais de teste

### 3.1 Cobertura obrigatória por página CRUD

Para cada item em escopo, cobrir no mínimo:

- caminho feliz de criação (quando aplicável),
- edição de item existente,
- busca/filtro/paginação (quando existir,
- deleção, desativação ou remoção (quando aplicável),
- erro de validação de formulário com mensagem visível,
- erro de API com estado vazio/feedback.

### 3.2 Qualidade dos testes

- `page.route` para controlar dados das APIs dessas rotas e reduzir flakiness,
- `data-testid`/roles/labels sem depender de texto frágil,
- geração de dados únicos por execução (timestamps/rand) para evitar colisão entre execuções,
- isolamento por suíte com reset de estado.

### 3.3 Estrutura e manutenção

- criar helpers reutilizáveis em `tests/e2e/support/admin-*` para:
  - login com seleção de contexto (unidade/tenant),
  - seeds de catálogo administrativo,
  - helpers de modal e confirmação.
- manter cobertura em arquivos dedicados por domínio (ex.: `admin-backoffice-crud.spec.ts`, `admin-unidade-crud.spec.ts`, `admin-cadastro-catalogo.spec.ts`).

## 4. Padrão técnico do Playwright

### 4.1 Estrutura de mock/seed

- Seed único para identidade: `admin_user`, tenant-id ativo e contexto de unidade.
- Para cada fluxo CRUD, retornar payloads estáveis da API com IDs determinísticos.
- Validar chamada de endpoints esperados por fluxo (listagem + gravação + exclusão), sem depender de estado global.

### 4.2 Organização de testes

- `tests/e2e/admin-crud-backoffice.spec.ts`
- `tests/e2e/admin-crud-unidade.spec.ts`
- `tests/e2e/admin-crud-catalogo.spec.ts`
- `tests/e2e/support/admin-crud-fixtures.ts` (ou helpers equivalente)

## 5. Critérios de aceite

### 5.1 Aceite funcional

- Cada página CRUD alvo tem, no mínimo, 1 teste feliz e 1 teste de erro.
- Fluxos de criação/edição/remocao/ativação/inativação estão cobertos para as páginas com esses recursos.
- Erros de API simulados retornam feedback no UI nos fluxos críticos.

### 5.2 Aceite de cobertura

- O número de testes E2E no relatório de QA da área administrativa cresce de forma mensurável, com cobertura de pelo menos 70% das rotas CRUD prioritárias da área.
- Execução local e no CI de `npm run e2e -- tests/e2e/admin*` ou equivalente estável.
- Não há regressão de suíte existente (`backoffice-global`, `admin-financeiro-integracoes`, `financeiro-admin`, etc.).

### 5.3 Aceite de manutenção

- Seletores e helpers padronizados com baixa fragilidade semântica.
- Sem dependência de dados externos não determinísticos.
- Novos cenários sempre podem ser adicionados com padrão único de utilitários.

## 6. Plano de execução (alto nível)

### Fase 1 — Baseline e estratégia

- mapear telas-alvo e confirmar componentes/rotas reais no código,
- consolidar estratégia de mocks/routes compartilhada,
- criar utilitários de login e estado administrativo.

### Fase 2 — Criação dos testes

- implementar suítes por domínio (backoffice global, alunos/admin unitário, catálogo administrativo),
- garantir cobertura para CRUD completo por rota.

### Fase 3 — Acabamento e CI

- consolidar helpers e reduzir duplicação,
- melhorar estabilidade (timeouts, waits por estado, retries estratégicos),
- registrar evidência no PRD e checklist de aceite.

## 7. Prompt de alinhamento com backend/frontend

Antes da execução final, validar com backend/front:

- contrato dos endpoints usados nos testes (formas de lista/salvar/remover),
- status code esperado para exclusão/inativação,
- comportamento de erro padronizado no payload,
- se há páginas em modo alias/redirect que exigem fluxo de navegação específico.

