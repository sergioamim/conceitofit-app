# Observability Suite — PRD

> **Product Requirements Document**
> Suite completa de observabilidade (métricas, logs, traces, alerting) para o produto Academia (backend Java + frontend Next.js)

| Metadata | Valor |
|---|---|
| **Autor** | Morgan (PM) |
| **Data** | 2026-04-10 |
| **Versão** | **2.0** (pós Wave -1, Wave 0 e Wave 0.5 executadas) |
| **Status** | **In Progress** — waves -1, 0 e 0.5 entregues; próximas waves documentadas |
| **Tipo** | Brownfield / Cross-cutting |
| **Stakeholders** | Sergio (founder + dev + devops + ops — equipe única) |
| **Ambiente alvo** | **Pre-Prod / Homologação** (produção real virá em VPS separada no futuro) |
| **Epic relacionado** | EPIC-OBS — Observability Suite |

## Changelog

- **v2.0 (2026-04-10 — após sessão de execução):**
  - **Wave -1 (Audit + Fix Fundacional)** executada e validada: 5 bugs críticos descobertos e corrigidos (mount paths broken no compose, datasource sem UID, Spring Security bloqueando `/actuator/prometheus`, `WhatsAppHealthIndicator` NPE, Caddy over-blocking).
  - **Wave 0 (Telegram + Exporters)** executada e validada: 3 exporters rodando (node-exporter, cAdvisor, postgres-exporter), contact points Telegram provisionados, notification policies por severity, primeiro alerta real (`http-error-rate`) disparando no Telegram.
  - **Wave 0.5 (GHCR Pipeline)** executada e validada: backend e frontend publicados em `ghcr.io/sergioamim/*`, deploy via pull+force-recreate em ~3min (vs ~8min anteriores), rollback via tag disponível.
  - **Grafana upgrade 10.4.1 → 12.4.2** executado: env var interpolation nativo em alerting, plugins monitoring pre-installed (pyroscope, exploretraces, metricsdrilldown, lokiexplore), API redaction de tokens.
  - **Frontend unhealthy fix**: Dockerfile + compose healthcheck trocado de `localhost:8080` → `127.0.0.1:3000` (IPv6 vs IPv4 + port mismatch). Container agora healthy.
  - **Volumes antigos `conceito-fit_*`** removidos (orphaned por inconsistência de volume names). Volumes atuais são `conceito-prod-*`.
  - **Wave 3 (customer-facing multi-tenant)** continua deferred para pós-produção.
  - **Waves ajustadas:** Wave 1 agora é Loki (logs), Wave 2 infra dashboards, Wave 3 Tempo migration, Wave 4 frontend observability (Sentry DSN), Wave 5 business metrics expansion.

- **v1.1 (2026-04-10):** Calibrado para VPS 8GB RAM compartilhada, ambiente pre-prod, equipe de 1 pessoa. Tempo (tracing) movido para Wave 4. Wave 3 deferred para pós-produção. Scrape interval 30s. Retenção inicial 30d.
- **v1.0 (2026-04-10):** Draft inicial com 4 waves.

## ✅ Estado Atual (v2.0)

```
═══════════════════════════════════════════════════════════════
 PIPELINE DE OBSERVABILITY — FUNCIONAL END-TO-END
═══════════════════════════════════════════════════════════════

 PROMETHEUS (v2.51.0) — 5 targets UP
  ✅ academia-java        (Spring Boot Actuator)
  ✅ prometheus           (self-monitoring)
  ✅ node-exporter        (VPS host metrics)
  ✅ cadvisor             (Docker container metrics)
  ✅ postgres-exporter    (PostgreSQL metrics)
  → 1057+ metric series coletadas, retention 30d

 GRAFANA (v12.4.2 — upgraded from 10.4.1)
  ✅ Prometheus datasource (uid: prometheus)
  ✅ 7 dashboards provisionados
  ✅ 7 alerting rules provisionados
  ✅ 2 contact points Telegram (critical + warning)
  ✅ Notification policies com routing por severity label
  ✅ Plugins: pyroscope, exploretraces, metricsdrilldown, lokiexplore

 DEPLOY PIPELINE (Wave 0.5 — GHCR)
  ✅ ghcr.io/sergioamim/conceito-backend:latest
  ✅ ghcr.io/sergioamim/conceito-frontend:latest
  ✅ deploy-ghcr.sh: build+push local + pull+recreate remoto
  ✅ Tempo de deploy reduzido de ~8min para ~3min
  ✅ Rollback instantâneo via tag version

 CONTAINERS (12 rodando na VPS 8GB)
  backend     (healthy)   863 MiB  ghcr.io image
  frontend    (healthy)    83 MiB  ghcr.io image
  db          (healthy)    41 MiB  postgres:16-alpine
  minio       (healthy)    85 MiB
  caddy       (running)    13 MiB  TLS + reverse proxy
  grafana     (running)    50 MiB  v12.4.2
  prometheus  (running)    72 MiB  30d retention
  jaeger      (running)     9 MiB  (será migrado para Tempo)
  node-exp    (running)     8 MiB
  cadvisor    (running)    23 MiB
  postgres-exp(running)    12 MiB
  backup      (running)    <1 MiB  cron postgres dump

 RESOURCE USAGE: ~1.3 GB / 8 GB (16%)
 LIVRE: ~6.7 GB para próximas waves
═══════════════════════════════════════════════════════════════
```

## ⚡ Infraestrutura Pré-Existente Descoberta

Antes de ler o resto do PRD, contexto crítico: **o projeto já tem muito mais observabilidade do que parecia**. Inventário confirmado via inspeção do código:

