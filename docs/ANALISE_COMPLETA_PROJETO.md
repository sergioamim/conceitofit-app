# Análise Completa do Projeto — Conceito Fit (academia-app)

---

## 1. Resumo Executivo

**O que é:** Frontend Next.js 16 (App Router) de uma plataforma SaaS multi-tenant para gestão de academias de ginástica. Cobre operação diária (CRM, clientes, matrículas, pagamentos, treinos, grade de aulas), financeiro gerencial (contas a pagar, DRE, conciliação), backoffice de rede (academias, unidades, segurança global) e jornada pública (storefront, adesão, checkout).

**Estágio de maturidade:** Produto em transição de MVP para produto operacional. A camada de mock (`src/lib/mock/`) foi majoritariamente removida, mas a migração para API real ainda está incompleta (65 operações sem propagação de `tenantId`, domínios financeiros e de integração parcialmente conectados). O PRD documenta 69 imports de mock remanescentes — evidência de que a convergência está em andamento mas não concluída.

**Qualidade técnica geral:** Acima da média para o estágio. Arquitetura bem organizada, tipo system rico (320+ interfaces), HTTP client robusto com refresh token, CSP headers, ESLint boundaries, CI com 3 pipelines (E2E, coverage gate, Lighthouse). Cobertura de testes em `src/lib` a 62.74% com gate de 60%.

**Aderência ao mercado:** Média. Resolve dor real (gestão operacional de academias), mas falta features críticas para competir (reserva de aulas, portal do aluno, cobrança automatizada, CRM com canais reais). Concorrentes (EVO/W12, Next Fit, ABC Ignite) já entregam isso.

**Maior risco atual:** A dualidade entre mock e API real + a coexistência de dois fluxos de contratação (matrícula direta vs. venda) criam inconsistência de dados e travam a evolução de features financeiras e comerciais.

**Maior oportunidade atual:** A base técnica é sólida o suficiente para, em 60-90 dias, convergir para backend real e entregar reserva de aulas + portal do aluno — duas features com alto impacto competitivo.

---

## 2. O que o sistema faz hoje

### Funcionalidades implementadas (com evidência de código)

| Módulo | Funcionalidades | Evidência |
|--------|----------------|-----------|
| **Autenticação** | Login JWT, refresh token, troca de unidade, impersonação admin | `src/lib/api/auth.ts` (423 linhas), `session.ts`, impersonation-banner |
| **Dashboard** | KPIs (alunos ativos, prospects, matrículas, receita), tabs Clientes/Vendas/Financeiro | `src/app/(app)/dashboard/dashboard-content.tsx` |
| **CRM** | Pipeline kanban, tarefas, playbooks, cadências, automações, campanhas, timeline | `src/app/(app)/crm/` (5 páginas), `src/lib/api/crm.ts` |
| **Prospects** | CRUD, progressão de status, conversão para aluno | `src/app/(app)/prospects/` + wizard em `[id]/converter` |
| **Clientes** | Cadastro, filtros, avatar, detalhe com abas (dados, pagamentos, cartões, NFS-e, presenças) | `src/app/(app)/clientes/` com dialogs e workspace hook |
| **Matrículas** | Listagem, cancelamento, alerta de vencimento | `src/app/(app)/matriculas/` |
| **Planos** | CRUD completo, grid de cards, formulário de criação/edição | `src/app/(app)/planos/` com `novo/`, `[id]/editar/` |
| **Vendas** | Carrinho unificado (plano/serviço/produto), scanner código barras, recibo | `src/app/(app)/vendas/nova/` (7 componentes + hook) |
| **Pagamentos** | Listagem, recebimento manual, emissão NFS-e em lote | `src/app/(app)/pagamentos/` |
| **Financeiro gerencial** | Contas a pagar, DRE, projeções, recorrência | `src/app/(app)/gerencial/contas-a-pagar/` (5 componentes) |
| **Treinos** | Templates, exercícios, grupos musculares, editor v2, atribuição a alunos | `src/app/(app)/treinos/` (6 páginas), `treinos-v2-editor` |
| **Grade/Aulas** | Mural semanal, atividades, horários | `src/app/(app)/grade/`, `atividades/` |
| **Administrativo** | 20+ páginas: unidades, funcionários, salas, atividades, formas de pagamento, bandeiras, vouchers, convênios, maquininhas, contas bancárias, tipos de conta, serviços, produtos, NFS-e, catraca, integrações, IA | `src/app/(app)/administrativo/` |
| **Segurança/RBAC** | Perfis, grants, usuários, auditoria, acesso por unidade | `src/app/(app)/seguranca/rbac/` (5 arquivos) |
| **Backoffice global** | Dashboard admin, academias, financeiro, segurança, compliance, audit log, importação EVO, saúde operacional | `src/app/(backoffice)/admin/` (8+ páginas) |
| **Storefront público** | Landing page, planos, unidades, checkout, adesão/trial, cadastro, SEO/OpenGraph | `src/app/storefront/` (RSC com `serverFetch`) |
| **Monitor** | Tela de boas-vindas para recepção/catraca | `src/app/monitor/boas-vindas/` |
| **Conta do usuário** | Perfil, segurança, notificações, preferências, academia | `src/app/(app)/conta/` (6 páginas) |

