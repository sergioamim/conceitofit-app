# Plano de Frontend para o Backoffice (`admin.conceito.fit`)

## 1) Objetivo
Construir um painel Next.js (App Router + TypeScript) separado do app público, focado em produtividade de staff, intervenções cross-tenant e consultas gerenciais, respeitando as diretrizes do `AGENTS.md` (reutilizar `shadcn/ui`, evitar loops de refresh e manter acessibilidade/responsividade).

### 1.1 Visão global do staff
- Usuário admin vê o ecossistema inteiro, não apenas uma unidade; precisa atuar em qualquer academia/unidade sem trocar de aba.
- Fluxos abrangentes: criar nova academia/grupo e unidade inicial, importar dados legados, gerar cobranças em massa, dar baixa/estornar, bloquear/desbloquear acesso de clientes/unidades, reprocessar recorrências e sincronizações.
- UI deve sempre expor claramente o `targetTenantId` e exigir motivo/dupla confirmação para ações cross-tenant ou destrutivas.

## 2) Topologia e setup
- Subdomínio dedicado `admin.conceito.fit` com build independente (pasta `apps/admin` ou `src/app-admin` — decidir conforme monorepo). Compartilhar design system e tipos via pacote interno (`@academia/ui`, `@academia/types`).
- Backend real sempre ativo; fallback local deve ser tratado apenas como contingência técnica controlada pelo código.
- Cookies/sessão escopados ao subdomínio; headers obrigatórios: `X-Context-Id`, `tenantId` (ou `targetTenantId` para cross-tenant).

## 3) Arquitetura de pastas sugerida
- `apps/admin/app`: rotas do painel.
- `apps/admin/components`: composição usando `src/components/ui` (shadcn) e `components/shared` do projeto.
- `apps/admin/lib/api`: client HTTP, adapters de `services.ts` (mantendo assinatura), mapeadores de DTOs.
- `apps/admin/lib/hooks`: hooks específicos do painel (filtros persistentes, carregamento paginado, uso de feature flags).
- `apps/admin/lib/auth`: provider OIDC e guardas de rota.
- `apps/admin/styles`: tokens/tema e overrides se necessário.

## 4) Padrões obrigatórios (anti-loop, performance, UX)
- **Anti-loop**: não usar listeners globais (`academia-store-updated`, `storage`) em páginas com carga via API; refrescar dados somente por ações explícitas (`onSave`, filtros, paginação, botão de reload`).
- **Formulários**: estado local por campo; usar `react-hook-form` + componentes memoizados; evitar atualizar stores globais em `onChange`; callbacks e arrays memorizados; validação pesada sob debounce ou em submit.
- **Estados**: sempre cobrir loading/sucesso/erro/vazio; mensagens de erro amigáveis e com código/ID de correlação (`X-Context-Id`).
- **Acessibilidade**: labels visíveis, foco visível, contraste adequado; usar componentes `ui/*` existentes antes de criar novos.
- **Responsivo**: mobile-first; tabelas com colunas prioritárias e overflow em colapsáveis.

## 5) Autenticação e autorização no front
- Guardas de rota verificando sessão OIDC + roles; redirecionar para login em falta de token.
- Exibir role/tenant atual no topo; para ações cross-tenant exigir seleção explícita do `targetTenantId` + motivo e confirmação dupla (UI de modal).
- Esconder ações perigosas se role não permitir; feature flags para liberar fluxos novos.

## 6) Fluxos e domínios prioritários (faseada)
1) **Contexto global**: lista de academias/grupos, criação de academia + unidade inicial, seleção de `targetTenantId`, visão resumida de billing/syncs por tenant.
2) **Financeiro/gerencial**: contas a pagar/receber, DRE, dashboard; geração de cobrança em massa, baixa/estorno, filtros salvos, export assíncrona com status.
3) **CRM/Clientes**: prospects, alunos, matrículas, pagamentos; bloqueio/desbloqueio de acesso por inadimplência; correções com modal de confirmação.
4) **Catálogo/Administrativo**: planos, produtos/serviços, vouchers, atividades/grade, cargos/funcionários.
5) **Imports e migração**: wizards de importação de dados legados (CSV/API), dry-run, revisão de erros, execução assíncrona com acompanhamento de progresso e rerun controlado.
6) **Operações técnicas**: reprocessar recorrência, rebuild de mural, migrações — sempre com confirmação dupla e indicador de progresso.

## 7) Integração com backend
- Client em `apps/admin/lib/api/client.ts` com base URL do admin, headers (`X-Context-Id`, `tenantId`, auth token) e tratamento de erro padronizado.
- Adapters em `apps/admin/lib/api/services-api.ts` expondo mesmas assinaturas de `src/lib/mock/services.ts` para não tocar telas.
- Idempotência: enviar `Idempotency-Key` em POST críticos; backend retorna status/erro estruturado.

## 8) Observabilidade no front
- Incluir `X-Context-Id` nos requests e exibir no toast de erro para suporte.
- Telemetria de UX: tempo de carregamento de listas, latência percebida por ação, taxa de erro por rota.
- Logs de interface (apenas eventos administrativos, sem PII) opcionalmente enviados a endpoint de observabilidade.

## 9) Segurança e privacidade na UI
- Mascarar dados sensíveis (CPF/Cartão) em telas cross-tenant; requer ação explícita para revelar.
- Exports: gerar links temporários e avisar expiracão; bloquear export massiva sem escopo de tenant.
- Bloquear ações perigosas em ambiente de produção quando usuário estiver em tenant diferente do atual sem confirmação dupla.

## 10) Rollout proposto
1. Configurar workspace `apps/admin` com roteamento, auth guard e tema compartilhado.
2. Implementar client HTTP + adapters com flag `USE_REAL_API` e caminho feliz para Contexto/Financeiro.
3. Migrar listas financeiras e DRE para API real; validar anti-loop.
4. Adicionar fluxos CRM/Clientes e Catálogo; aplicar confirmação dupla onde necessário.
5. Habilitar operações técnicas via feature flags; ensaiar “break-glass” em staging.
6. Hardening: testes E2E (Playwright) focados em ações perigosas, auditoria visível na UI e monitoramento de erro.
