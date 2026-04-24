# Epic 4 — Notificações Globais (extensão do hub existente)

**Criado por:** @po (Pax) + @architect (Aria) — sessão de debate com user
**Data:** 2026-04-24
**Revisado:** 2026-04-24 após spikes SP-1 a SP-5 descobrirem sistema pré-existente
**Status:** Ready for `@sm *draft`
**Escopo:**
- BE: **ESTENDE** `modulo-notificacoes` existente (não cria módulo novo)
- FE: novo pacote `src/components/portal/notifications/` — `NotificationBell` do portal operador (paralelo ao `src/components/cliente/notification-bell.tsx` já existente para aluno)
**Predecessor:** Epic 3 (Cadências CRM) — `NOTIFICAR_GESTOR` stub
**Substitui:** Story 3.27 — absorvida pela Wave 3

---

## Glossário

| Termo técnico | Termo de negócio | Significado |
|---|---|---|
| `tenant_id` / `TENANT` | **Unidade** / Filial | Cada filial da academia é um tenant isolado |
| `rede_id` / `REDE` / `networkId` | **Academia** / Rede | Organização-mãe que agrupa 1+ unidades |
| `PLATAFORMA` | SaaS admin | Operadores do ConceitoFit (envelope `UserKind`) |

---

## Descobertas dos spikes + Wave 1 implementada (crítico — lê antes de continuar)

**Atualização 2026-04-24:** Wave 1 BE **IMPLEMENTADA e mergeada em main** (commits `8895f167` → `5f868c1c`, 8 commits). 124 testes no módulo-notificacoes (+13 novos), zero regressão em outros módulos, build completo verde.

### Correções ao plano original (descobertas durante implementação)

- **`user_id` é `BIGINT`, não `UUID`** — `auth.users.id` é bigint identity na V1 baseline. `NotificacaoInboxEntity.userId = Long`. Afeta Wave 2 (DTOs) e Wave 4 (tipos TS).
- **Enum canal real é `NotificacaoCanal`** (não `CanalNotificacao` como eu tinha no epic). Valor novo: `NotificacaoCanal.IN_APP`.
- **Colunas `auth` reais:** `users.enabled` (não `ativo`), `roles.name` (não `nome`). Queries do `AudienceResolver` ajustadas.
- **Padrão de campos:** `NotificacaoInboxEntity` segue convenção do módulo — campos `public`, `LocalDateTime` (não `Instant`).
- **Defaults de canais preservados:** `[EMAIL, PUSH, SMS, WHATSAPP]` — `IN_APP` só quando pedido explicitamente no command. Evita regressão em testes existentes.
- **ShedLock** adicionado como `compileOnly` em `modulo-notificacoes/build.gradle` (runtime fica em `modulo-app`).
- **Record `PublicarEventoCommand`** estendido sem quebrar 18 emissores existentes via constructors legados delegados.
- **DI opcional:** `NotificacaoInboxRepository` e `AudienceResolver` injetados via `@Autowired(required=false)` setters em `NotificacaoHubService` — testes antigos não quebram.

### Resumo dos achados originais dos spikes

### SP-1 — Roles granulares ✅ existem

Tabela `auth.user_roles` com 8 roles scoped por tenant: `ADMIN`, `SUPER_ADMIN`, `GERENTE`, `FINANCEIRO`, `INSTRUTOR`, `RECEPCAO`, `CUSTOMER`, `VIEWER`. Localização: `modulo-auth/domain/Role.java`. FE consome via `src/lib/access-control.ts`.

**Consequência no epic:** Wave 3 usa `AudienceTipo=ROLE` apontando para **`GERENTE`** (nome real) em vez do fictício `GERENTE_COMERCIAL`.

### SP-2 — Modelo Academia/Unidade ✅ claro

- `modulo-academia/domain/Academia.java` → tabela `academias` (Rede, organização-mãe)
- Tabela `tenants` com FK `academia_id` → Unidade pertence a uma Academia
- `auth.user_tenant_membership` → user ↔ Unidade (N:N)
- `User.redeId` direto na tabela `auth.users` → user pertence a **UMA** Academia (singular)
- JWT já expõe: `networkId` (Academia), `activeTenantId` (Unidade ativa), `availableScopes: ["UNIDADE"|"REDE"|"GLOBAL"]`
- FE: `getNetworkIdFromSession()` + `getActiveTenantIdFromSession()` + `useTenantContext()` + `switchActiveTenant()`

