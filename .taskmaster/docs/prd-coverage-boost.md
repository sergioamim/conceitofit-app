# PRD: Aumentar Cobertura de Testes — Foco E2E

## Contexto

Cobertura atual (core src/lib): **17.54% lines** | Meta: **60%**
Existem 39 specs E2E mas apenas 8 estão no smoke suite (contribuem para cobertura).
31 testes E2E já escritos não estão no smoke suite e não contam na métrica.

## Estratégia

### Fase 1 — Quick wins: integrar E2E existentes ao smoke (meta: 25-30%)

Integrar os 31 E2E specs que já existem mas não contribuem para cobertura.
Agrupar por prioridade de impacto na cobertura de src/lib.

### Fase 2 — Novos E2E para fluxos críticos sem cobertura (meta: 35-40%)

Criar E2E specs para as áreas de maior gap:
- Dashboard principal
- Prospects (lista + conversão)
- Matrículas
- Pagamentos (lista + emissão em lote)
- Grade de aulas
- CRM (campanhas, playbooks, tarefas, cadências)
- Gerencial (DRE, contas a receber, BI rede)
- Administrativo (funcionários, produtos, salas, horários)

### Fase 3 — Testes unitários para core libs com 0% (meta: 45-50%)

Adicionar testes unitários para os módulos com maior gap em src/lib:
- src/lib/tenant/bi/analytics.ts (531 lines, 0%)
- src/lib/tenant/treinos/v2-runtime.ts (469 lines, 0%)
- src/lib/tenant/rbac/hooks.ts (421 lines, 0%)
- src/lib/tenant/hooks/use-session-context.tsx (322 lines, 0%)
- src/lib/tenant/financeiro/recebimentos.ts (349 lines, 0%)
- src/lib/backoffice/security-governance.ts (342 lines, 0%)
- src/lib/query/ (34 arquivos, 1681 lines, 0%)

### Fase 4 — Expandir E2E backoffice admin + edge cases (meta: 55-60%)

- E2E para páginas admin (financeiro, segurança, operacional, compliance)
- Cenários de erro e borda em todos os fluxos
- Multi-tenant edge cases
- RBAC/permission matrix

---

## Tasks Detalhadas

### Task 1: Integrar E2E existentes ao smoke suite — lote 1 (alto impacto)
Adicionar ao array SMOKE_E2E_SPECS em scripts/playwright-coverage.mjs os specs que cobrem mais src/lib:
- financeiro-admin.spec.ts (cobre src/lib/api/admin-billing, admin-gateways, backoffice/admin)
- reservas-aulas.spec.ts (cobre src/lib/tenant/aulas/reservas, api/reservas)
- crm-operacional.spec.ts (cobre src/lib/tenant/crm/workspace, crm/runtime)
- rbac.spec.ts (cobre src/lib/tenant/rbac/hooks, rbac/services)
- bi-operacional.spec.ts (cobre src/lib/tenant/bi/analytics)
Verificar que cada spec roda com sucesso antes de integrar.
Rodar coverage:report e validar aumento.

### Task 2: Integrar E2E existentes ao smoke suite — lote 2 (médio impacto)
Adicionar ao smoke suite:
- billing-config.spec.ts
- security-flows.spec.ts
- backoffice-seguranca.spec.ts
- backoffice-seguranca-governanca.spec.ts
- backoffice-seguranca-rollout.spec.ts
- backoffice-configuracoes.spec.ts
- backoffice-importacao-evo.spec.ts
Verificar execução e medir impacto na cobertura.

### Task 3: Integrar E2E existentes ao smoke suite — lote 3 (complementar)
Adicionar ao smoke suite:
- clientes-context-recovery.spec.ts
- clientes-exclusao-controlada.spec.ts
- clientes-migracao-unidade.spec.ts
- clientes-nfse.spec.ts
- clientes-url-state.spec.ts
- demo-account.spec.ts
- auth-rede.spec.ts
- admin-backoffice-global-crud.spec.ts
- admin-catalogo-crud.spec.ts
- admin-config-api-only.spec.ts
- admin-financeiro-operacional-crud.spec.ts
- admin-unidade-base-equipe.spec.ts
- app-multiunidade-contrato.spec.ts
- layout-bottom-nav.spec.ts
- operacional-grade-catraca.spec.ts
- planos-context-recovery.spec.ts
- treinos-web.spec.ts
- treinos-atribuidos.spec.ts
Após integração completa, todos os 39 specs devem contribuir para cobertura.

### Task 4: Criar E2E spec — Dashboard principal
Criar tests/e2e/dashboard.spec.ts cobrindo:
- Renderização do dashboard com dados mockados
- Cards de métricas (alunos ativos, receita, matrículas)
- Prospects recentes
- Pagamentos pendentes
- Navegação para páginas de detalhe
Mock API: instalar mocks para getDashboardApi.

### Task 5: Criar E2E spec — Prospects lista + conversão
Criar tests/e2e/prospects.spec.ts cobrindo:
- Lista de prospects com filtros
- Criação de prospect via modal
- Progressão de status (NOVO → CONTATADO → QUALIFICADO)
- Fluxo de conversão /prospects/[id]/converter (wizard 3 steps)
Mock API: listProspectsApi, createProspectApi, updateProspectApi, convertProspectApi.