| Componente | Arquivo/Path | Estado |
|---|---|---|
| Caddy reverse proxy + Let's Encrypt | `academia-java/deploy/Caddyfile` | ✅ `grafana.conceito.fit` configurado |
| Docker Compose completo | `academia-java/deploy/docker-compose.prod.yml` | ✅ 10 services (caddy, frontend, backend, db, minio+setup, jaeger, prometheus, grafana, backup) |
| Prometheus v2.51.0 | `infra/prometheus/prometheus.yml` | ✅ Rodando, retenção 30d, ⚠️ scrape target pode estar quebrado (`app:8080` vs `backend:8080`) |
| Grafana 10.4.1 | `infra/grafana/provisioning/` | ✅ Provisioned |
| Jaeger all-in-one 1.56 | docker-compose service | ✅ Recebe OTLP do Java (10% sampling) — **migrando para Tempo** |
| Backend Java — Actuator + Micrometer + OTel | `modulo-app/pom.xml` + `application.yml` | ✅ `/actuator/prometheus` exposto, OTLP exporter configurado |
| 7 Dashboards provisionados | `infra/grafana/dashboards/*.json` | ✅ business-kpi, jvm-infra, hikaricp-pool, pagamentos, dunning, catraca, operacional |
| 7 Alerting rules | `infra/grafana/provisioning/alerting/alerts.yml` | ✅ Regras existem, ❌ sem contact point = disparam no vácuo |
| Métricas custom de negócio | Emitidas pelo backend | ✅ `business_financial_overdue`, `business_students_active`, `business_financial_monthly_revenue` |
| Sentry SDK Next.js | `@sentry/nextjs ^10.46.0` + `sentry.*.config.ts` + `src/lib/shared/sentry.ts` | ✅ Código completo, `withSentryConfig` wrapper, tunnelRoute, CSP whitelisted — ❌ DSN vazio = inativo |
| MinIO S3 storage | docker-compose service | ✅ Rodando, **reaproveitado como backend do Tempo** |

**Implicação:** o plano colapsou de "criar suite de observabilidade" para **"audit + fix + completar gaps específicos"**. Esforço estimado caiu de ~6 sprints para **~2 sprints**.

---

## 1. Contexto e Problema

### 1.1 Situação Atual

O produto Academia está em fase de **integração FE↔BE intensa** (30% cobertura BE segundo última auditoria — ver `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`) com 755 endpoints OpenAPI mapeados no backend Java Spring Boot 3.2.5 e 55+ API clients no frontend Next.js 16.

A VPS de produção roda:
- **Backend Java** (Spring Boot, multi-módulo Maven: auth, financeiro, pagamentos, notificações, catraca, agregadores, app)
- **Frontend Next.js 16**
- **Postgres** (multi-tenant com tenantId default `550e8400-e29b-41d4-a716-446655440000`)
- **Grafana + Prometheus** (já instalados via docker-compose, **subutilizados**)
- Demais serviços de suporte

### 1.2 Problema

**A plataforma opera hoje em modo "cego reativo":**

1. **Sem visibilidade proativa:** problemas só são descobertos quando o usuário reclama
2. **Sem alerting:** nenhum canal automatizado de notificação de incidentes
3. **Logs dispersos:** necessidade de SSH + grep manual nos containers para debugar
4. **Métricas de negócio inexistentes:** MRR, churn, inadimplência, conversão — tudo requer query SQL ad-hoc
5. **Sem ferramenta de validação dos módulos "fantasma":** billing, financial, whatsapp, reservas, crm-cadencias — marcados como clients sem cobertura BE real; um dashboard financeiro serviria como **ferramenta de validação automática** de que esses módulos funcionam
6. **Frontend sem RUM:** Core Web Vitals, erros JavaScript em produção, páginas lentas — invisíveis
7. **Sem correlação FE↔BE↔DB:** latência suspeita hoje exige triangulação manual

### 1.3 Urgência (Por Que Agora?)

- O projeto avança para fase de onboarding de clientes reais → **incidentes ficam públicos**
- Módulos financeiros entrando em produção → **risco de receita** sem visibilidade
- Complexidade técnica crescente → tempo de debugging aumenta **não-linearmente** sem observabilidade

---

## 2. Descobertas Iniciais (Current State Analysis)

Auditoria técnica revelou que **o projeto está mais preparado do que parecia**:

### 2.1 Backend Java — instrumentação parcial existente ✅

| Componente | Status | Detalhes |
|---|---|---|
| `spring-boot-starter-actuator` | ✅ Presente | Em todos os módulos (auth, financeiro, pagamentos, notificações, catraca, agregadores, app) |
| `micrometer-registry-prometheus` | ✅ Presente | `modulo-app/pom.xml` |
| `opentelemetry-exporter-otlp` | ✅ Presente | `modulo-app/pom.xml` — traces OTLP prontos |
| `/actuator/prometheus` endpoint | ✅ Exposto | `application.yml` + `application-prod.yml` (`include: health,info,prometheus,metrics`) |
| OpenTelemetry BOM | ✅ Declarado | `pom.xml` root |

**Implicação:** Wave 0 do backend está ~80% pronta. Falta apenas:
- Prometheus fazer scrape do endpoint
- Custom metrics de negócio (Micrometer counters/timers em eventos de pagamento, cadastro, check-in)
- Emissor OTLP configurado se quisermos tracing

### 2.2 Frontend Next.js — sem instrumentação ❌

- Sem OpenTelemetry SDK
- Sem Grafana Faro (RUM)
- Sem reporter de Core Web Vitals
- Sem captura de erros JS em produção

**Implicação:** Wave 0 do frontend requer trabalho do zero.

### 2.3 Infraestrutura — parcialmente pronta ⚠️

| Componente | Status |
|---|---|
| Grafana | ✅ Instalado na VPS |
| Prometheus | ✅ Instalado na VPS |
| Loki | ❌ Ausente |
| Tempo (tracing backend) | ❌ Ausente |
| Promtail / Grafana Alloy | ❌ Ausente |
| node_exporter | ❓ Desconhecido — a verificar |
| cAdvisor | ❓ Desconhecido — a verificar |
| postgres_exporter | ❓ Desconhecido — a verificar |
| Alerting configurado | ❌ Ausente |
| Contact point Telegram | ❌ Ausente |

### 2.4 Banco de Dados

- Postgres gerenciado (suspeita de Neon baseado em memórias do projeto — **a confirmar**)
- Multi-tenant por `tenantId`
- Sem exporter de métricas configurado

---

## 3. Goals & Non-Goals

### 3.1 Goals

#### Goal 1 — Visibilidade Técnica Proativa
Operador (founder + devs) sabe o estado da plataforma em **menos de 10 segundos** após abrir o Grafana, e é **notificado no Telegram** antes dos usuários perceberem problemas críticos.

#### Goal 2 — Visibilidade de Negócio
Founder tem acesso a MRR, ARR, churn, inadimplência, top tenants e métricas operacionais agregadas em dashboards atualizados em **tempo real ou near-real-time** (< 1 minuto de latência).

#### Goal 3 — Debugging Acelerado
Tempo médio para identificar causa raiz de um incidente cai de **"horas de grep"** para **"minutos via deep-link dashboard→logs"**.