**Consequência no epic:** user tem UM `networkId` (não array). Query do sino fica `WHERE rede_id = :userNetworkId` — direto, sem `ANY()`.

### SP-3 — SSE já é padrão no backend ✅

2 controllers funcionais produzindo eventos em tempo real:
- `ConversasSseController` (mensagens WhatsApp) → `/api/v1/conversas/stream`
- `CockpitSseController` (check-ins pendentes) → `/api/v1/cockpit/stream`

Padrão: `Map<UUID, List<SseEmitter>>` por tenant, heartbeat 30s, escuta `ApplicationEvent`. Deploy blue/green single-pod via Caddy (sticky implícita). **Sem Redis/broker.**

**Consequência no epic:** Wave para real-time pode copiar padrão direto. Não precisa criar novo design. **Se o deploy evoluir pra multi-pod, precisa Redis pub/sub** — decisão futura.

### SP-4 — UI existente do aluno ✅

`src/components/cliente/notification-bell.tsx` + `src/lib/query/use-notificacoes-aluno.ts` já funcional para alunos. Padrão: `Sheet` lateral (não `Popover`) + React Query polling 60s + Sonner para toast. Mutations `marcarLida`/`marcarTodasLidas` prontas.

**Consequência no epic:** portal segue mesmo padrão. Reusa hooks/mutations generalizando, não reinventa.

### SP-5 — `modulo-notificacoes` JÁ EXISTE no BE 🎁

Localização: `academia-java/modulo-notificacoes/`. Componentes descobertos:

**Entidades:**
- `NotificacaoEventoEntity` (tabela `notificacao_evento`) — evento emitido, com `payloadJson`, `status`, `correlationId`, `schemaVersion`
- `NotificacaoOutboxEntity` (tabela `notificacao_outbox`) — fila de envios por canal (email/whatsapp/push) com retry e tentativas
- `NotificacaoPreferenciaEntity` (tabela `notificacao_preferencia`) — preferências por aluno×evento×canal
- `PushDeviceTokenEntity` — tokens de push mobile
- `OutboxMessageEntity` — outbox genérico cross-domain

**Serviço:**
- `NotificacaoHubService.publicar(PublicarEventoCommand)` — entrypoint único, resolve destinatário/canais/preferências/templates
- `NotificacaoPublisher` (interface)
- Métodos auxiliares: `listarPreferencias`, `atualizarPreferencia`, `listarEventos`, `reenviar`

**Controller** (`modulo-app/.../NotificacaoController.java`):
- `GET /api/v1/notificacoes/preferencias?tenantId&alunoId`
- `PUT /api/v1/notificacoes/preferencias`
- `GET /api/v1/notificacoes/eventos?tenantId&alunoId?`
- `POST /api/v1/notificacoes/outbox/{id}/reenviar`

**Emitters já integrados:**
- `AulasNotificacaoService` (2 eventos)
- `ReservaAulaService` (2 eventos)
- `DunningService` (pagamentos — cobrança)

**Tipos no FE (aluno):** `PAGAMENTO_VENCENDO`, `AULA_CONFIRMADA`, `TREINO_NOVO`, `MATRICULA_VENCENDO`, `GERAL`.

**Consequência no epic (CRÍTICA):** **Opção B — estender o hub existente**, NÃO criar módulo novo. Economia de ~50% de stories.

---

## Gap analysis — o que falta pra Epic 4

| Feature necessária | Existe? | Gap |
|---|---|---|
| Per-user (alunoId) | ✅ | — |
| Per-audience (GLOBAL/REDE/TENANT/ROLE) | ❌ | Adicionar campo `audience` no `notificacao_evento` + lógica de resolve no hub |
| Canal IN_APP (sino) distinto de email/push | ❌ | Nova tabela `notificacao_inbox` (lazy-eager fan-out, paralela ao outbox) |
| Idempotência via `idempotency_key` | ❌ | Adicionar coluna UNIQUE em `notificacao_evento` |
| TTL + purga | ❌ | Coluna `expires_at` + job `@Scheduled` + ShedLock |
| Severidade (INFO/AVISO/URGENTE) | ❌ | Coluna `severidade` em `notificacao_inbox` |
| CTA (`acao_url`, `acao_label`, `requer_acao`) | ❌ | Colunas em `notificacao_inbox` |
| Metadata JSONB | ~✅ | `payloadJson` existe em `notificacao_evento` — reusa |
| Filtro por Unidade ativa no FE | ❌ | Lógica de query no endpoint de listagem |
| Cross-domain listeners | ✅ | Padrão já em uso — só precisa adicionar listener da `CadenciaEscaladaEvent` |
| Emissor GLOBAL com autorização | ❌ | Endpoint admin + validação `UserKind=PLATAFORMA` |
| FE portal `NotificationBell` | ❌ | Novo componente (aluno tem referência) |
| UI admin de emissão manual | ❌ | Wave 5 |

