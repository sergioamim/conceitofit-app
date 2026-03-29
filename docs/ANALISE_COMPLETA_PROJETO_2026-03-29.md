# ANÁLISE COMPLETA DO PROJETO — CONCEITO FIT (academia-app)

---

# 1. Resumo Executivo

**O que é:** Frontend Next.js 16 (App Router, React 19, TypeScript strict) de uma plataforma SaaS multi-tenant para gestão de academias de ginástica. Cobre operação completa: CRM, clientes, matrículas, vendas, pagamentos, treinos, grade de aulas, financeiro gerencial (DRE, contas a pagar/receber, contabilidade), backoffice de rede, RBAC, storefront público e jornada de adesão digital.

**Estágio de maturidade:** Produto em transição de operacional para escala. A camada de mock foi removida (task 1-194 concluídas). 216 tasks completadas desde o início do projeto. O sistema já consome backend Java real via 46+ API clients (~13.920 LOC). PRDs documentam 10+ épicos com features avançadas (CRM com automações, BI operacional, contabilidade de dupla-entrada, RBAC com governança).

**Qualidade técnica geral:** **7/10** — Acima da média para o estágio. Arquitetura bem organizada com ESLint boundaries enforçando separação de domínios, 525 source files, 119 test files, CI com 3 pipelines (E2E, coverage gate, Lighthouse). Débitos técnicos existem mas são gerenciáveis.

**Aderência ao mercado:** **Média-Alta**. Resolve dor real, escopo amplo e competitivo, mas falta portal do aluno (app mobile/PWA), cobrança recorrente automatizada via gateway, e integrações com canais de comunicação (WhatsApp Business API, email transacional).

**Maior risco atual:** Ausência de observabilidade (sem Sentry/APM) e tokens em localStorage (vulnerável a XSS). Em produção multi-tenant, um erro não rastreado ou uma brecha de segurança pode afetar todos os tenants.

**Maior oportunidade atual:** A base técnica e de produto é sólida o suficiente para, em 60-90 dias, entregar portal do aluno + reservas online + cobrança automatizada — três features com alto impacto competitivo e receita.

---

# 2. O que o sistema faz hoje

## Funcionalidades implementadas (com evidência)

| Módulo | Funcionalidades | Evidência |
|--------|----------------|-----------|
| **Autenticação** | Login JWT multi-rede, refresh token, troca de unidade, impersonação admin, primeiro acesso | `src/lib/api/auth.ts` (422 LOC), `session.ts` (444 LOC), impersonation-banner |
| **Dashboard** | KPIs (alunos ativos, prospects, matrículas, receita mensal), tabs por domínio | `src/app/(app)/dashboard/` com `DashboardContent` |
| **CRM Completo** | Pipeline kanban, tarefas com prioridade, playbooks, cadências automatizadas, automações, campanhas, timeline de atividades | `src/app/(app)/crm/` (5 páginas), `src/lib/api/crm.ts` (~1200 LOC) |
| **Prospects** | CRUD, progressão de status (NOVO→CONVERTIDO), agendamentos, mensagens, conversão para aluno com wizard 3-etapas | `src/app/(app)/prospects/` + `[id]/converter` |
| **Clientes** | Cadastro completo, filtros, bulk actions, detalhe com abas (dados, pagamentos, cartões, NFS-e, presenças, treinos), suspensão/reativação, migração entre unidades | `src/app/(app)/clientes/` com 578 LOC client component |
| **Matrículas** | Dashboard mensal, renovação, cancelamento, filtro por status/plano, contrato digital | `src/app/(app)/matriculas/` |
| **Planos** | CRUD, grid de cards, formulário com atividades associadas, contrato digital, cobrança recorrente | `src/app/(app)/planos/` com `novo/`, `[id]/editar/` |
| **Vendas** | Carrinho unificado (plano/serviço/produto), desconto, acréscimo, voucher, recibo PDF | `src/app/(app)/vendas/nova/` (hook + 7 componentes) |
| **Pagamentos** | Listagem, recebimento manual, NFS-e em lote | `src/app/(app)/pagamentos/` |
| **Financeiro** | Contas a pagar/receber, DRE com projeções (3 cenários), conciliação bancária, recorrência automática, contabilidade (ledgers, transações, balanço, fluxo de caixa) | `src/app/(app)/gerencial/` (8+ páginas) |
| **Treinos** | Templates, exercícios, grupos musculares, editor v2 (drag-and-drop), atribuição, acompanhamento de aderência | `src/app/(app)/treinos/` (6 páginas) |
| **Grade/Aulas** | Mural semanal, atividades por sala/instrutor, horários, reservas com waitlist | `src/app/(app)/grade/`, `reservas/` |
| **Administrativo** | 20+ módulos: unidades, funcionários, salas, atividades, formas de pagamento, bandeiras, vouchers, convênios, maquininhas, contas bancárias, tipos de conta, serviços, produtos, NFS-e, catraca, integrações, IA | `src/app/(app)/administrativo/` |
| **Segurança** | RBAC com perfis de risco, grants por feature, usuários, auditoria, acesso por unidade, criação de usuários com convite | `src/app/(app)/seguranca/` |
| **Backoffice** | Dashboard admin SaaS, academias, financeiro B2B (planos/contratos/cobranças/gateways), segurança global, compliance LGPD, audit log, importação EVO, saúde operacional, métricas SaaS, leads B2B, BI executivo | `src/app/(backoffice)/admin/` (22+ páginas) |
| **Storefront** | Landing page personalizada por academia, planos, unidades, checkout, tema customizável, SEO/OpenGraph, JSON-LD | `src/app/storefront/` (RSC com serverFetch) |
| **Jornada pública** | Adesão digital (trial + completa), B2B lead capture, demo account | `src/app/(public)/` |
| **Monitor** | Tela de boas-vindas para recepção/catraca com resolução por tenant | `src/app/monitor/boas-vindas/` |