#### Goal 4 — Validação Automática de Módulos "Fantasma"
Dashboards financeiros e operacionais atuam como **ferramentas contínuas de validação** dos módulos billing, financial, whatsapp, reservas e crm-cadencias. Métricas zeradas ou anômalas indicam bug/desconexão FE↔BE.

#### Goal 5 — Base para Self-Service do Cliente
Donos de academia têm acesso a dashboards embedados **filtrados pelo seu tenantId**, agregando valor ao produto e reduzindo suporte reativo.

### 3.2 Non-Goals

- **NÃO** construir sistema de observabilidade proprietário (tudo via Grafana stack open-source)
- **NÃO** implementar APM comercial (Datadog, New Relic)
- **NÃO** cobrir ambiente de desenvolvimento/staging no MVP (produção primeiro)
- **NÃO** substituir logs estruturados (logs continuam em stdout dos containers, Loki apenas agrega)
- **NÃO** entregar machine learning / anomaly detection avançado no MVP (Grafana Alerting simples basta)
- **NÃO** migrar Postgres para solução auto-hospedada só por observabilidade

---

## 4. Stakeholders e Audiências

| Audiência | Papel | Dashboards Consumidos | Cadência |
|---|---|---|---|
| **Founder (Sergio)** | Decisor estratégico | Business Overview, Financial Health | Diário |
| **Ops / Dev (Sergio + futuros devs)** | Operação da plataforma | SRE/Technical, Logs exploration | Real-time + alertas |
| **Dono de Academia (cliente final)** | Usuário multi-tenant | Academia Dashboard (embedado, filtrado) | Sob demanda |
| **Suporte (futuro)** | Atendimento a cliente | Academia Dashboard + logs por tenant | Sob demanda |

---

## 5. Arquitetura Proposta

### 5.1 Stack Tecnológica (MVP — calibrada para 8GB VPS)

```
┌────────────────────────────────────────────────────────────┐
│                      Grafana (UI + Alerting)               │
│  Dashboards (provisioned via YAML) + Unified Alerting      │
└─────────┬──────────────┬───────────────────────────────────┘
          │              │
    ┌─────▼─────┐  ┌─────▼─────┐    ┌──────────────────┐
    │Prometheus │  │   Loki    │    │  Tempo (Wave 4)  │
    │ (metrics) │  │  (logs)   │    │    DEFERRED      │
    │  30d ret. │  │  14d ret. │    │  (RAM budget)    │
    │  15s eval │  │           │    └──────────────────┘
    │  30s scrape│  │           │
    └─────┬─────┘  └─────┬─────┘
          │              │
    ┌─────┴──────────────┴──────────────────────┐
    │         Grafana Alloy (coletor único)      │
    └─────┬──────────────────────────────────┬──┘
          │                                  │
    ┌─────▼──────┐  ┌─────────┐  ┌──────────▼─────┐
    │  Exporters │  │ Java BE │  │ Next.js FE      │
    │            │  │/actuator│  │ (Faro = Wave 2) │
    │ • node_exp │  │/prometh │  │ Web Vitals +    │
    │ • cAdvisor │  │  eus    │  │ JS errors       │
    │ • postgres │  │(already │  │                 │
    │            │  │ ready!) │  │                 │
    └────────────┘  └─────────┘  └─────────────────┘
          │
          ▼
    Telegram Bot (3 canais)
    • AcademiaAlerts-Critical (P0 — raros)
    • AcademiaAlerts-Warning  (P1 — principal)
    • AcademiaAlerts-Info     (P2 — aprendizado)
    + Email fallback para P0
```

### 5.1.1 Orçamento de Recursos (realista)

**VPS disponível: 8GB RAM total, compartilhada com app.**

| Serviço | RAM estimada | CPU | Disco (30d) |
|---|---|---|---|
| Prometheus | 500 MB – 1 GB | Baixa | ~5–15 GB |
| Loki | 300 – 500 MB | Baixa | ~10–30 GB |
| Grafana | 150 – 300 MB | Negligível | < 1 GB |
| Grafana Alloy | 100 – 200 MB | Baixa | N/A |
| node_exporter | 20 – 50 MB | Negligível | N/A |
| cAdvisor | 100 – 200 MB | Baixa-média | N/A |
| postgres_exporter | 30 – 50 MB | Negligível | N/A |
| **TOTAL** | **~1.2 – 2.3 GB** | **< 10% CPU** | **~20–50 GB** |

**Alarmes de tuning** (se exceder):
- Reduzir scrape interval para 60s
- Reduzir retenção de logs para 7d
- Dropar labels de alta cardinalidade
- Escalar VPS (último recurso)

### 5.2 Justificativas Arquiteturais

| Decisão | Alternativa Considerada | Razão da Escolha |
|---|---|---|
| **Loki** para logs | ELK / Graylog | Integração nativa com Grafana, baixo custo de disco (indexa só labels), stack unificado |
| **Grafana Alloy** | Promtail + OTel Collector separados | Alloy é o sucessor oficial (dez/2024), unifica coleta de logs/métricas/traces em um único binário |
| **Tempo DEFERRED para Wave 4** | Incluir no MVP | Orçamento de RAM (8GB total) não acomoda com folga; Java já tem `opentelemetry-exporter-otlp` pronto, então ativação futura é trivial |
| **Telegram** para alertas | Slack / PagerDuty / Discord | Sem custo, já familiar ao usuário, contact point nativo no Grafana, push no celular instantâneo |
| **Dashboards provisionados via YAML** | Dashboards editados na UI | Versionamento Git, reprodutibilidade, revisão via PR |
| **Postgres data source direto** (p/ métricas de negócio) | Export via Prometheus counters | Mais simples para queries agregadas complexas (MRR, churn); contadores Prom são usados para eventos em tempo real |
| **Grafana Faro** para RUM | Sentry / LogRocket | Open-source, stack unificado Grafana, sem vendor lock-in |

### 5.3 Estratégia Multi-Tenant

**Princípio:** Todos os dashboards de negócio/operacional aceitam variable `tenantId` no Grafana.

- **Internamente (founder/ops):** visão agregada (sem filtro) + drill-down por tenant via dropdown
- **Externamente (dono de academia):** dashboards embedados com `tenantId` **forçado via auth proxy** (ex.: nginx + header injection, ou Grafana API keys + JWT com claim de tenant)

**Implementação do auth proxy**: decisão deferida para Wave 3 (após validar as waves 1 e 2).