---

## Objetivo do épico

**Estender `modulo-notificacoes`** adicionando:
1. Canal `IN_APP` (sino no portal operador) paralelo aos canais existentes (email/whatsapp/push).
2. Audience multi-tipo (GLOBAL/REDE/TENANT/ROLE/USUARIO) para além do atual direcionamento exclusivo por aluno.
3. Idempotência + TTL + purga no evento.
4. UI do portal operador (bell + dropdown + página `/notificacoes`).
5. Substituir `NOTIFICAR_GESTOR` stub (Story 3.27) com listener real que emite notificação IN_APP por role.

Valor: reduzir blindspots operacionais, dar fundação cross-domain (destrava futuros avisos de compliance, comunicados do SaaS, etc.), aproveitar infraestrutura madura que já existe.

## Decisões arquiteturais finais

### D1 — Nova tabela `notificacao_inbox` paralela ao outbox

Canal IN_APP não cabe em `notificacao_outbox` (esse é voltado a envio assíncrono com retry). Criar tabela própria:

```sql
CREATE TABLE notificacao_inbox (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES notificacao_evento(id) ON DELETE CASCADE,
  tenant_id UUID NULL,            -- nullable em GLOBAL/REDE
  rede_id UUID NULL,              -- populado quando audience=REDE/TENANT/ROLE
  user_id UUID NOT NULL,          -- destinatário (eager fan-out)
  titulo VARCHAR(200) NOT NULL,
  mensagem VARCHAR(1000) NOT NULL,
  severidade VARCHAR(20) NOT NULL,
  acao_url VARCHAR(500) NULL,
  acao_label VARCHAR(100) NULL,
  requer_acao BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMP NOT NULL DEFAULT now(),
  expira_em TIMESTAMP NOT NULL,
  lida_em TIMESTAMP NULL,
  acao_executada_em TIMESTAMP NULL,
  CONSTRAINT notificacao_inbox_severidade_chk CHECK (severidade IN ('INFO','AVISO','URGENTE'))
);

CREATE INDEX notificacao_inbox_user_criada_idx
  ON notificacao_inbox(user_id, criada_em DESC);
CREATE INDEX notificacao_inbox_user_naolida_idx
  ON notificacao_inbox(user_id, lida_em)
  WHERE lida_em IS NULL;
CREATE INDEX notificacao_inbox_tenant_idx
  ON notificacao_inbox(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX notificacao_inbox_expira_idx ON notificacao_inbox(expira_em);
```

**Eager fan-out:** 1 linha por destinatário. Aceitável em academia B2B (100 funcionários × 50 notificações/dia × 30d TTL = 150k linhas — controlado por TTL + índices eficientes). Simplifica "marcar lida" (1 row = 1 user).

### D2 — Audience resolver no `NotificacaoHubService`

Novo método privado `List<UUID> resolverDestinatariosInApp(audience)`:

```java
record AudienceInApp(
  AudienceTipo tipo,
  UUID redeId,      // REDE/TENANT/ROLE
  UUID tenantId,    // TENANT/ROLE
  String role,      // ROLE
  UUID userId       // USUARIO
) {}

enum AudienceTipo { GLOBAL, REDE, TENANT, ROLE, USUARIO }

// resolve retorna lista de user_id:
// GLOBAL  → todos usuários do SaaS (query completa em auth.users — cuidado)
// REDE    → users com User.redeId = redeId
// TENANT  → users com membership em tenantId ativo (user_tenant_membership.tenant_id = tenantId AND active=true)
// ROLE    → users com membership em tenantId + user_roles com role.nome = role (scoped)
// USUARIO → 1 user direto
```

Após resolve, hub faz batch insert em `notificacao_inbox` (1 SQL com `INSERT ... SELECT`).

### D3 — Extensão de `PublicarEventoCommand`