### Task 6: Criar E2E spec — Matrículas + Pagamentos
Criar tests/e2e/matriculas-pagamentos.spec.ts cobrindo:
- Lista de matrículas com filtros e warning de expiração
- Cancelamento de matrícula
- Lista de pagamentos com filtros
- Modal "Receber" pagamento
- Emissão em lote (/pagamentos/emitir-em-lote)
Mock API: listMatriculasApi, cancelMatriculaApi, listPagamentosApi, receberPagamentoApi.

### Task 7: Criar E2E spec — Grade de aulas + Atividades
Criar tests/e2e/grade-atividades.spec.ts cobrindo:
- Visualização da grade semanal
- Filtro por modalidade/instrutor
- Listagem de atividades
Mock API: getGradeApi, listAtividadesApi.

### Task 8: Criar E2E spec — CRM avançado (campanhas, playbooks, tarefas)
Criar tests/e2e/crm-avancado.spec.ts cobrindo:
- CRM campanhas: lista, criação, ativação/pausa
- CRM playbooks: lista, criação de cadência
- CRM tarefas: lista, conclusão de tarefa
- Prospects Kanban: drag & drop de cards entre colunas
Mock API: listCampanhasApi, createCampanhaApi, listPlaybooksApi, listCrmTasksApi.

### Task 9: Criar E2E spec — Gerencial (DRE, contas a receber, BI)
Criar tests/e2e/gerencial.spec.ts cobrindo:
- DRE com seletor de período
- Contas a receber com filtros
- BI rede (visão global multi-academia)
- Recebimentos com filtros
Mock API: getDreApi, listContasReceberApi, getBiRedeApi, listRecebimentosApi.

### Task 10: Criar E2E spec — Administrativo (funcionários, salas, horários)
Criar tests/e2e/administrativo.spec.ts cobrindo:
- Funcionários: lista, cadastro, edição
- Salas: lista, criação
- Horários: configuração de grade
- Produtos: lista, criação
- Formas de pagamento: lista
Mock API: listFuncionariosApi, createFuncionarioApi, listSalasApi, listHorariosApi.

### Task 11: Testes unitários — src/lib/tenant/bi/analytics.ts
Criar tests/unit/bi-analytics-full.spec.ts cobrindo as funções de cálculo:
- Funções de agregação de KPIs
- Cálculos de conversão, ocupação, inadimplência
- Formatação de séries temporais
- Edge cases: dados vazios, valores zero, períodos sem dados

### Task 12: Testes unitários — src/lib/tenant/treinos (v2-runtime + v2-domain)
Criar tests/unit/treinos-v2-full.spec.ts cobrindo:
- Lifecycle de treino: criação → atribuição → execução → encerramento
- Lógica de renovação e revisão
- Cálculos de progressão (volume, carga)
- Edge cases: treino sem exercícios, exercício desativado

### Task 13: Testes unitários — src/lib/tenant/rbac/hooks.ts
Criar tests/unit/rbac-hooks.spec.ts cobrindo:
- useAuthAccess: resolução de permissões por role
- useRbacTenant: contexto de tenant para RBAC
- canAccessElevatedModules: lógica de acesso elevado
- Edge cases: sem roles, múltiplos perfis, perfil inativo

### Task 14: Testes unitários — src/lib/tenant/hooks/use-session-context.tsx
Criar tests/unit/session-context-full.spec.ts cobrindo:
- Inicialização de sessão
- Troca de tenant ativo
- Persistência em localStorage
- Refresh de token
- Edge cases: sessão expirada, tenant removido

### Task 15: Testes unitários — src/lib/tenant/financeiro/recebimentos.ts
Criar tests/unit/financeiro-recebimentos-full.spec.ts cobrindo:
- Cálculos de resumo financeiro
- Agrupamento por forma de pagamento
- Filtros por período e status
- Edge cases: valores negativos, datas inválidas

### Task 16: Testes unitários — src/lib/query/ (hooks TanStack Query)
Criar tests/unit/query-hooks.spec.ts cobrindo:
- Verificar que query keys são únicas e determinísticas
- Verificar exports do barrel (index.ts)
- Validar estrutura de hooks admin (queryFn, queryKey, enabled)
Não testar renderização React (fora do escopo unit Playwright).

### Task 17: Criar E2E spec — Admin backoffice (financeiro + segurança + operacional)
Criar tests/e2e/admin-backoffice-coverage.spec.ts cobrindo:
- Admin financeiro: dashboard, cobranças, contratos, gateways, planos
- Admin segurança: overview, revisões
- Admin operacional: alertas, saúde
- Admin compliance: dashboard LGPD
- Admin leads: lista, detalhe, mudança de status
Estas páginas já usam TanStack Query (task 286). Mock API para todos endpoints admin.

### Task 18: Expandir smoke suite com cenários de erro e edge cases
Adicionar testes de cenários negativos aos specs existentes:
- Timeout de API → exibição de erro
- Sessão expirada → redirect para login
- Dados vazios → empty state correto
- Validação de formulário → mensagens de erro
- Permissão negada → fallback de acesso
Adicionar ao menos 2 cenários de erro por spec no smoke suite.

### Task 19: Atualizar script de cobertura e gates para nova meta
Após atingir ~55% lines:
- Atualizar thresholds em playwright-coverage.mjs para refletir novos gates
- Atualizar docs/TEST_COVERAGE_CORE.md com novo snapshot
- Verificar que coverage:report roda limpo
- Documentar cobertura por grupo em TEST_COVERAGE_GOVERNANCE.md