---

## 6. Escopo por Waves (Milestones)

### Estado pós-execução (v2.0)

| Wave | Nome | Status | Descrição |
|---|---|---|---|
| **Wave -1** | Audit + Fix Fundacional | ✅ **Entregue** | 5 bugs críticos corrigidos, pipeline end-to-end funcional |
| **Wave 0** | Telegram + Exporters | ✅ **Entregue** | node-exporter, cAdvisor, postgres-exporter rodando, Telegram alerting validado |
| **Wave 0.5** | GHCR Deploy Pipeline | ✅ **Entregue** | Build+push local, pull+recreate na VPS, deploy 3x mais rápido |
| **Wave 0.7** | Grafana Upgrade 10 → 12 | ✅ **Entregue** | Env var interpolation nativo, plugins pre-installed |
| **Wave 1** | Loki + Logs Aggregation | ⏭ Próxima | Loki + Grafana Alloy, deep-link métrica ↔ log |
| **Wave 2** | Infra Dashboards | Pendente | Dashboards VPS/containers/DB (baseados nos exporters) |
| **Wave 3** | Jaeger → Tempo Migration | Pendente | Tempo com MinIO backend, exemplars, TraceQL |
| **Wave 4** | Frontend Observability | Pendente | Ativar Sentry (DSN), Web Vitals, RUM |
| **Wave 5** | Business Metrics Expansion | Pendente | MRR, ARR, churn, NRR no dashboard business-kpi |
| **Wave 6** | Multi-tenant Customer-Facing | **DEFERRED** | Só faz sentido pós-produção real |

### Wave -1 — Audit + Fix Fundacional (✅ ENTREGUE)

**Objetivo:** Confrontar o estado real do ambiente vs o acreditado. Corrigir bugs que impediam o pipeline de funcionar.

**Descobertas e fixes:**

1. **Deploy drift silencioso** — O `deploy.sh` nunca sincronizava a pasta `infra/` para a VPS. Os arquivos de provisioning eram enviados **manualmente por rsync** em momentos passados (evidência: owner `501 staff` nos arquivos do VPS = UID do Mac) e ficavam stale. Além disso, o compose na VPS era uma versão **mais antiga** do que o do repo, sem os volume mounts necessários.
   - **Fix:** sincronizei compose + infra/ manualmente para VPS + force-recreate. Plano para automação: `deploy-ghcr.sh` agora inclui rsync de infra/ + render-provisioning + restart em cada deploy.

2. **Datasource Prometheus sem UID explícito** — Os 7 alerting rules referenciavam `datasourceUid: prometheus` mas o arquivo provisioning do datasource não tinha `uid:` declarado. Grafana gerava UUID aleatório, alerts falhavam com `data source not found`.
   - **Fix:** adicionei `uid: prometheus` em `infra/grafana/provisioning/datasources/prometheus.yml`. Alerts agora acham o datasource.

3. **Spring Security bloqueando `/actuator/prometheus`** — O `ModuleConfig.java` tinha permitAll para `/actuator/health` e `/actuator/info` mas não para `/actuator/prometheus`. Prometheus scrape retornava HTTP 401.
   - **Fix:** adicionei `/actuator/prometheus`, `/actuator/metrics` e `/actuator/metrics/**` ao permitAll.

4. **`WhatsAppHealthIndicator` NPE derrubando `/actuator/health`** — Em ambientes sem credenciais WhatsApp configuradas, passar `LocalDateTime null` para `.withDetail()` lançava NPE, caindo no catch que retornava `Health.down()`. Isso derrubava o status agregado do app (HTTP 503) mesmo com tudo funcionando.
   - **Fix:** null-safe conversion de `lastWebhook` e `earliestExpiry` para string (fallback "never"). `NO_CREDENTIALS` agora retorna `Health.unknown()` (não derruba agregado). Catch final também vira UNKNOWN.

5. **Caddy over-blocking `/actuator/*`** — Primeira tentativa de hardening bloqueou todos os endpoints de actuator externamente, incluindo `/actuator/health` que é usado pelos healthchecks do deploy.sh.
   - **Fix:** matcher com exceção para `/actuator/health`, `/actuator/health/**` e `/actuator/info` (públicos para healthcheck); demais (`/actuator/prometheus`, `/actuator/metrics`) retornam 404 externamente.

6. **Network `internal: true` bloqueando Telegram** — Quando sincronizei o compose do repo para a VPS, trouxe o `internal: true` na network que impedia qualquer container de alcançar a internet. Grafana não conseguia enviar alertas para `api.telegram.org`.
   - **Fix:** removido `internal: true`. Containers agora têm acesso externo quando necessário.

**Entregável:** 5 targets Prometheus UP, 7 dashboards visíveis no Grafana, datasource funcionando, alerts carregados, backend healthy.

### Wave 0 — Telegram + Exporters (✅ ENTREGUE)

**Objetivo:** Fechar o loop de notificação (alertas realmente chegam ao operador) e expandir cobertura de métricas para VPS + containers + DB.

**Entregas:**

**Exporters:**
- `prom/node-exporter:v1.8.1` — métricas da VPS (CPU, memória, disco, rede, load)
- `gcr.io/cadvisor/cadvisor:v0.49.1` — métricas por container Docker (incluindo healthy state)
- `prometheuscommunity/postgres-exporter:v0.15.0` — métricas do PostgreSQL (connections, queries, cache hit, replication, locks, size)
- `prometheus.yml` atualizado com 3 novos scrape_configs

**Telegram Alerting:**
- Bot `@CfitAlertingBot` criado e testado
- Contact points `telegram-critical` e `telegram-warning` provisionados via `contact-points.yml`
- Notification policies em `policies.yml` roteando por severity label (critical → telegram-critical, warning → telegram-warning, default → telegram-warning)
- Templates de mensagem com severity, team, summary, description e timestamp
- **Limitação descoberta:** Grafana 10.4.1 não suporta env var interpolation nativa em alerting provisioning (feature só chegou em 11.0+). **Workaround:** `render-provisioning.sh` roda `envsubst` antes do Grafana ler os arquivos.
- **Resolução permanente:** Grafana upgraded para 12.4.2 (Wave 0.7) onde env var interpolation é nativa. Script envsubst fica como fallback.

**Validação:**
- Test alert enviado via API → `status: ok, notified_at: 22:07:40` → mensagem recebida no Telegram ✅
- Primeiro alerta real (`http-error-rate`) observado disparando nos logs após Grafana 12 upgrade