Record atual:
```java
record PublicarEventoCommand(
  UUID tenantId, UUID pessoaId, String evento, String origem,
  UUID referenciaId, String destinatarioEmail, String destinatarioTelefone,
  Set<CanalNotificacao> canais, Map<String,Object> payload, String correlationId
)
```

Adicionar:
```java
record PublicarEventoCommand(
  ...campos existentes...,
  // NOVOS:
  String idempotencyKey,           // opcional; hub calcula se null
  AudienceInApp audienceInApp,     // opcional; só se CanalNotificacao.IN_APP ∈ canais
  NotificacaoSeveridade severidade, // opcional; default INFO
  String tituloInApp,               // template-able
  String mensagemInApp,             // template-able
  String acaoUrl,
  String acaoLabel,
  Boolean requerAcao,
  Duration ttl                      // opcional; default por tipo de evento
)
```

### D4 — Idempotência em `notificacao_evento`

Adicionar coluna:
```sql
ALTER TABLE notificacao_evento
  ADD COLUMN idempotency_key VARCHAR(200) NULL;

CREATE UNIQUE INDEX notificacao_evento_idempotency_uq
  ON notificacao_evento(idempotency_key)
  WHERE idempotency_key IS NOT NULL;
```

Na publicação: `INSERT ... ON CONFLICT (idempotency_key) DO NOTHING RETURNING id` — se nada retorna, busca existente.

Convenção de chaves por emissor:
- `cadencia-escalada-{execucaoId}-{regraId}`
- `conta-vencida-{contaId}-{diasBucket}`
- `global-admin-{uuid-manual}`

### D5 — TTL + purga via job

Colunas em `notificacao_evento` e `notificacao_inbox`:
- `expires_at TIMESTAMP NOT NULL`

Job `NotificacaoMaintenanceJob` com `@Scheduled(cron = "0 0 3 * * *")` + `@SchedulerLock(name="notificacao_purge")`:
```sql
DELETE FROM notificacao_inbox WHERE expires_at < now();
DELETE FROM notificacao_evento WHERE expires_at < now() AND NOT EXISTS (SELECT 1 FROM notificacao_inbox WHERE evento_id = id);
-- outbox fica com política própria já existente
```

TTL default por tipo (config em `notificacao_tipo_config`):

| Tipo | TTL |
|---|---|
| `CADENCIA_ESCALADA` | 14 dias |
| `CONTA_VENCIDA` | 60 dias |
| `PAGAMENTO_RECEBIDO` | 7 dias |
| `ANIVERSARIANTE_CLIENTE` | 1 dia |
| `PROSPECT_NOVO` | 30 dias |
| `GLOBAL_AVISO_SISTEMA` | 30 dias |
| Default se não configurado | 14 dias |

### D6 — Query do sino (endpoint GET /notificacoes/inbox)

```sql
SELECT *
FROM notificacao_inbox
WHERE user_id = :userId
  AND (tenant_id IS NULL OR tenant_id = :activeTenantId)  -- filtro por Unidade ativa
  AND expires_at > now()
ORDER BY criada_em DESC
LIMIT :limit;
```

**Por que funciona:** eager fan-out persiste tenant_id no momento da criação. Usuário só vê row se (a) não é específica de unidade OU (b) é da unidade ativa dele. GLOBAL/REDE ficam com `tenant_id = NULL`. TENANT/ROLE ficam com `tenant_id` preenchido.

Ao trocar de unidade no `TenantSwitcher`, o sino automaticamente filtra.

### D7 — Severidade visual

Sino do header no portal:
- **Badge numérico** = count não-lidas do `activeTenantId` + GLOBAL/REDE
- **Ícone `!` alerta destacado** quando há ao menos uma URGENTE não-lida
- Sem pulsar/piscar

### D8 — Re-emissão com bucket na idempotency_key

Emissor decide se re-emite. Ex: `conta-vencida-{contaId}-{1|7|15|30}` — a cada bucket, key diferente, notificação nova sem conflito.

### D9 — Sem snooze, sem ação inline

Descartadas (complexidade). Usuário fecha (marca lida) ou expira. CTA sempre é URL.

### D10 — Emissão GLOBAL restrita

Endpoint admin valida `UserKind=PLATAFORMA` antes de aceitar `AudienceTipo=GLOBAL`. Todas emissões GLOBAL são logadas em `audit_log`.

## Fora de escopo