### Fluxos principais
1. **Jornada comercial:** Prospect → follow-up → conversão → matrícula → pagamento
2. **Venda direta:** Seleção cliente → carrinho (plano/serviço/produto) → pagamento → recibo
3. **Gestão financeira:** Contas a pagar → DRE → projeção → conciliação
4. **Operação de aulas:** Grade semanal → atividades → horários → mural
5. **Backoffice:** Gestão de academias → unidades → saúde operacional → importação legada

---

## 3. Análise de Aderência ao Mercado

### Mercado/público aparente
- **Público-alvo:** Academias de ginástica de pequeno e médio porte, operando em rede (multi-unidade).
- **Perfis de usuário:** Recepção/comercial, financeiro, gestor de unidade, operador de rede/backoffice, instrutor (treinos).

### Dor que resolve
- Centralizar operação diária de uma academia em uma plataforma única: CRM, clientes, matrículas, pagamentos, treinos, grade de aulas, administrativo.
- Substituir planilhas e sistemas legados fragmentados (especialmente EVO, dado o módulo de importação).

### Nível de aderência: **Média**

**Justificativa:**

O sistema resolve a dor de gestão operacional, mas faltam capacidades que o mercado já considera commodities:

| Capacidade | Status no projeto | Concorrência |
|-----------|------------------|-------------|
| Reserva de aulas com lista de espera | Apenas parametrização em `AtividadeGrade`, sem jornada do aluno | Next Fit, W12/EVO, Mindbody |
| Portal/app do aluno | Páginas de conta sem persistência real, sem agenda/financeiro | ABC Ignite, Next Fit |
| Cobrança recorrente automatizada | Código de recorrência em contas a pagar, sem retry/playbook/link pagamento | ABC Ignite, Next Fit, W12/EVO |
| CRM com canais reais (WhatsApp/email) | Mock local, sem dispatch real de mensagens | W12/EVO, Next Fit |
| Contrato digital com e-assinatura | Template HTML + modo de assinatura, sem e-signature persistente | ABC Ignite, Next Fit, Mindbody |
| Avaliação física e evolução | Não implementado (apenas treinos + exercícios) | Next Fit, Trainerize |
| BI de rede consolidado | DRE local + dashboards isolados, sem camada consolidada | ABC Ignite, W12/EVO |

### Features com potencial excesso vs. valor
- **Importação EVO P0** — necessária para migração de clientes legados, mas consumiu esforço significativo para um cenário pontual.
- **20+ páginas administrativas** — cobertura ampla, mas sem teste E2E para maioria delas.

### Riscos de posicionamento
- **Risco de "sistema de cadastro glorificado":** Sem reservas, portal do aluno e cobrança automática, o produto cobre apenas a parte administrativa, que já é commodity. O diferencial competitivo está na operação do dia-a-dia do aluno, que ainda não existe.
- **Risco de escopo excessivo sem profundidade:** O sistema toca muitos domínios (CRM, financeiro, RBAC, treinos, catraca, BI, storefront) mas poucos estão completos de ponta a ponta.

---

## 4. Diagnóstico Técnico Geral