### Wave 0.5 — GHCR Deploy Pipeline (✅ ENTREGUE)

**Objetivo:** Modernizar o pipeline de deploy. Resolver fricção do `deploy.sh` legado (save/load/rsync instável com SSH da Hetzner) e habilitar versionamento + rollback.

**Entregas:**

- `ghcr.io/sergioamim/conceito-backend:latest` — imagem Spring Boot publicada
- `ghcr.io/sergioamim/conceito-frontend:latest` — imagem Next.js publicada
- `docker-compose.prod.yml` atualizado para referenciar `ghcr.io/sergioamim/conceito-*:${BACKEND_TAG:-latest}`
- `deploy-ghcr.sh` novo script (coexistindo com `deploy.sh` legado durante período de validação)
- `render-provisioning.sh` helper para envsubst de templates (fallback pre-Grafana-11)
- Tag versionamento: semver (v1.2.3) ou git-sha (main-abc1234) ou `latest` (dev)

**Pipeline comparison:**

| Fase | Antes (deploy.sh) | Depois (deploy-ghcr.sh) |
|---|---|---|
| Build | Local (Mac) | Local (Mac) |
| Save/Upload | `docker save` → gzip → rsync (176 MB via SSH Hetzner flakey) | `docker push` via HTTPS (só layers modificadas, ~5-20 MB típico) |
| Load/Pull | `docker load` remoto | `docker pull` remoto |
| Versionamento | `latest` hard-coded | Qualquer tag (semver, sha, latest) |
| Rollback | Rebuildar versão antiga | `deploy-ghcr.sh host v1.1 --skip-build` |
| Tempo total | ~8 min | **~3 min** |
| Estabilidade | Frágil (rsync timeouts) | Robusto (HTTPS com retry nativo) |

### Wave 0.7 — Grafana Upgrade 10 → 12 (✅ ENTREGUE)

**Objetivo:** Obter env var interpolation nativa em alerting provisioning + features modernas de observabilidade.

**Mudanças:**
- `grafana/grafana:10.4.1` → `grafana/grafana:12.4.2`
- Upgrade de 2 major versions num único step, validado sem downtime significativo
- Provisioning files (`apiVersion: 1`) mantidos compatíveis — backward compatibility honrada pelo Grafana

**Benefícios obtidos:**
- **Env var interpolation nativa** em alerting provisioning (antes precisava de `envsubst` externo)
- **Plugins monitoring pre-installed**: `grafana-pyroscope-app` (profiling), `grafana-exploretraces-app` (tracing UI), `grafana-metricsdrilldown-app` (metrics exploration), `grafana-lokiexplore-app` (**este será usado na Wave 1**)
- **Security improvement**: API responses agora REDACT tokens sensíveis (antes o `bottoken` vazava em plaintext na resposta de `/api/v1/provisioning/contact-points`)
- **UI improvements**: novo home dashboard, melhorias de performance no painel de alertas

---

### Wave 1 — Fundação (Infra + Instrumentação)

**Objetivo:** Telemetria fluindo ponta-a-ponta. Pré-requisito para tudo.

**Deliverables:**

| ID | Item | Owner | Esforço |
|---|---|---|---|
| W0-01 | Loki + Alloy no docker-compose (VPS) | @devops | S |
| W0-02 | ~~Tempo no docker-compose~~ **DEFERRED para Wave 4** (RAM budget) | — | — |
| W0-03 | node_exporter (VPS metrics) | @devops | XS |
| W0-04 | cAdvisor (Docker containers metrics) | @devops | XS |
| W0-05 | postgres_exporter (DB metrics) | @devops | S |
| W0-06 | Prometheus `scrape_configs` para `/actuator/prometheus` do Java (scrape 30s) | @devops | XS |
| W0-07 | ~~Configurar OTLP exporter Java → Tempo~~ **DEFERRED** (pom já preparado) | — | — |
| W0-08 | Web Vitals + JS error reporting no Next.js (implementação leve, sem Faro backend) | @dev (FE) | S |
| W0-09 | Data sources provisionados: Prometheus, Loki, Postgres | @devops | S |
| W0-10 | Telegram Bot criado + 3 contact points (Critical/Warning/Info) | @devops | XS |
| W0-11 | Estrutura de pastas de dashboards provisionados (`observability/dashboards/`) | @devops | XS |
| W0-12 | Healthcheck externo da stack (cronjob + curl + telegram, meta-monitoring) | @devops | XS |

**Entregável final Wave 0:** Comando "abrir Grafana, ver métricas do Java, ver logs do container no Loki, ver traces no Tempo, receber mensagem no Telegram ao disparar alerta de teste".

**Bloqueios:** Nenhum.

---

### 🌊 Wave 1 — SRE / Technical Health (P0)

**Objetivo:** Parar de ser pego de surpresa por incidentes técnicos.

**Dashboards:**

| ID | Dashboard | Painéis Principais |
|---|---|---|
| D1-01 | **VPS Infrastructure** | CPU, RAM, disk I/O, network, load avg, uptime |
| D1-02 | **Docker Containers** | Status, restarts, CPU/RAM por container, top talkers |
| D1-03 | **Java Backend Performance** | Request rate, error rate, latency (p50/p95/p99), endpoints TOP slow, JVM heap, GC pauses, threads |
| D1-04 | **Postgres Database** | Connections, slow queries, cache hit ratio, deadlocks, replication lag, DB size growth |
| D1-05 | **Next.js Frontend (RUM)** | Core Web Vitals (LCP/INP/CLS), JS errors count, slow pages, user sessions |
| D1-06 | **Logs Explorer** | Loki query UI pré-configurada, filtros por serviço/nível |

**Alertas (Telegram @Critical):**

| Alerta | Condição | Severidade |
|---|---|---|
| VPS CPU alto | > 90% por 5min | P1 |
| VPS disk cheio | > 85% usado | P0 |
| VPS memória alta | > 90% por 5min | P1 |
| Container caído | status != running | P0 |
| Container em restart loop | > 3 restarts em 10min | P0 |
| Java heap alto | > 90% por 5min | P0 |
| Java error rate alto | > 5% req/5min | P0 |
| Java endpoint lento | p95 > 2s em rota crítica | P1 |
| Postgres connections | > 80% do pool | P0 |
| Postgres slow query | > 5s detected | P1 |
| Frontend error spike | > 50 JS errors em 5min | P1 |