- **Lazy fan-out** (query-time audience resolution): considerada e rejeitada. Eager é consistente com outbox pattern já em uso.
- **Multi-canal via outbox + in-app simultâneo:** já funciona via `canais: Set<IN_APP, EMAIL>` no command. Hub roda ambos independentes.
- **Redis para SSE multi-pod:** deploy atual é single-pod. Decisão adiada.
- **Digest por email** ("resumo do dia"): epic futuro.
- **Ação inline** no dropdown: epic futuro.
- **Snooze:** epic futuro.
- **Analytics:** dashboard de tipos mais gerados/menos lidos — epic futuro.

---

## Stories (revisadas para ~15 vs. 33 originais)

Cada story pronta para `@sm *draft`.

### Wave 1 — Extensão do `modulo-notificacoes` BE ✅ CONCLUÍDA (2026-04-24)

Migração `V202604241907__notificacao_inbox_e_idempotency.sql` criada. Branch `feat/notificacoes-epic4-wave1` mergeada em main via fast-forward. Worktree removido, branch deletada. 124 testes passando no módulo (+13 novos).

| ID | Título curto | Status | Commit |
|----|--------------|--------|--------|
| **4.1** | Migration notificacao_inbox + idempotency + TTL | ✅ | `8895f167` |
| **4.2** | `NotificacaoInboxEntity` + Repository (userId `Long`, não UUID) | ✅ | `5c25c2d9` |
| **4.3** | Estender `PublicarEventoCommand` com IN_APP + audience + TTL (retrocompatível via legacy constructors) | ✅ | `fa4b8581` |
| **4.4** | `AudienceResolver` GLOBAL/REDE/TENANT/ROLE/USUARIO → `List<Long>` via queries nativas em `auth.users`, `user_tenant_membership`, `user_roles`, `roles` | ✅ | `469b026e` |
| **4.5** | `NotificacaoHubService.publicar()` com idempotência (`ON CONFLICT`) + fan-out inbox + TTL por tipo | ✅ | `714abeb3` |
| **4.6** | `NotificacaoMaintenanceJob` @Scheduled + ShedLock (`notificacao_maintenance_job`, cron 03:00) | ✅ | `16bafbc4` |
| **4.7** | `NotificacaoCanal.IN_APP` + enum `NotificacaoSeveridade` + `AudienceTipo` | ✅ | `faafad45` |
| — | Testes Wave 1 | ✅ | `5f868c1c` |

### Wave 2 — Endpoints REST para portal inbox ✅ CONCLUÍDA (2026-04-24)

Branch `feat/notificacoes-epic4-wave2` mergeada via fast-forward em main. 5483 tests no monolito (0 falhas), `modulo-notificacoes` foi de 124 → 141 (+17). Worktree e branch removidos.

| ID | Título curto | Status | Commit |
|----|--------------|--------|--------|
| **4.8** | `GET /inbox` paginado com cursor base64 + filtro D6 | ✅ | `2094cf86` + `85635b27` |
| **4.9** | `POST /inbox/{id}/marcar-lida` + `POST /inbox/{id}/acao` (idempotentes) | ✅ | `85635b27` |
| **4.10** | `POST /inbox/marcar-todas-lidas?tenantId=` (UPDATE atômico no repo) | ✅ | `85635b27` |
| **4.11** | `GET /inbox/contadores?tenantId=` retornando `{naoLidas, urgentesNaoLidas}` | ✅ | `85635b27` |
| **4.12** | `POST /admin/emitir` com `@PreAuthorize("hasRole('PLATAFORMA')")` + double-check userKind para GLOBAL + audit log | ✅ | `d9e6f545` |
| — | Testes Wave 2 (37 novos) | ✅ | `cdd0b480` |

**Implementação criou:** `NotificacaoInboxService` (modulo-notificacoes), `NotificacaoInboxController` + `NotificacaoAdminController` + `OperadorAuthContextService` (modulo-app), `NotificacaoNaoEncontradaException`. Auth segue padrão de `AppClienteIdentidadeService` (parse JWT via `JwtTokenProvider.getUserId(token)`). Audit best-effort via `AuditService` (modulo-core) + SLF4J Marker `AUDIT`.

### Wave 3 — Substitui `NOTIFICAR_GESTOR` (fecha Story 3.27) ✅ CONCLUÍDA (2026-04-24)