### Arquitetura
- **Padrão:** Next.js App Router com route groups (`(app)`, `(backoffice)`, `storefront`, `monitor`)
- **Separação clara:** `src/lib/api/` (43 módulos HTTP), `src/lib/shared/types/` (tipagem por domínio), `src/components/` (110 componentes), `src/lib/backoffice/`, `src/lib/public/`
- **RSC + Client Islands:** Storefront e 5 páginas administrativas migradas para Server Components; restante usa `"use client"`
- **Multi-tenancy:** Bem implementada via X-Context-Id header, session storage, tenant eligibility, operational access gate

### Pontos técnicos sólidos

1. **HTTP Client (`src/lib/api/http.ts`, 736 linhas):** Refresh token com deduplicação in-flight, retry em 401, normalização de erro, proxy via `/backend/*`, suporte a contexto multi-tenant. Evidência forte de maturidade.

2. **Type system (320+ interfaces, 8 módulos):** Domínio bem modelado com tipos ricos — `tenant.ts` sozinho tem 862 linhas cobrindo RBAC, BI, compliance, onboarding, health monitoring. Evidência forte.

3. **ESLint boundaries:** Proíbe import de `@/lib/mock` em código de produção, restringe `localStorage` a arquivos específicos. Evidência forte de disciplina.

4. **CI/CD (3 pipelines):** E2E headless, coverage gate com threshold 60%, Lighthouse com assert de acessibilidade ≥ 0.85. Evidência forte.

5. **Segurança:** CSP headers, HSTS, X-Frame-Options, Permissions-Policy em `next.config.ts`. Token refresh automático. Impersonação com audit trail.

### Pontos técnicos frágeis

1. **65 operações sem propagação de `tenantId`** (evidência: `docs/API_CLIENT_AUDIT.md`). O HTTP client não força injeção — depende de cada caller. Risco de vazamento de dados entre tenants.

2. **Ausência de middleware.ts:** Sem middleware Next.js para auth/redirect/tenant resolution no server. Toda lógica de acesso está no layout client-side (`AppOperationalAccessGate`). Risco: flash de conteúdo não autorizado, impossibilidade de proteger rotas antes do render.

3. **Session via localStorage:** 18 chaves em localStorage para sessão (evidência: `session.ts`). Não há cookie httpOnly para tokens. Risco de XSS extraindo JWT. O `serverFetch` lê de cookie `academia-access-token`, mas a sincronia entre localStorage e cookie não está clara.

4. **Sem observabilidade real:** Logger estruturado (`logger.ts`) emite para `console.*` — sem integração com Datadog, Sentry, OpenTelemetry, ou similar. Sem métricas de latência, error rate, ou usage.

5. **Testes cobrindo apenas `src/lib`:** Coverage gate de 60% aplica-se apenas a `src/lib/**`. Componentes em `src/components/` e páginas em `src/app/` não têm gate. Apenas 2 testes de componente (`demo-banner`, `plano-selector-card`).

---

## 5. Pontos Fortes

| # | Ponto Forte | Evidência | Impacto Positivo |
|---|------------|-----------|-----------------|
| 1 | **HTTP client robusto** | `http.ts`: 736 linhas, refresh dedup, 401 retry, tenant sync | Base confiável para migração completa ao backend real |
| 2 | **Type system rico e coeso** | 8 módulos, 320+ interfaces, tipos discriminados (union types) | Segurança em tempo de compilação, autocomplete, documentação viva |
| 3 | **CI com 3 pipelines** | `e2e-headless.yml`, `coverage-core.yml`, `lighthouse.yml` | Regressões detectadas antes do merge; accessibility enforced |
| 4 | **Documentação extensa** | 45+ docs, PRD detalhado, API audit, business rules, RSC patterns | Onboarding facilitado; decisões rastreáveis |
| 5 | **Separação de responsabilidades** | `api/` (43 módulos), `types/` (8 módulos), `components/` (110), route groups isolados | Manutenção por domínio; mudanças localizadas |
| 6 | **ESLint boundaries** | Proíbe mock em produção, restringe localStorage | Impede regressão arquitetural por descuido |
| 7 | **Multi-tenancy consistente** | Session, access gate, tenant eligibility, impersonation, X-Context-Id | Fundação sólida para operação de rede |
| 8 | **Task Master integrado** | 202 tasks, PRD parseado, pipeline progressivo | Rastreabilidade de backlog; automação possível |
| 9 | **Storefront como RSC** | `serverFetch`, SEO metadata, revalidation, streaming | Performance e SEO corretos para página pública |
| 10 | **Hydration safety guidelines** | `AGENTS.md` com checklist detalhado anti-hydration mismatch | Previne classe inteira de bugs difíceis de diagnosticar |