**Owner:** @dev + @devops
**Esforço:** ~1 sprint
**Bloqueios:** Wave 0 completa

---

### 🌊 Wave 2 — Financial + Business (P0 de negócio)

**Objetivo:** Visibilidade de receita, inadimplência e saúde do SaaS. **Bônus:** valida módulos "fantasma" de billing/financial.

**Dashboards:**

| ID | Dashboard | Painéis Principais | Fonte |
|---|---|---|---|
| D2-01 | **Financial Health** | Inadimplência (%, valor, por faixa de atraso), receita prevista vs realizada (mês), cobranças pendentes, falhas de pagamento por gateway (PIX/cartão/boleto), mensalidades vencidas top 20, ticket médio por plano | Postgres direct query + Micrometer counters |
| D2-02 | **Business Overview** | MRR, ARR, churn %, NRR, active tenants, novos trials, trial→paid conversion, LTV/CAC (se aplicável), top 10 tenants por receita | Postgres direct query |
| D2-03 | **Payment Gateway Health** | Taxa de sucesso por gateway, latência média, erros por tipo, volume processado/hora | Micrometer counters (emitidos pelo Java em cada transação) |

**Instrumentação adicional necessária (Java):**
- Counter: `payments.attempts.total{gateway, tenant, status}`
- Timer: `payments.duration.seconds{gateway}`
- Counter: `subscriptions.events.total{type, plan}` (created, cancelled, upgraded, downgraded)
- Gauge: `tenants.active.count`

**Alertas (Telegram @Critical):**

| Alerta | Condição | Severidade |
|---|---|---|
| MRR drop | Cai > 5% WoW | P0 |
| Taxa de falha pagamento | > 10% em 1h | P0 |
| Gateway down | 100% falha em gateway por 10min | P0 |
| Churn diário anormal | > 2x baseline | P1 |
| Inadimplência crescente | > 15% do MRR | P1 |

**Owner:** @dev (BE) + @pm (validação de KPIs)
**Esforço:** ~2 sprints
**Bloqueios:** Wave 1 completa, schema financeiro estável

**Subproduto estratégico:** dashboards servem como **test harness contínuo** dos módulos billing/financial/payments que foram marcados como fantasmas no audit FE↔BE. Qualquer métrica zerada inesperadamente indica regressão.

---

### 🌊 Wave 3 — Operational + Multi-Tenant Customer-Facing (P2 — DEFERRED)

> ⚠️ **Status: DEFERRED para pós-produção real.**
> Motivo: ambiente atual é pre-prod/homolog. Expor dashboards a clientes finais não faz sentido até a app estar em produção real em VPS dedicada. O escopo **interno** desta wave (Operational Overview para o founder) migra para Wave 2 como dashboard adicional.

**Objetivo original:** Valor operacional para dono de academia + diferencial de produto.

**Dashboards:**

| ID | Dashboard | Audiência | Principais Painéis |
|---|---|---|---|
| D3-01 | **Operational Overview** (interno) | Founder/ops | Check-ins totais, ocupação de aulas agregada, heatmap horários, no-show rate, top/bottom academias por engajamento |
| D3-02 | **Academia Dashboard** (por tenant) | Dono de academia | Check-ins hoje/semana/mês, ocupação de aulas próprias, alunos ativos vs inativos, conversão trial→pago, top aulas, cancelamentos |
| D3-03 | **Engagement & CRM** | Growth/founder | WhatsApp volume, taxa entrega, taxa resposta, cadências ativas, conversão por etapa, CRM pipeline (leads por estágio, tempo médio) |
| D3-04 | **Retention Signals** | Growth/founder | Alunos sem check-in > 7/15/30 dias, churn triggers, alertas de risco de cancelamento |

**Requisitos específicos:**
- Variável `$tenantId` no Grafana
- Auth proxy para dashboards embedados (decidir: nginx reverse proxy + header injection vs Grafana API key dinâmica)
- Row-level filtering nas queries Postgres (WHERE tenant_id = $tenantId)
- Dashboard embedado na app Next.js (rota `/admin/insights` ou similar)

**Instrumentação adicional:**
- Counter: `checkins.total{tenant, modality}`
- Gauge: `classes.occupancy.percentage{tenant, class_id}`
- Counter: `whatsapp.messages.sent{tenant, template, status}`
- Counter: `cadence.events{tenant, cadence_id, step, outcome}`

**Alertas:**

| Alerta | Condição | Severidade |
|---|---|---|
| WhatsApp delivery rate baixa | < 90% em 1h | P1 |
| Cadência travada | 0 progress em 24h (tenant-specific) | P2 |

**Owner:** @dev + @pm (priorização de KPIs por tenant)
**Esforço:** ~2 sprints
**Bloqueios:** Waves 1+2 completas, decisão arquitetural sobre embedding

**Decisão pendente:** Dashboards embedados são **feature cobrada** (upsell para planos superiores) ou **incluído em todos os planos**? → Decisão de Morgan + Sergio antes do início da Wave 3.

---

### 🌊 Wave 4 — Tracing Avançado + SLO (Opcional)

**Objetivo:** Observabilidade de nível enterprise. Só começar quando waves 1-3 estiverem estáveis por pelo menos 1 mês.

**Deliverables:**
- Distributed tracing FE→BE→DB completo com correlação
- Exemplars no Prometheus (links direto métrica → trace)
- SLOs formais (ex.: 99.5% de disponibilidade, p95 < 500ms em rotas críticas)
- Error budgets + burn rate alerting
- Synthetic monitoring (Grafana k6 ou Blackbox exporter para endpoints críticos)
- Anomaly detection básico (Grafana Alerting com forecast)

**Owner:** @dev + @devops
**Esforço:** ~1 sprint
**Bloqueios:** Waves 1-3 estáveis

---

## 7. Requisitos Funcionais (FR)