## Fluxos principais
1. **Jornada comercial:** Prospect → CRM (tasks, playbooks, cadências) → conversão → matrícula → contrato → pagamento
2. **Venda direta:** Seleção cliente → carrinho (plano/serviço/produto) → voucher/desconto → pagamento → recibo
3. **Gestão financeira:** Contas a pagar (recorrência automática) → DRE → projeção → conciliação bancária → contabilidade
4. **Operação de aulas:** Grade semanal → reservas → check-in → controle de capacidade → waitlist
5. **Treinos:** Catálogo de exercícios → templates → atribuição → tracking de aderência → revisão/renovação
6. **Onboarding B2B:** Lead capture → qualificação → configuração de academia → importação EVO → seed de unidades
7. **Adesão digital:** Storefront → seleção de plano → cadastro → checkout → contrato → ativação

---

# 3. Análise de aderência ao mercado

## Mercado-alvo
**Academias de ginástica e fitness no Brasil**, especificamente:
- Redes com múltiplas unidades (multi-tenant nativo)
- Academias de médio porte em busca de digitalização operacional
- Modelo SaaS B2B com cobrança recorrente por plano da plataforma

## Dor que resolve
Gestão fragmentada de academias — onde CRM, financeiro, operação de aulas, treinos e administrativo ficam em sistemas separados ou planilhas. O produto unifica tudo em uma plataforma com multi-tenancy, RBAC e BI.

## Nível de aderência: **MÉDIA-ALTA**

**Argumentos positivos (evidência forte):**
- Escopo funcional **mais amplo** que a maioria dos concorrentes de nicho (CRM com automações, DRE, contabilidade, RBAC com governança, NFS-e)
- Multi-tenancy nativo com isolamento por X-Context-Id — resolve a dor de redes com N unidades
- Storefront personalizado por academia — permite adesão digital self-service
- Backoffice B2B completo com métricas SaaS, saúde operacional e onboarding automatizado
- Contabilidade de dupla-entrada (ledgers, transações, balanço) — raro em concorrentes do segmento

**Argumentos negativos (evidência forte):**
- **Sem portal/app do aluno** — concorrentes (EVO/W12, Next Fit) têm app mobile para check-in, reservas e treinos
- **Sem cobrança recorrente automatizada** — gateway integrado mas sem recorrência via Stripe/Pagar.me ainda
- **Sem integração real com WhatsApp Business API** — CRM tem cadências mas execução é manual
- **Sem notificações push** — sem Firebase/OneSignal integrado
- **Sem controle de acesso físico real** — catraca UI existe mas integração com hardware é inferida