---

## 6. Pontos Fracos

| # | Ponto Fraco | Evidência | Impacto Negativo | Urgência |
|---|------------|-----------|-----------------|----------|
| 1 | **65 ops sem tenantId** | `API_CLIENT_AUDIT.md`: "65 operations missing tenantId propagation" | Vazamento de dados entre tenants em produção | **P0** |
| 2 | **Dois fluxos de contratação** | `/matriculas` lista vendas com item PLANO; `/vendas/nova` não cria matrícula; conversão de prospect cria matrícula direto | Fonte dupla de verdade para contratos; financeiro inconsistente | **P0** |
| 3 | **Session em localStorage** | 18 chaves `academia-auth-*` em localStorage, sem cookie httpOnly | JWT exposto a XSS; incompatível com SSR puro | **P0** |
| 4 | **Sem middleware Next.js** | Nenhum `src/middleware.ts` em produção | Flash de conteúdo, rotas desprotegidas no server, SEO de páginas auth | **P1** |
| 5 | **Sem observabilidade** | `logger.ts` → `console.*` apenas | Zero visibilidade em produção; debugging por reprodução manual | **P1** |
| 6 | **Testes de componente quase inexistentes** | 2 testes em `tests/components/`; 110 componentes | Regressão visual/funcional não detectada | **P1** |
| 7 | **Prospect progression inconsistente** | PRD documenta divergência entre list, modal, kanban e conversão | UX confusa; dados de pipeline CRM não confiáveis | **P1** |
| 8 | **Páginas de conta sem persistência** | `src/app/(app)/conta/*` — botões salvar sem backend | Expectativa falsa do usuário; experiência quebrada | **P2** |
| 9 | **alert/confirm/prompt nativos** | PRD: "recurring use of alert, confirm, prompt in critical flows" | UX pobre, impossível automatizar em testes | **P2** |
| 10 | **knip reports na raiz** | 4 arquivos `knip-report*.txt` commitados (38KB) | Poluição do repositório; artefatos de build no source | **P3** |

---

## 7. Débitos Técnicos

| Categoria | Débito | Evidência | Impacto | Esforço | Prioridade |
|-----------|--------|-----------|---------|---------|-----------|
| **Segurança** | TenantId não propagado em 65 operações | `API_CLIENT_AUDIT.md` | Vazamento de dados entre tenants | Médio | **P0** |
| **Segurança** | JWT em localStorage sem cookie httpOnly | `session.ts`: 18 chaves `academia-auth-*` | XSS pode roubar token de sessão | Alto | **P0** |
| **Arquitetura** | Dois fluxos de contratação (matrícula vs. venda) | `/matriculas` vs `/vendas/nova` vs prospect converter | Inconsistência de dados financeiros e de status | Alto | **P0** |
| **Arquitetura** | Ausência de middleware Next.js | Sem `src/middleware.ts` | Rotas desprotegidas server-side, flash de conteúdo | Médio | **P1** |
| **Código** | Prospect state machine divergente | PRD seção "Gaps": 4 superfícies com regras diferentes | Pipeline CRM não confiável | Médio | **P1** |
| **Observabilidade** | Logger apenas console.* | `logger.ts`: 44 linhas, sem integração externa | Zero visibilidade em produção | Médio | **P1** |
| **Testes** | 2/110 componentes testados | `tests/components/` tem apenas 2 arquivos | Regressões visuais/funcionais silenciosas | Alto | **P1** |
| **Testes** | Sem cobertura para vendas, pagamentos, financeiro, catraca | Coverage governance: "No coverage for sales, payments..." | Fluxos críticos de receita sem rede de segurança | Alto | **P1** |
| **Código** | Páginas de conta sem persistência | `src/app/(app)/conta/` — 6 páginas com save buttons inativos | UX quebrada, expectativa falsa | Baixo | **P2** |
| **Código** | alert/confirm/prompt nativos | PRD documenta uso recorrente | UX pobre, intestável por automação | Médio | **P2** |
| **Banco de dados** | Sem migrations no frontend (esperado) | N/A — backend Java controla schema | N/A | N/A | N/A |
| **CI/CD** | Sem deploy automático no pipeline | `gcp-deploy.sh` é manual; nenhum workflow de deploy em `.github/workflows/` | Deploy manual = risco de erro, sem rollback automático | Médio | **P2** |
| **Documentação** | Artefatos de análise commitados na raiz | `knip-report*.txt` (4 arquivos, 38KB) | Poluição do repo | Baixo | **P3** |
| **Infraestrutura** | `BACKEND_PROXY_TARGET=PENDENTE` no deploy | `gcp-deploy.sh` linha 43 | Deploy exige intervenção manual pós-deploy | Baixo | **P2** |
| **Produto** | Reserva de aulas não implementada | Tipos `ReservaAula`, `AulaSessao` existem em `plano.ts`; nenhuma página de reserva | Feature crítica para competitividade ausente | Alto | **P1** |
| **Produto** | Portal do aluno inexistente | Apenas `conta/` sem persistência | Sem self-service; dependência total da recepção | Alto | **P1** |