- **FR-001:** Sistema DEVE coletar métricas de CPU, memória, disco e rede da VPS com granularidade mínima de 15s
- **FR-002:** Sistema DEVE expor métricas do backend Java via endpoint `/actuator/prometheus` (já existe)
- **FR-003:** Sistema DEVE coletar logs de todos os containers Docker via Grafana Alloy → Loki
- **FR-004:** Sistema DEVE reter métricas por no mínimo 30 dias e logs por no mínimo 14 dias
- **FR-005:** Sistema DEVE emitir alertas via Telegram Bot para incidentes P0 em < 60s da detecção
- **FR-006:** Dashboards DEVEM ser provisionados via arquivos YAML versionados em Git
- **FR-007:** Sistema DEVE suportar filtro por `tenantId` em todos os dashboards de negócio
- **FR-008:** Frontend Next.js DEVE emitir Core Web Vitals e erros JS para Grafana Faro
- **FR-009:** Backend Java DEVE emitir métricas customizadas de negócio via Micrometer
- **FR-010:** Sistema DEVE permitir deep-link bidirecional entre métricas (Prometheus) e logs (Loki) no mesmo período
- **FR-011:** Alertas DEVEM conter link direto para o painel relevante do dashboard
- **FR-012:** Sistema DEVE suportar silenciamento temporário de alertas (ex.: durante deploys)

## 8. Requisitos Não-Funcionais (NFR)

- **NFR-001 (Performance):** Coleta de métricas NÃO PODE aumentar latência p95 das APIs em mais de 2%
- **NFR-002 (Disponibilidade):** Stack de observabilidade DEVE sobreviver a reinício do host (healthchecks + restart policy)
- **NFR-003 (Recursos — CALIBRADO 8GB):** Stack total NÃO DEVE exceder **2.5 GB de RAM** em regime normal (≈ 31% da VPS). Se exceder → reduzir scrape interval para 60s, reduzir retenção, ou escalar VPS
- **NFR-004 (Segurança):** Grafana DEVE ter autenticação forte (senha complexa + 2FA quando disponível)
- **NFR-005 (Segurança):** Dados de telemetria NÃO DEVEM expor PII (nomes, emails, documentos) — apenas `tenantId`, IDs e counts
- **NFR-006 (Retenção calibrada):** Métricas 30d / Logs 14d (inicial); revisar para 90d após 1 mês se uso de disco permitir
- **NFR-007 (Scrape interval):** Padrão 30s (não 15s) para economia de ~50% em RAM/disco sem perda perceptível
- **NFR-008 (Versionamento):** 100% dos dashboards DEVEM estar em Git; edições diretas na UI são desencorajadas
- **NFR-009 (Custo):** Stack DEVE ser 100% open-source e self-hosted (zero custo adicional de SaaS)
- **NFR-010 (Observabilidade da Observabilidade):** O próprio Grafana/Prom/Loki devem ser monitorados (meta-alerting via cronjob externo)
- **NFR-011 (Equipe de 1 pessoa):** Alertas DEVEM respeitar a natureza single-person ops: zero alert fatigue, horário comercial para P1, apenas P0 fora do horário
- **NFR-012 (Pre-Prod scope):** Ambiente inicial é PRE-PROD/homolog; alertas P0 são **informativos**, não on-call. Produção real virá em VPS separada com revisão desta NFR

---

## 9. Estratégia de Alerting

### 9.1 Canais

| Canal | Severidade | Audiência |
|---|---|---|
| **Telegram @Critical** (bot dedicado) | P0 | Founder + devs |
| **Telegram @Warning** | P1 | Founder + devs |
| **Telegram @Info** | P2 (opcional) | Devs |
| **Email** (fallback) | P0 | Founder (caso Telegram falhe) |

### 9.2 Classificação de Severidade

| Nível | Definição | Tempo de Resposta Esperado |
|---|---|---|
| **P0 — Critical** | Plataforma down, perda de dados, falha de pagamento massiva, vazamento multi-tenant | Imediato (< 15min) |
| **P1 — Warning** | Degradação significativa, SLO em risco, erro rate alto mas não total | < 1h |
| **P2 — Info** | Sinal de atenção, tendência preocupante, sem impacto imediato | Próximo business day |

### 9.3 Anti-Fatigue

- **Inhibition rules:** alerta de "VPS down" silencia todos os demais automaticamente
- **Grouping:** alertas similares em até 5min são agrupados em uma única notificação
- **Silence automática:** durante janelas de deploy (marcadas via API)
- **Runbook link:** todo alerta P0/P1 linka para `docs/runbooks/<alert-id>.md` (a criar progressivamente)

---

## 10. Métricas de Sucesso

| Métrica | Baseline Atual | Meta Pós-Wave 1 | Meta Pós-Suite Completa |
|---|---|---|---|
| **MTTD** (Mean Time To Detect) | > 1h (via reclamação usuário) | < 5min | < 2min |
| **MTTR** (Mean Time To Resolve) | Variável, alto | Reduzir 50% | Reduzir 75% |
| **Incidentes descobertos pelo usuário antes do time** | ~100% | < 20% | < 5% |
| **Dashboards consumidos pelo founder (uso semanal)** | 0 | 3+ | 5+ |
| **Alertas disparados/semana** | 0 | 5-15 (ramp-up) | 10-30 (estável) |
| **False positive rate em alertas P0** | N/A | < 20% | < 10% |
| **Cobertura de instrumentação de negócio** (eventos críticos com métrica) | 0% | N/A | > 80% |

---

## 11. Assumptions

> **Importante:** Estas são premissas adotadas para destravar o PRD. Todas devem ser validadas antes do início da Wave 0.

| # | Assumption | Status | Risco se Errada |
|---|---|---|---|
| A1 | VPS **8GB RAM total** compartilhada, com ~2.5GB disponíveis para observabilidade | ✅ Confirmado | Se app consumir mais do que previsto, stack fica apertada — mitigação via scrape 60s e retenção menor |
| A2 | Retenção **30d métricas / 14d logs** inicial, escalando para 90d se disco permitir | ✅ Confirmado | Baixo — controlável |
| A3 | Telegram é canal primário (sem Slack/Discord) | ✅ Confirmado | Baixo |
| A4 | Dashboards multi-tenant customer-facing **adiados** até VPS de produção real | ✅ Confirmado | Nenhum — Wave 3 é opt-in futuro |
| A5 | Ambiente é **PRE-PROD/homolog**, não produção real | ✅ Confirmado | Alertas são informativos, não on-call; será revisado quando prod real existir |
| A6 | Postgres atual roda na mesma VPS (docker-compose), acessível para `postgres_exporter` | ⚠️ A confirmar (Q-A) | Se for Neon/managed, precisa usar API de métricas nativa |
| A7 | Grafana atual já está acessível publicamente via IP ou domínio com auth configurada | ⚠️ A confirmar (Q-B) | Pode requerer setup de nginx/reverse proxy |
| A8 | Backend Java é **Spring Boot 3.2.5** com Actuator + Micrometer Prometheus **já configurados** | ✅ **VERIFICADO no código** | Nenhum — acelera Wave 0 |
| A9 | Não há requisito de compliance específico no pre-prod (LGPD básico) | ✅ Assumido | Compliance será reavaliado para prod |
| A10 | **Sergio é equipe única** (founder + dev + devops + ops + PM) — alerting calibrado para single-person | ✅ Confirmado | Alert fatigue é risco principal; mitigação via thresholds conservadores e canais separados |
| A11 | Tempo (tracing) **fora do MVP** — pom do Java já tem exporter OTLP pronto para ativação futura | ✅ Decisão Morgan | Nenhum — reversível com ~30min de trabalho |