## Concorrência inferida (hipótese)
| Concorrente | Ponto forte | Lacuna do Conceito Fit |
|-------------|------------|----------------------|
| **EVO/W12** | App do aluno, catraca integrada, mercado maduro | Sem app mobile, sem hardware integration |
| **Next Fit** | UX moderna, cobrança recorrente automatizada | Sem billing automatizado |
| **Tecnofit** | App + wearables, analytics avançado | Sem wearable/IoT integration |
| **ABC Ignite** | Enterprise-grade, multi-país | Sem internacionalização |
| **Glofox** | App white-label, payments integrado | Sem app white-label |

## Classificação: **MÉDIA-ALTA**
O produto tem **escopo funcional excepcional** para o estágio (contabilidade, CRM com automações, BI, RBAC com governança são diferenciais). Mas falta **3 features que o mercado considera obrigatórias**: app do aluno, cobrança automatizada e notificações. Sem elas, o product-market fit é parcial.

---

# 4. Diagnóstico técnico geral

## Arquitetura

**Pontos fortes:**
- **Separação de domínios enforçada** via ESLint boundaries (`tenant ⛔ backoffice`, `public ⛔ hooks`). Evidência: `eslint.config.mjs` com 8 element types e regras de cross-import.
- **Three-tier API layer**: HTTP client (`http.ts`, 737 LOC) → API clients (`src/lib/api/`, 46+ arquivos, 13.920 LOC) → Service layer (`src/lib/tenant/`, domínio-específico). Cada camada tem responsabilidade clara.
- **Multi-tenancy como first-class citizen**: X-Context-Id header, tenant context sync, session com `availableTenants`, proxy de subdomínio para storefront.
- **Server Components + Client Components**: Uso do `createTenantLoader()` utility para RSC data fetching (evidência: task 206 refatorou 9 páginas). Suspense boundaries presentes.

**Pontos fracos:**
- **119 arquivos "use client"** — muitas páginas administrativas poderiam ser Server Components, reduzindo bundle JS
- **Componentes monolíticos**: `novo-cliente-wizard.tsx` (924 LOC), `usuarios/page.tsx` (942 LOC), `clientes-client.tsx` (578 LOC com 12 useState)
- **Service layer monolítica**: `runtime.ts` (~1500 LOC) mistura operações de clientes, matrículas e pagamentos

## Qualidade de código
- TypeScript strict habilitado, tipos ricos (320+ interfaces em `src/lib/shared/types/`)
- Zod para validação de formulários, react-hook-form como padrão (diretriz em CLAUDE.md)
- Sem `console.log` em produção, debug isolado em `src/debug/`
- Dead code detection via knip, linhas máximas por arquivo enforçadas (500 LOC warning)

## Segurança
- JWT com refresh token e retry de 401
- DOMPurify para sanitização HTML
- CSP, HSTS, X-Frame-Options configurados
- **Risco**: tokens em localStorage (XSS exposure), `'unsafe-inline'` e `'unsafe-eval'` no CSP
- RBAC com perfis de risco (BAIXO→CRÍTICO), feature catalog, audit trail

## Testabilidade e cobertura
- 119 arquivos de teste (58 unit, 38 e2e, 16 component, 7 integration)
- ~392 test cases
- Coverage gate: 60% mínimo em `src/lib/`
- Lighthouse CI em cada PR
- **Lacuna**: `sanitize.ts`, `feature-flags.ts`, `business-date.ts` sem testes unitários

## Observabilidade
- **Crítico**: sem Sentry, APM, distributed tracing, ou log aggregation
- Logger básico (`console.log/warn/error` com timestamps)
- Sem request correlation entre frontend e backend
- Sem métricas de performance real (apenas Lighthouse CI)

## Escalabilidade
- Standalone Next.js output para Cloud Run (Docker multi-stage)
- Proxy de subdomínio com cache de 5min para tenant resolution
- **Sem cache de API no cliente** (TanStack Query instalado mas uso limitado)
- **Sem CDN/edge** evidente para assets estáticos
- **Sem WebSocket/SSE** para real-time (dashboard, notificações)

