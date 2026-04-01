# Task ID: 328

**Title:** Migrar specs autenticadas para o helper canonico de sessao

**Status:** done

**Dependencies:** 327 ✓

**Priority:** high

**Description:** Substituir seeds manuais de localStorage por um caminho compartilhado de autenticacao Playwright, reduzindo divergencia entre specs e fixture.

**Details:**

Esta task depende da 327 e deve consumir o helper definitivo criado nela.

Escopo obrigatorio:
1. Mapear todas as specs que hoje fazem page.addInitScript com chaves de sessao escritas manualmente.
2. Classificar os usos por perfil: usuario operacional, usuario elevado/backoffice, viewer sem permissao, fluxo com troca de tenant e fluxo que autentica apos submit.
3. Refatorar as specs para usar o helper compartilhado em vez de seeds inline, preservando apenas overrides realmente necessarios por cenario.
4. Remover duplicacao de payloads de sessao e centralizar defaults em um ponto unico de manutencao.
5. Garantir que as specs continuem legiveis: a fixture precisa aceitar input de tenant, scopes, broadAccess, userKind e displayName sem exigir reescrita ad hoc em cada teste.

Arquivos prioritarios para migracao: tests/e2e/support/backend-only-stubs.ts, tests/e2e/support/admin-crud-helpers.ts, tests/e2e/billing-config.spec.ts, tests/e2e/backoffice-seguranca.spec.ts, tests/e2e/backoffice-configuracoes.spec.ts, tests/e2e/backoffice-impersonation.spec.ts, tests/e2e/admin-backoffice-coverage.spec.ts, tests/e2e/treinos-v2-editor.spec.ts, tests/e2e/security-flows.spec.ts, tests/e2e/dashboard.spec.ts e demais specs que tocam shells protegidos.

Definition of done: nenhuma spec do intervalo trabalhado deve depender de sementes divergentes de sessao quando o helper compartilhado puder ser usado.

**Test Strategy:**

Reexecutar um conjunto de specs migradas de cada familia principal e garantir que nao exista mais seed manual de sessao onde o helper compartilhado cobre o caso.

## Subtasks

### 328.1. Inventariar specs com addInitScript manual

**Status:** done  
**Dependencies:** None  

Separar por familia as specs que ainda semeiam sessao inline.

**Details:**

Classificar arquivos por shell, perfil de usuario e necessidade de override para orientar a migracao sem perder legibilidade.

### 328.2. Migrar helpers compartilhados e bases administrativas

**Status:** done  
**Dependencies:** 328.1  

Atualizar helpers support, billing, CRUD administrativo e suites de seguranca para usar o helper canonico.

**Details:**

Atacar primeiro os pontos que destravam mais specs de uma vez, como tests/e2e/support/admin-crud-helpers.ts, billing-config e suites base de seguranca/backoffice.

### 328.3. Migrar suites operacionais e fluxos do shell do app

**Status:** done  
**Dependencies:** 328.2  

Aplicar o helper canonico em dashboard, security-flows, treinos, clientes e suites semelhantes.

**Details:**

Remover seeds duplicadas e preservar apenas overrides que representem diferencas reais de papel, tenant ou escopo.

### 328.4. Remover duplicacoes remanescentes e documentar excecoes

**Status:** done  
**Dependencies:** 328.2, 328.3  

Deixar claro quando uma spec ainda precisa de complemento proprio alem do helper.

**Details:**

Registrar no detalhe da task quais cenarios continuam exigindo campos extras e por que eles nao devem voltar a virar uma seed paralela completa.