Branch `feat/notificacoes-epic4-wave3` mergeada via fast-forward em main. Listener **mora em `modulo-app`** (não `modulo-crm`) — ArchUnit proíbe dep direta crm→notificacoes.

| ID | Título curto | Status | Commit |
|----|--------------|--------|--------|
| **4.13** | `CadenciaEscaladaListener` em `modulo-app/application/event/` — `@EventListener + @Async`, idempotency `cadencia-escalada-{execucao}-{regra}`, severidade URGENTE, `acaoUrl=/crm/cadencias?execucao=X`, TTL 14d | ✅ | `0added63` |
| **4.14** | Remover `log.warn` stub de `CrmProcessOverdueService.executarAcaoEscalacao()` — evento continua publicado, listener consome | ✅ | `0303ceeb` |
| **4.15** | `CadenciaEscaladaListenerTest` (4 cenários) + reforço em `CrmProcessOverdueServiceTest` | ✅ | `c6577ea3` |
| **4.16** | Atualizar `CADENCIAS_CRM.md` §6.4/§14.3 fechando 3.27 via Epic 4 | ✅ | `11f0209f` |

Tests: modulo-crm 184→185, modulo-app 401→405. Zero regressão.

### Wave 4 — Core FE portal (bell + dropdown + página) ✅ CONCLUÍDA (2026-04-24)

Branch `feat/notificacoes-epic4-wave4` mergeada via merge commit `0075b8a` em main (main avançou com fix de middleware durante implementação). TSC limpo, ESLint sem erros novos.

| ID | Título curto | Status | Commit |
|----|--------------|--------|--------|
| **4.17** | Tipos TS + adapter `/api/v1/notificacoes/inbox` — userId: `number` (BIGINT) | ✅ | `4f077a8` |
| **4.18** | Hook `useNotificacoesInbox` (polling 60s) + `useContadoresInbox` (polling 30s) + mutations | ✅ | `df97752` |
| **4.19** | `<NotificationBellPortal />` com Sheet right, badge numérico + `!` alerta urgente estático, agrupamento por dia (Hoje/Ontem/Esta semana/Mais antigas) com sticky headers | ✅ | `e48d7bd` |
| **4.20** | Integração: `AppTopbar` (portal) entre ShoppingCart e OnboardingStatusBadge + `AdminShellFrame` (backoffice) ao lado do ModeBadge | ✅ | `3db7883` |
| **4.21** | Página `/notificacoes` com `useInfiniteQuery` + botão "Carregar mais" + filtro severidade client-side + toggle "apenas não-lidas" server-side | ✅ | `d737a15` |

### Wave 4 — Core FE (portal bell + dropdown + página)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.17** | Tipos TS em `src/lib/shared/types/notificacao.ts` + adapter `src/lib/api/notificacoes-inbox.ts` | M | 4.8 |
| **4.18** | Hook `useNotificacoesInbox(activeTenantId)` com react-query polling 60s, `useMarcarLida`, `useMarcarTodasLidas` — padrão copiado de `use-notificacoes-aluno` | M | 4.17 |
| **4.19** | `<NotificationBellPortal />` — usa `Sheet side="right"` (padrão do bell aluno), badge numérico + ícone `!` condicional para URGENTE, lista agrupada por data | L | 4.18 |
| **4.20** | Integrar bell no header operador (`src/components/shared/header.tsx` — investigar local exato), visível apenas em rotas `(portal)` e `(backoffice)` | S | 4.19 |
| **4.21** | Página `/notificacoes` com lista completa + filtros (tipo, severidade, lida/não-lida) + paginação cursor | M | 4.17 |

### Wave 5 — Admin SaaS (emissão GLOBAL + dogfood)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.22** | Página `/admin/notificacoes/emitir` (backoffice) — form react-hook-form + zod (padrão `onTouched + canSave` do CLAUDE.md) — autoriza só PLATAFORMA | L | 4.12 |
| **4.23** | Audience picker component — select de escopo + campos condicionais | M | 4.22 |
| **4.24** | Página `/admin/notificacoes/historico` — audit log de emissões manuais | M | 4.22 |
| **4.25** | Listener `ContaVencidaEvent` em `modulo-financeiro` (ou equivalente) — emite inbox com bucket na key (dogfood + teste real) | M | 4.5 |

---

## Waves descartadas / adiadas