---

# 5. Pontos fortes

| Ponto forte | Evidência | Impacto positivo |
|-------------|-----------|-----------------|
| **Arquitetura de domínio bem separada** | ESLint boundaries com 8 element types, regras de cross-import enforçadas | Onboarding rápido, evolução segura, evita acoplamento acidental |
| **Multi-tenancy nativo e robusto** | X-Context-Id, tenant context sync, proxy de subdomínio, isolamento por unidade, impersonação | Atende redes com N unidades sem workarounds |
| **Escopo funcional excepcional para o estágio** | 126 rotas, 46+ API clients, CRM com automações, contabilidade, BI, RBAC governado | Competitividade de produto acima da média |
| **Three-tier API layer** | `http.ts` (737 LOC) → API clients → Service layer com normalização | Fácil de manter, testar e trocar backend |
| **CI robusto com 3 pipelines** | E2E Playwright, coverage gate (60%), Lighthouse CI com bundle tracking | Previne regressões, mantém qualidade |
| **Documentação rica** | 47 arquivos em `docs/`, PRDs detalhados, guias de integração, specs técnicos | Contexto preservado, decisões documentadas |
| **TypeScript strict + Zod** | `tsconfig.json` strict, 320+ interfaces, schemas de validação por domínio | Type safety end-to-end, erros pegos em compile-time |
| **RBAC sofisticado** | Perfis com classificação de risco, feature catalog, audit trail, review board | Atende compliance (LGPD) e governança corporativa |
| **Storefront customizável** | Tema por academia (12 presets + cores custom), SEO, JSON-LD, adesão self-service | Diferencial competitivo real para aquisição de alunos |
| **Hydration safety como política** | CLAUDE.md com checklist de hydration, regras claras, task 203 corrigiu mismatch | Evita bugs de SSR/client em produção |

---

# 6. Pontos fracos

| Ponto fraco | Evidência | Impacto negativo | Urgência |
|-------------|-----------|-----------------|----------|
| **Sem observabilidade** | Grep por sentry/datadog/opentelemetry = 0 resultados em src/ | Impossível diagnosticar erros em produção, sem alertas | **CRÍTICA** |
| **Tokens em localStorage** | `session.ts` armazena access/refresh tokens em localStorage | XSS = comprometimento total da sessão do usuário | **ALTA** |
| **CSP permite unsafe-eval** | `next.config.ts` script-src inclui `'unsafe-eval'` | Reduz proteção contra XSS | **ALTA** |
| **Componentes monolíticos** | `novo-cliente-wizard.tsx` (924 LOC), `usuarios/page.tsx` (942 LOC) | Difícil de manter, testar e revisar. Risco de regressão | MÉDIA |
| **119 "use client" excessivos** | Grep por "use client" = 119 arquivos | Bundle JS inflado, SSR subutilizado | MÉDIA |
| **Sem app/portal do aluno** | Não há rota /aluno, /meu-treino ou PWA | Gap competitivo crítico — alunos não interagem com o sistema | MÉDIA |
| **Sem cobrança recorrente automatizada** | Gateway page existe mas sem Stripe/Pagar.me billing integration | Receita depende de operação manual | MÉDIA |
| **Service layer monolítica** | `runtime.ts` ~1500 LOC com 3 domínios misturados | Dificuldade de manutenção, conflitos de merge | BAIXA |
| **Sem real-time** | Sem WebSocket/SSE para dashboard, notificações, chat CRM | UX estática, sem feedback imediato | BAIXA |
| **Testes de componentes limitados** | 16 component tests para 110+ componentes (14% cobertura) | Regressões visuais não detectadas | BAIXA |

---

# 7. Débitos técnicos