---

## 12. Open Questions

> **Questões a responder antes/durante execução das waves.**

### Bloqueantes para Wave 0 (reduzidas pós-calibragem):

1. **Q-A:** Postgres é self-hosted (docker-compose) ou managed (Neon/Supabase)? → Determina se `postgres_exporter` é aplicável ou precisa adapter
2. **Q-B:** Existe docker-compose atual versionado em algum repo, ou está solto na VPS? → Determina estratégia de adição dos novos containers (Loki/Alloy/exporters)
3. **Q-C:** Grafana hoje tem domínio próprio (ex.: `grafana.seudominio.com`) ou responde só via `IP:porta`? → Afeta setup de auth e futuro embedding
4. **Q-D:** Disco livre atual na VPS? → Precisamos de ~20-50GB livres para retenção 30d
5. **Q-E:** Você vai criar o Telegram Bot via @BotFather agora, ou quer runbook passo-a-passo?

### Bloqueantes para Wave 2:

6. **Q6:** Qual é o source-of-truth do MRR no schema atual? (Tabela `subscriptions`? `invoices`? Cálculo em runtime?) → Determina query Postgres
7. **Q7:** Gateways de pagamento em uso (Asaas, Stripe, Pagar.me, etc.)? → Determina labels das métricas de payment
8. **Q8:** Módulos fantasma (billing, financial) estão de fato emitindo eventos internos ou estão 100% mockados? → Risco de Wave 2 expor gap maior que o esperado

### Bloqueantes para Wave 3:

9. **Q9:** Dashboards embedados: feature incluída em todos os planos ou upsell? → Decisão de negócio
10. **Q10:** Auth proxy: nginx+header, Grafana JWT, ou outra abordagem? → Decisão arquitetural (@architect + @devops)
11. **Q11:** Onde na UI da app o dashboard embedado vive? (Rota nova? Sidebar item? Modal?) → Decisão UX

---

## 13. Riscos

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|---|
| R1 | VPS sem recursos suficientes para stack | Média | Alto | Dimensionar antes da Wave 0 (Q1); considerar retenção menor |
| R2 | Instrumentação Java custom atrasa Wave 2 | Média | Médio | Começar com métricas Micrometer default; custom só onde crítico |
| R3 | Loki consome muito disco por log verboso | Média | Médio | Configurar labels enxutos, retenção agressiva inicial (7d), revisar |
| R4 | Alert fatigue em Telegram nas primeiras semanas | Alta | Médio | Começar conservador (thresholds altos), refinar semanalmente |
| R5 | Dashboards embedados vazam dados cross-tenant | Baixa | **Crítico** | QA rigoroso + testes automatizados de isolamento antes do Wave 3 release |
| R6 | Módulos financeiros "fantasma" expõem métricas zeradas embaraçosas | Alta | Baixo (interno) | Wave 2 é interna; serve como validação, não exposição |
| R7 | Grafana public exposto sem auth forte | Baixa | Crítico | 2FA obrigatório, senha complexa, IP allowlist se possível |
| R8 | Single point of failure (Grafana cai → cego de novo) | Média | Alto | Meta-alerting via healthcheck externo (UptimeRobot grátis ou cronjob com curl+telegram) |
| R9 | Instrumentação do frontend impacta performance | Baixa | Médio | Amostragem (sampling) agressiva no Faro; não instrumentar rotas de login |
| R10 | Decisões arquiteturais de multi-tenant embedding atrasam Wave 3 | Média | Médio | Spike técnico no fim da Wave 2 para tomar decisão antes |

---

## 14. Out of Scope (Explicitamente Fora)

- APM comercial (Datadog, New Relic, Dynatrace)
- Log management proprietário (Splunk, Sumo Logic)
- Machine learning / anomaly detection avançado (deferido para Wave 4+)
- Observabilidade de ambientes de desenvolvimento/staging
- Dashboard builder visual para clientes (eles consomem dashboards pré-construídos)
- Integração com ferramentas de incident management (ex.: Statuspage, Incident.io)
- Relatórios agendados por email (Grafana Reporting é pago)
- SIEM / auditoria de segurança (escopo separado)
- Backup e disaster recovery da própria stack de observabilidade (Wave 4+)

---

## 15. Próximos Passos

Após aprovação deste PRD:

1. **Validar Assumptions & Open Questions** → sessão rápida Sergio + Morgan
2. **`@devops *environment-bootstrap`** → coletar specs reais da VPS (Q1) e confirmar acesso
3. **Criar Epic:** `@pm *create-epic` → "EPIC-OBS: Observability Suite" com 4 waves como milestones
4. **Delegação:** `@sm *draft` por story, começando por Wave 0
5. **Execução:** `@pm *execute-epic` ou execução manual story-a-story
6. **Review:** QA gate obrigatório ao fim de cada Wave
7. **Retro:** após Wave 1, retrospectiva para ajustar plano das demais

---

## 16. Referências

- Audit FE↔BE: `docs/API_AUDIT_BACKEND_VS_FRONTEND.md`
- PRD Q2: `.taskmaster/docs/prd-evolucao-2026-q2.md`
- Backend Java: `/Users/sergioamim/dev/pessoal/academia-java`
- Grafana docs: https://grafana.com/docs/grafana/latest/
- Loki docs: https://grafana.com/docs/loki/latest/
- Tempo docs: https://grafana.com/docs/tempo/latest/
- Grafana Alloy: https://grafana.com/docs/alloy/latest/
- Grafana Faro (RUM): https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/
- Micrometer: https://micrometer.io/
- Telegram Bot API: https://core.telegram.org/bots/api

---

**Status:** Draft aguardando validação de Sergio (founder) + resolução das Open Questions bloqueantes (Q1-Q5).