---

## 8. Riscos Principais

### Risco de Segurança (Crítico)
**Vazamento de dados multi-tenant.** 65 operações de API não propagam `tenantId` apesar do backend exigir via `TenantIdQuery`. Se o backend não rejeitar chamadas sem tenant (e o HTTP client não injeta automaticamente), dados de um tenant podem ser expostos a outro. Combinado com JWT em localStorage vulnerável a XSS, este é o risco mais grave.

### Risco de Produto (Alto)
**Desalinhamento competitivo.** O sistema não entrega reserva de aulas, portal do aluno, cobrança automatizada e CRM com canais reais — features que são table stakes no mercado de gestão de academias. Cada mês sem essas features é um mês que concorrentes consolidam market share.

### Risco Técnico (Alto)
**Dualidade de fluxos comerciais.** A coexistência de matrícula direta + venda como caminhos separados para contratação de plano cria inconsistência de dados que se propaga para financeiro (pagamentos, recebíveis, DRE). Corrigir depois de acumular dados reais em produção será significativamente mais caro.

### Risco Operacional (Médio)
**Zero observabilidade em produção.** Sem métricas, alertas ou tracing. Incidentes serão descobertos pelo usuário reportando, não por monitoramento. Tempo de resposta a incidentes será alto.

### Risco de Escala (Médio)
**Session em localStorage.** Não escala para SSR puro, não funciona em service workers, não é seguro. A migração para cookie httpOnly + middleware afetará toda a arquitetura de autenticação.

### Risco de Manutenção (Médio)
**110 componentes com 2 testes.** Qualquer refatoração de componente compartilhado (`paginated-table`, `status-badge`, `masked-input`) pode quebrar N páginas silenciosamente.

---

## 9. O que Fazer Agora

### Imediatas (esta sprint)

1. **Auditar e corrigir propagação de tenantId** nas 65 operações identificadas. O `API_CLIENT_AUDIT.md` já lista os hotspots: `administrativo.ts` (25 ops), `comercial-catalogo.ts` (17 ops), `beneficios.ts` (10 ops). Considerar injeção automática no HTTP client (`http.ts`) para rotas context-scoped.

2. **Migrar JWT para cookie httpOnly** em pelo menos o access token. O `serverFetch` já lê de cookie `academia-access-token` — padronizar isso como fonte de verdade, com localStorage como cache client-side.

3. **Remover artefatos commitados** (`knip-report*.txt`, `bundle-size-baseline.txt`) e adicionar ao `.gitignore`.

### Curto prazo (2-4 semanas)

4. **Unificar fluxo de contratação.** Definir modelo canônico: `cliente → plano → contrato/venda → recebível → pagamento`. Eliminar `/matriculas` como jornada separada; convergir prospect conversion + `/vendas/nova` para fluxo único.

5. **Implementar `middleware.ts`** para: redirect de rotas protegidas sem token, resolução de tenant/subdomain, proteção contra acesso não autorizado antes do render.