| Categoria | Débito | Evidência | Impacto | Esforço | Prioridade |
|-----------|--------|-----------|---------|---------|------------|
| **Segurança** | Tokens em localStorage vulneráveis a XSS | `session.ts` usa localStorage para access/refresh token | Comprometimento de sessão em XSS | Alto | **P0** |
| **Observabilidade** | Zero APM/error tracking em produção | Sem Sentry/Datadog/OpenTelemetry em src/ | Cegueira operacional, incidentes não rastreados | Médio | **P0** |
| **Segurança** | CSP com unsafe-inline e unsafe-eval | `next.config.ts` headers | Reduz eficácia de proteção contra XSS | Médio | **P1** |
| **Código** | Componentes >500 LOC (5 arquivos) | wizard 924, usuarios 942, clientes 578, conta-pagar 704, prospect-detail 581 | Difícil manter, testar, revisar | Alto | **P1** |
| **Código** | 119 "use client" onde server components bastam | Grep "use client" = 119 hits | Bundle JS inflado, SSR subutilizado, perf degradada | Alto | **P2** |
| **Código** | Service layer monolítica (runtime.ts) | `src/lib/tenant/comercial/runtime.ts` ~1500 LOC | Conflitos de merge, responsabilidade misturada | Médio | **P2** |
| **Testes** | sanitize.ts sem testes (security-critical) | `src/lib/sanitize.ts` 19 LOC, 0 test files | Regressão de sanitização pode abrir XSS | Baixo | **P1** |
| **Testes** | feature-flags.ts sem testes | `src/lib/feature-flags.ts`, 0 test files | Toggle incorreto pode ativar/desativar features indevidamente | Baixo | **P1** |
| **Testes** | 16/110 componentes testados (14%) | `tests/components/` = 16 files | Regressões visuais e de interação não detectadas | Médio | **P2** |
| **Infra** | Sem deployment pipeline (CI sem CD) | `.github/workflows/` = build+test only | Deploy manual, propenso a erro, sem rollback | Médio | **P2** |
| **Infra** | Sem IaC (sem Terraform/Pulumi) | Nenhum arquivo .tf ou infra-as-code encontrado | Infraestrutura não reproduzível, drift | Médio | **P2** |
| **Produto** | Sem portal do aluno (app/PWA) | Nenhuma rota /aluno, /meu-treino ou service worker | Gap competitivo, alunos não interagem | Alto | **P2** |
| **Produto** | Sem billing recorrente automatizado | Gateway page sem integração com Stripe/Pagar.me billing | Receita depende de cobrança manual | Alto | **P2** |
| **Código** | Catch blocks silenciosos em pages multi-fetch | convenios/page.tsx, vouchers/page.tsx (2 restantes) | Erros engolidos, debugging difícil | Baixo | **P3** |
| **Infra** | Sem health check no container | Dockerfile sem HEALTHCHECK instruction | Cloud Run pode rotear tráfego para instância unhealthy | Baixo | **P3** |
| **Performance** | Sem cache de API client-side | TanStack Query instalado mas uso limitado | Re-fetch desnecessários, UX lenta em navegação | Médio | **P2** |

---

# 8. Riscos principais

| Tipo | Risco | Probabilidade | Impacto | Mitigação sugerida |
|------|-------|:---:|:---:|-----|
| **Segurança** | XSS compromete tokens em localStorage | Média | Crítico | Migrar tokens para HttpOnly cookies |
| **Operacional** | Erro em produção não detectado (sem APM) | Alta | Alto | Integrar Sentry + alertas |
| **Operacional** | Tenant data leak por bug no X-Context-Id | Baixa | Crítico | Testes de isolamento + audit contínuo |
| **Produto** | Churn por falta de app do aluno | Alta | Alto | Priorizar PWA ou portal web responsivo |
| **Escala** | Bundle JS cresce com 119 client components | Alta | Médio | Migrar páginas admin para RSC |
| **Manutenção** | Componentes >900 LOC geram bugs em refatoração | Média | Médio | Split em sub-componentes (task 210) |
| **Financeiro** | Cobrança manual limita escala de receita | Alta | Alto | Integrar billing automatizado |
| **Técnico** | Build quebrado por erros pré-existentes | Evidência: `seguranca/acesso-unidade/page.tsx` com TS error | Médio | Corrigir erros de build imediatamente |

---

# 9. O que fazer agora

## Imediatas (esta semana)

1. **Integrar Sentry** para error tracking frontend — sem isso, produção é voo cego
2. **Corrigir build error** em `seguranca/acesso-unidade/page.tsx` (zodResolver type mismatch)
3. **Adicionar testes para `sanitize.ts`** — módulo security-critical sem cobertura
4. **Remover `'unsafe-eval'`** do CSP se possível (verificar se Next.js/TipTap exigem)