| Wave original | Status | Motivo |
|---|---|---|
| W6 Preferências por usuário | Adiada | `NotificacaoPreferenciaEntity` já existe (por aluno). Extender para operador é epic futuro. |
| W7 Dogfood múltiplos domínios | Reduzida | Apenas 4.25 como exemplo. Outros domínios evoluem quando priorizado. |
| W8 SSE real-time | Adiada | Copiar padrão `ConversasSseController` é trivial quando quiser; single-pod atual funciona sem isso. Polling 60s é suficiente. |

---

## Métricas de sucesso

1. **Adoção:** % de operadores que abriram o sino ≥1x/semana (alvo: >70% em 30d)
2. **Engagement:** taxa de click em CTA (alvo: >25% URGENTE, >5% INFO)
3. **Dedupe:** contagem de `INSERT ON CONFLICT` evitados (monitorar)
4. **Storage:** tamanho de `notificacao_inbox` após 90d (alvo: <500MB por tenant grande)
5. **Zero regressão** no sino do aluno (não quebrar `notification-bell.tsx`)

## Riscos

| Risco | Prob | Impact | Mitigação |
|---|---|---|---|
| Eager fan-out explodir em academia gigante | Baixa | Médio | TTL agressivo + índices por user_id + monitoring |
| Hub existente ter acoplamento oculto | Média | Alto | SP-5 já mapeou; Wave 1 inclui testes de regressão no fluxo aluno |
| Query do audience GLOBAL lenta (escan em `auth.users`) | Média | Baixo | Cache do set de userIds ativos com TTL 5min |
| SSE se tornar demanda urgente | Baixa | Baixo | Polling 60s aceita volume; migração trivial quando precisar |

---

## Schema consolidado (Wave 1)

```sql
-- Estender existente:
ALTER TABLE notificacao_evento
  ADD COLUMN idempotency_key VARCHAR(200) NULL,
  ADD COLUMN expires_at TIMESTAMP NULL;

CREATE UNIQUE INDEX notificacao_evento_idempotency_uq
  ON notificacao_evento(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX notificacao_evento_expira_idx
  ON notificacao_evento(expires_at)
  WHERE expires_at IS NOT NULL;

-- Nova tabela:
CREATE TABLE notificacao_inbox (
  id UUID PRIMARY KEY,
  evento_id UUID NOT NULL REFERENCES notificacao_evento(id) ON DELETE CASCADE,
  tenant_id UUID NULL,
  rede_id UUID NULL,
  user_id UUID NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem VARCHAR(1000) NOT NULL,
  severidade VARCHAR(20) NOT NULL,
  acao_url VARCHAR(500) NULL,
  acao_label VARCHAR(100) NULL,
  requer_acao BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMP NOT NULL DEFAULT now(),
  expira_em TIMESTAMP NOT NULL,
  lida_em TIMESTAMP NULL,
  acao_executada_em TIMESTAMP NULL,
  CONSTRAINT notificacao_inbox_severidade_chk CHECK (severidade IN ('INFO','AVISO','URGENTE'))
);

CREATE INDEX notificacao_inbox_user_criada_idx ON notificacao_inbox(user_id, criada_em DESC);
CREATE INDEX notificacao_inbox_user_naolida_idx ON notificacao_inbox(user_id, lida_em) WHERE lida_em IS NULL;
CREATE INDEX notificacao_inbox_tenant_idx ON notificacao_inbox(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX notificacao_inbox_expira_idx ON notificacao_inbox(expira_em);
```

---

## Handoff

**Próximo passo:** `@sm *draft 4.1` (migration + coluna) → sequencial Wave 1.

**Sequenciamento:**
- Wave 1 → 2 → 3 → 4 → 5.
- Wave 3 **substitui Story 3.27** — já marcada como substituída.
- Wave 2 (endpoints) pode paralelizar com Wave 3 (listener CRM) — não conflita.
- Wave 4 (FE portal) depende de Wave 2 (endpoints). Padrão a copiar: `src/components/cliente/notification-bell.tsx` + `src/lib/query/use-notificacoes-aluno.ts`.
- Wave 5 (admin) só depois da 4 estabilizada.

**Responsáveis:**
- `@sm *draft` — cada story
- `@po *validate-story-draft` — checklist 10-point
- `@dev` — implementação (**reusa `NotificacaoHubService` existente — não criar paralelo**)
- `@qa *qa-gate` — ao final de cada story
- `@devops *push` — PR e merge

---

*— Pax + Aria, construindo em cima do que já está feito 📢*