6. **Consolidar state machine de prospect** em contrato único, compartilhado entre list, modal, kanban e conversão. Usar types discriminados já existentes em `prospect.ts`.

### Médio prazo (4-8 semanas)

7. **Implementar reserva de aulas** — os tipos já existem (`ReservaAula`, `AulaSessao`, `AulaOcupacao` em `plano.ts`). Falta a jornada do aluno + backoffice de ocupação.

8. **Integrar observabilidade** — pelo menos Sentry para error tracking. O `logger.ts` já abstrai a emissão; basta adicionar transport.

9. **Expandir testes de componente** para os 10 componentes mais reutilizados (`paginated-table`, `status-badge`, `masked-input`, `plano-selector-card`, `atividade-modal`, etc.).

10. **Criar pipeline de deploy automático** no GitHub Actions (build → push image → deploy Cloud Run → smoke test).

---

## 10. Roadmap Sugerido

### 0-30 dias: Estabilização e Segurança

| Ação | Tipo | Impacto |
|------|------|---------|
| Corrigir propagação de tenantId (65 ops) | Segurança | Elimina risco de vazamento multi-tenant |
| Migrar JWT para cookie httpOnly | Segurança | Mitiga XSS |
| Criar `middleware.ts` (auth + tenant) | Arquitetura | Protege rotas server-side |
| Unificar fluxo de contratação | Produto/Arq | Remove fonte dupla de verdade |
| Consolidar prospect state machine | Produto | CRM confiável |
| Remover artefatos do repo | Higiene | Repo limpo |

### 31-60 dias: Features Competitivas

| Ação | Tipo | Impacto |
|------|------|---------|
| Implementar reserva de aulas + lista de espera | Produto | Feature mais pedida pelo mercado |
| Operacionalizar pages de conta do aluno | Produto | Self-service básico |
| Integrar Sentry/observabilidade | Operação | Visibilidade em produção |
| Testes de componentes (top 10) | Qualidade | Rede de segurança para refatorações |
| Pipeline de deploy automático | CI/CD | Reduz risco operacional |

### 61-90 dias: Profundidade e Escala

| Ação | Tipo | Impacto |
|------|------|---------|
| CRM com canais reais (WhatsApp/email) | Produto | Automação comercial operacional |
| Cobrança recorrente + playbook de inadimplência | Produto | Recuperação de receita |
| BI consolidado por unidade/rede | Produto | Visão gerencial |
| Contrato digital com e-assinatura | Produto | Diferencial competitivo |
| Expandir E2E para vendas, pagamentos, financeiro | Qualidade | Cobertura de fluxos de receita |

---

## 11. Conclusão Final

### Base: **Boa, com ressalvas de segurança**
A arquitetura é bem organizada (route groups, API layer separada, type system rico, CI com 3 pipelines). O HTTP client é maduro. A documentação é extensa e rara para o estágio do projeto. A base permite evolução rápida — mas a falha de propagação de tenantId e JWT em localStorage são problemas graves que precisam ser resolvidos antes de qualquer operação com dados reais de clientes.

### Aderência ao mercado: **Precisa de features competitivas, não de reposicionamento**
O posicionamento (gestão de academias multi-tenant) está correto. O problema não é foco, é profundidade. Faltam 3-4 features que o mercado considera obrigatórias: reserva de aulas, portal do aluno, cobrança automatizada, CRM com canais reais.

### Maior gargalo: **Arquitetura (dualidade de fluxos) + Produto (features ausentes)**
Não é falta de código — são 101K linhas de source e 96+ páginas. O gargalo é que os fluxos comerciais/financeiros têm dois caminhos divergentes, e as features mais impactantes para o mercado (reservas, portal do aluno) ainda não existem. Resolver a dualidade é pré-requisito para features financeiras confiáveis.

### Direção recomendada:
1. **Próximas 2 semanas:** Segurança (tenantId + cookie httpOnly + middleware)
2. **Próximas 4 semanas:** Convergência (fluxo único de contratação + prospect state machine)
3. **Próximas 8 semanas:** Competitividade (reserva de aulas + portal do aluno + observabilidade)
4. **Próximos 12 semanas:** Diferenciação (CRM real + cobrança automatizada + BI de rede)

---

## Notas de 0 a 10