## Curto prazo (2-4 semanas)

5. **Migrar tokens para HttpOnly cookies** — requer coordenação com backend Java
6. **Adicionar HEALTHCHECK no Dockerfile**
7. **Splitar componentes >500 LOC** (task 210 já planejada)
8. **Expandir TanStack Query** para data fetching em páginas client (task 212)
9. **Criar deployment pipeline** (CD para Cloud Run via GitHub Actions)
10. **Adicionar testes para feature-flags.ts e business-date.ts**

## Médio prazo (1-3 meses)

11. **Portal do aluno** (PWA) — check-in, reservas, treinos, pagamentos
12. **Billing recorrente** — integração com Pagar.me/Stripe para cobranças automáticas
13. **Migrar páginas admin simples para Server Components** (task 213)
14. **Splitar runtime.ts** por domínio (task 216)
15. **WhatsApp Business API** — integrar cadências CRM com envio real

---

# 10. Roadmap sugerido

## 0–30 dias: Estabilização operacional

| Ação | Tipo | Impacto |
|------|------|---------|
| Integrar Sentry (frontend) | Infra/Ops | Visibilidade de erros em produção |
| Corrigir build errors pré-existentes | Código | Build verde, CI confiável |
| Testes para sanitize.ts, feature-flags.ts | Testes | Segurança e confiabilidade |
| Remover unsafe-eval do CSP | Segurança | Reduz superfície de XSS |
| Deployment pipeline (CD para Cloud Run) | Infra | Deploy automatizado e reproduzível |
| HEALTHCHECK no Dockerfile | Infra | Resiliência em Cloud Run |

## 31–60 dias: Qualidade e performance

| Ação | Tipo | Impacto |
|------|------|---------|
| Migrar tokens para HttpOnly cookies | Segurança | Elimina vetor XSS principal |
| Expandir TanStack Query em 5+ páginas | Performance | Cache, dedup, UX mais responsiva |
| Splitar 5 componentes >500 LOC | Código | Manutenibilidade, testabilidade |
| Splitar runtime.ts por domínio | Código | Separação de responsabilidade |
| Testes de componentes (+15 novos) | Testes | Cobertura de UI crítica |
| Migrar 15+ páginas admin para RSC | Performance | Redução de bundle JS |

## 61–90 dias: Produto e mercado

| Ação | Tipo | Impacto |
|------|------|---------|
| Portal do aluno (PWA) — check-in, reservas, treinos | Produto | Feature obrigatória para competir |
| Billing recorrente via gateway | Produto | Automação de receita, escala |
| WhatsApp Business API para CRM | Produto | CRM com execução real de cadências |
| Notificações push (Firebase/OneSignal) | Produto | Engajamento do aluno |
| IaC com Terraform para Cloud Run | Infra | Infraestrutura reproduzível |

---

# 11. Conclusão final

## Esse projeto tem base boa ou frágil?

**Base BOA.** A arquitetura é sólida (boundaries enforçados, multi-tenancy nativo, three-tier API, TypeScript strict). O volume de features implementadas (126 rotas, 46+ API clients, CRM com automações, contabilidade) demonstra capacidade de execução alta. 216 tasks concluídas com CI de 3 pipelines indica disciplina de engenharia. Os débitos técnicos são gerenciáveis — nenhum exige reescrita, apenas refatoração localizada.

## Está aderente ao mercado ou precisa reposicionamento?

**Parcialmente aderente, sem necessidade de reposicionamento.** O escopo funcional é competitivo e em algumas áreas (CRM com automações, contabilidade, RBAC governado) **excede** concorrentes do segmento. O gap está em **3 features que o mercado considera obrigatórias** (app do aluno, billing automatizado, comunicação integrada), não em direção errada. O produto compete no segmento certo com a proposta certa — precisa completar, não pivotar.

## Qual é o maior gargalo hoje?

**Operações + produto.** O sistema foi construído com disciplina técnica acima da média, mas está voando sem instrumentação (sem APM, sem alertas, sem correlation). E o produto tem features sofisticadas mas falta o básico que o aluno-final espera (app, notificações, reserva online). O gargalo não é arquitetura nem código — é **operacionalizar o que já existe** e **completar a experiência do aluno**.

## Direção recomendada

1. **Próximos 30 dias**: Estabilizar operações (Sentry, deploy pipeline, security fixes)
2. **Próximos 60 dias**: Melhorar performance e qualidade (TanStack Query, RSC migration, component splits)
3. **Próximos 90 dias**: Completar produto para o mercado (portal do aluno, billing, WhatsApp)
4. **Não fazer agora**: Internacionalização, marketplace de treinos, integrações com wearables — prematuros para o estágio

---

# Notas de avaliação (0–10)

| Dimensão | Nota | Justificativa |
|----------|:----:|---------------|
| **Clareza do produto** | **8** | PRDs detalhados (10+ épicos), 47 docs, CLAUDE.md com padrões. Propósito claro: SaaS multi-tenant para gestão de academias. Falta apenas uma landing page ou pitch deck público que comunique a proposta de valor ao mercado. |
| **Aderência ao mercado** | **6.5** | Escopo funcional competitivo e diferenciado em CRM/contabilidade/RBAC, mas falta 3 features que o mercado considera obrigatórias (app aluno, billing, notificações). Sem essas, aquisição e retenção de clientes fica limitada. |
| **Qualidade arquitetural** | **8** | ESLint boundaries enforçando separação de domínios, three-tier API layer, multi-tenancy como first-class citizen, RSC com createTenantLoader utility. Pontuação reduzida por 119 "use client" excessivos e componentes monolíticos. |
| **Qualidade do código** | **7** | TypeScript strict, Zod schemas, zero console.log, dead code detection. Reduzido por componentes >900 LOC, catch blocks silenciosos em 2 arquivos, e service layer monolítica (runtime.ts ~1500 LOC). |
| **Testabilidade** | **7** | 119 test files, coverage gate 60%, CI com E2E + Lighthouse. Boa cobertura de API/auth/RBAC. Reduzido por 14% de component coverage, módulos security-critical sem testes (sanitize.ts), e ausência de visual regression testing. |
| **Escalabilidade** | **6** | Standalone Next.js + Docker + Cloud Run. TanStack Query instalado mas pouco usado. Sem CDN, sem cache strategy, sem real-time (WebSocket). Bundle JS cresce linearmente com client components. Adequado para centenas de tenants, mas não para milhares sem otimizações. |
| **Segurança** | **6.5** | RBAC sofisticado, tenant isolation, DOMPurify, CSP headers, audit trail. Severamente penalizado por tokens em localStorage (XSS vector) e unsafe-eval no CSP. Para um SaaS multi-tenant com dados financeiros, isso é risco material. |
| **Operabilidade** | **4** | Ponto mais fraco. Sem Sentry/APM, sem log aggregation, sem alertas, sem request correlation, sem deployment pipeline (CI sem CD), sem IaC, sem health checks. Logger é console.log. Em produção, incidentes serão descobertos por reclamação de cliente, não por monitoramento. |
| **Velocidade de evolução** | **7.5** | 216 tasks completadas, 393 commits em 2026, Task Master integrado, CLAUDE.md com padrões claros. createTenantLoader utility eliminou boilerplate. Reduzido por build errors pré-existentes e componentes difíceis de modificar (>900 LOC). |
| **Saúde geral** | **7** | Projeto com fundação técnica sólida e escopo de produto ambicioso e bem direcionado. Os débitos técnicos são gerenciáveis (nenhum exige reescrita). O maior risco é operacional (produção sem visibilidade). Com 90 dias de foco em operações + features de aluno, o projeto pode atingir product-market fit real. |

---

**Análise realizada em:** 29/03/2026
**Escopo:** Frontend Next.js 16 (academia-app). Backend Java não avaliado diretamente.
**Método:** Leitura de código-fonte, configurações, testes, documentação, PRDs, tasks.json, CI pipelines, Dockerfile.
**O que não foi analisado:** Backend Java (endpoints, banco, migrations), infraestrutura Cloud Run real, métricas de uso/tráfego, dados financeiros do negócio, feedback de usuários finais.