| Dimensão | Nota | Justificativa |
|----------|------|---------------|
| **Clareza do produto** | **7** | O PRD é detalhado e o sistema tem propósito claro. A dualidade matrícula/venda e as 6 páginas de conta sem persistência indicam indefinição em áreas específicas, mas o posicionamento geral é coerente. |
| **Aderência ao mercado** | **5** | Resolve dor real, mas falta features que concorrentes já entregam (reservas, portal aluno, cobrança automática, CRM com canais). Para uma academia real escolher este sistema hoje, precisaria aceitar operar sem self-service e sem automação comercial. |
| **Qualidade arquitetural** | **7** | Route groups, API layer separada, tipos por domínio, ESLint boundaries, HTTP client robusto. Penalizado pela ausência de middleware, session em localStorage, e dualidade de fluxo comercial. A fundação é boa — os problemas são corrigíveis sem reescrever. |
| **Qualidade do código** | **7** | Tipos ricos, hooks de workspace, separação de componentes, RSC pattern documentado. Penalizado por alert/confirm nativos, páginas sem persistência, e inconsistência na state machine de prospect. Código legível e bem organizado no geral. |
| **Testabilidade** | **6** | 102 test files, 27.8K linhas de teste, coverage gate em CI. Forte em `src/lib` (62.74%). Fraco em componentes (2/110 testados) e em fluxos de negócio críticos (vendas, pagamentos, financeiro). O smoke E2E cobre 8 cenários mas não é suficiente para os 96+ pages. |
| **Escalabilidade** | **5** | Multi-tenancy bem desenhada. Mas: 65 ops sem tenantId = risco de vazamento em escala; session em localStorage não escala para SSR/edge; sem cache layer (Redis configurado no `.env.example` mas não utilizado); sem rate limiting ou circuit breaker. |
| **Segurança** | **4** | CSP headers e HSTS presentes. Mas: JWT em localStorage (XSS risk), 65 ops sem tenant isolation, sem middleware de auth server-side, sem rate limiting. A segurança de headers é boa; a segurança de dados e sessão é insuficiente para produção com dados reais. |
| **Operabilidade** | **3** | Zero observabilidade real (logger → console.*). Deploy manual via script. Sem health checks, sem alertas, sem métricas, sem dashboards de infraestrutura. Em produção, incidentes seriam descobertos pelo usuário, não pelo sistema. |
| **Velocidade de evolução** | **7** | Task Master com 202 tasks, PRD parseado, automação progressiva. 3 pipelines de CI. 45+ docs. ESLint boundaries protegem contra regressão. A dualidade de fluxos e a falta de testes de componente são os maiores freios — mas a base permite iteração rápida em domínios já conectados. |
| **Saúde geral do projeto** | **6** | Projeto com base técnica acima da média para o estágio, documentação incomumente boa, e backlog organizado. Os problemas de segurança (tenantId, JWT) e a dualidade arquitetural são sérios mas corrigíveis em 4-6 semanas. A lacuna de features competitivas é o maior risco de médio prazo. Não precisa de reescrita — precisa de foco em estabilização + 3-4 features de alto impacto. |

---

## Apêndice: Escopo da Análise

**O que foi analisado:** Código-fonte completo (101K linhas), 45+ documentos, package.json, CI/CD workflows, Dockerfile, scripts, configuração ESLint/Next.js/Vitest/Playwright, PRD, business rules, API audit, coverage reports, task state (202 tasks), git history (30 commits recentes), type system completo (320+ interfaces).

**O que não foi possível analisar:** Backend Java (externo ao repo), banco de dados/migrations, métricas de uso real (sem telemetria), dados de produção, performance real (sem acesso ao deploy), infraestrutura GCP (apenas script de deploy), integrações externas em runtime (EVO, NFSe, catracas).

**Conclusões fortes:** Arquitetura, type system, CI/CD, documentação, pontos de segurança (tenantId, JWT), dualidade de fluxos.

**Conclusões que são hipótese:** Aderência ao mercado (baseada em inferência de concorrentes, sem dados de usuários reais), performance em produção (sem métricas), impacto real da falta de tenantId (depende de como o backend trata chamadas sem tenant).

---

*Análise realizada em 2026-03-28.*
