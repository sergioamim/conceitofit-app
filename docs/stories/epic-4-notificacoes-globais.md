# Epic 4 — Notificações Globais (Cross-Domain)

**Criado por:** @po (Pax) + @architect (Aria) — sessão de debate com user
**Data:** 2026-04-24
**Status:** Ready for `@sm *draft`
**Escopo:**
- BE: novo `modulo-notificacoes` em `academia-java/`
- FE: novo pacote `src/lib/notifications/` + componentes em `src/components/notifications/` em `academia-app/`
**Predecessor:** Epic 3 (Cadências CRM) — `NOTIFICAR_GESTOR` está stub, será substituído por este epic
**Substitui:** Story 3.27 (`notificar-gestor-integration`) — fechada como "substituída pelo Epic 4 Wave 3"

---

## Glossário (domínio ConceitoFit)

| Termo de código | Termo de negócio | Significado |
|---|---|---|
| `tenant_id` / `TENANT` | **Unidade** / Filial | Unidade operacional isolada (cada filial da academia é um tenant) |
| `rede_id` / `REDE` | **Academia** / Rede | Organização-mãe que agrupa 1+ unidades (uma Academia tem N Unidades) |
| `PLATAFORMA` | SaaS admin | Operadores do ConceitoFit que gerenciam o produto |

**Convenção deste doc:** mantemos `tenant`/`rede` nos nomes técnicos (padrão multi-tenant do código existente), e usamos Unidade/Academia na prosa. Nomes de enum preservam `TENANT`/`REDE` para consistência com o resto do stack.

---

## Objetivo do épico

Construir um sistema **global e event-driven** de notificações in-app para o ConceitoFit. Qualquer domínio (CRM, Financeiro, Operacional, Comercial) emite eventos → `NotificacaoService` resolve audience (GLOBAL / REDE / TENANT / ROLE / USUARIO) → usuário vê no sino do header.

**Valor de negócio:**
- Operadores descobrem proativamente o que precisa de atenção (hoje dependem de relatórios / WhatsApp pessoal).
- Reduzir "blindspots" (contas vencendo, cadências escalando, prospects sem resposta — tudo centralizado).
- Fundação reutilizável: destrava `NOTIFICAR_GESTOR` (Story 3.27), futuros avisos de compliance, comunicados do SaaS, etc.

## Premissas e restrições

- **Fire-and-forget:** emissor só sabe `notificacao_id`. Delivery é resolvido em query time (lazy fan-out).
- **Idempotência obrigatória:** toda criação carrega `idempotency_key` único. Tentativa duplicada retorna existente.
- **Purga agressiva:** TTL obrigatório (`expira_em NOT NULL`), job diário deleta expiradas (hard delete, sem soft).
- **Tenant-awareness no FE:** query respeita `activeTenantId` da sessão — notificações TENANT/ROLE só aparecem quando a unidade correspondente está ativa; GLOBAL/REDE/USUARIO sempre visíveis a quem tem acesso.
- **Autorização GLOBAL:** só usuários `UserKind=PLATAFORMA` podem emitir notificação `AudienceTipo=GLOBAL`. Validado no service.
- **Real-time evolução:** polling 60s no MVP; SSE/WebSocket como Wave 7 quando volume justificar.
- **Sem snooze, sem ação inline:** usuário fecha (marca lida) ou expira; CTA sempre é URL de navegação.

## Decisões arquiteturais

### D1 — Audience multi-tipo

```java
public enum AudienceTipo {
  GLOBAL,    // todos usuários do SaaS (emissor restrito a PLATAFORMA)
  REDE,      // todos de uma Academia/Rede (cobre N Unidades) — sempre visível independente da unidade ativa
  TENANT,    // todos de uma Unidade específica — só visível quando unidade ativa == esse tenant
  ROLE,      // usuários com role X em uma Unidade — só visível quando unidade ativa == tenant + user tem a role
  USUARIO    // 1 usuário específico — sempre visível independente da unidade ativa
}
```

**Nota sobre REDE:** se um usuário tem acesso à Academia (ex: diretor geral), a notificação `AudienceTipo=REDE` aparece pra ele **em qualquer Unidade ativa** (inclusive se ele acabou de trocar de filial no switcher). Notificação `AudienceTipo=TENANT` é o oposto — só aparece quando aquela unidade específica está ativa na sessão.

### D2 — Lazy fan-out (não eager)

1 linha em `notificacao` + 1 linha por regra em `notificacao_audience`. Não pré-explode linha por usuário ao criar. Linha de `notificacao_leitura` só nasce quando usuário marca como lida.

**Economia:** em academia com 50 funcionários + 10 notificações/dia × 365 dias = 182.500 linhas/ano no modelo eager vs ~3.650 no lazy.

### D3 — Idempotência via `idempotency_key`

Convenção de chave por emissor (exemplos):
- `cadencia-escalada-{execucaoId}-{regraId}`
- `conta-vencida-{contaId}-{diasBucket}` (bucket 1/7/15/30 evita spam diário)
- `global-admin-{uuid-manual}`

`UNIQUE` constraint no DB — `INSERT ... ON CONFLICT DO NOTHING RETURNING id`. Se conflito, service faz `SELECT` e retorna existente.

### D4 — Metadata JSONB livre

Coluna `metadata_json JSONB NULL` permite emissor serializar payload arbitrário por tipo. FE renderiza template específico por `notificacao.tipo`.

Exemplos:
- `CADENCIA_ESCALADA`: `{cadenciaId, execucaoId, prospectNome, regraId, motivo}`
- `CONTA_VENCIDA`: `{contaId, valor, diasVencida, fornecedorNome}`
- `PAGAMENTO_RECEBIDO`: `{pagamentoId, valor, clienteNome, contratoId}`

### D5 — Filtro por Unidade ativa no FE

Query do sino passa `activeTenantId` (Unidade ativa da sessão). BE filtra:

```sql
WHERE EXISTS (
  SELECT 1 FROM notificacao_audience a WHERE a.notificacao_id = n.id AND (
    (a.tipo = 'GLOBAL')                                                       -- sempre
    OR (a.tipo = 'USUARIO' AND a.user_id = :userId)                           -- sempre
    OR (a.tipo = 'REDE'    AND a.rede_id = ANY(:userRedeIds))                 -- sempre (user tem acesso à Academia)
    OR (a.tipo = 'TENANT'  AND a.tenant_id = :activeTenantId)                 -- só quando Unidade ativa == tenant
    OR (a.tipo = 'ROLE'    AND a.tenant_id = :activeTenantId
                          AND a.role = ANY(:userRolesNoTenant))               -- só quando Unidade ativa E com role
  )
)
```

**Intuição:** usuário com acesso à Academia inteira (diretor, gerente regional) mantém notificações da Academia visíveis mesmo trocando de Unidade. Já notificações específicas de uma Unidade só aparecem quando ele está "dentro" dela.

### D6 — TTL obrigatório + purga hard

| Tipo | TTL default | Racional |
|------|-------------|----------|
| `CADENCIA_ESCALADA` | 14 dias | Ação operacional, curta vida útil |
| `CONTA_VENCIDA` | 60 dias | Ciclo financeiro mensal + margem |
| `PAGAMENTO_RECEBIDO` | 7 dias | Informativa |
| `ANIVERSARIANTE_CLIENTE` | 1 dia | Só relevante no dia |
| `PROSPECT_NOVO` | 30 dias | Follow-up window |
| `GLOBAL_AVISO_SISTEMA` | 30 dias | Comunicado do SaaS |
| `ADMIN_CUSTOM` | configurável | Admin define |

`NotificacaoPurgeJob` roda `@Scheduled(cron = "0 0 3 * * *")` com ShedLock. Hard delete, CASCADE apaga audience + leitura.

### D7 — Re-emissão de `requer_acao` não resolvido

Emissor decide. Ex: `CONTA_VENCIDA` emite em buckets 1/7/15/30 dias — bucket vira parte da `idempotency_key`. Usuário recebe re-aviso sem duplicação no mesmo bucket.

### D8 — Severidade visual

Sino no header tem:
- **Badge numérico** com count de não-lidas (igual padrão web comum)
- **Ícone `!` de alerta** adicional/destacado quando há pelo menos uma URGENTE não-lida
- **Sem pulsar/piscar** (descartado — agressivo demais para sistema B2B)

## Fora de escopo (futuros epics)

- **Multicanal:** email, push mobile, SMS, WhatsApp como canais de entrega. Fica em `epic-notificacoes-multicanal` quando mobile/SMTP estiverem maduros.
- **Snooze** (adiar notificação pra reaparecer depois).
- **Ação inline no dropdown** (botão "Aprovar" direto, sem navegar).
- **Digest diário por email** ("resumo do dia das suas notificações").
- **Canal dedicado por tipo:** ex: notificações financeiras irem pra UI financeira específica além do sino.
- **Analytics:** dashboard de "quais tipos mais gerados / menos lidos / ação não executada".

---

## Stories

Cada story pronta para `@sm *draft`. `@sm` expande título, descrição, tasks técnicas e File List.

### Wave 1 — Core BE (modulo-notificacoes)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.1** | Migration Flyway `V{ts}__notificacoes_schema.sql` (3 tabelas + índices + constraint de shape na audience) | M | — |
| **4.2** | Entidades JPA: `NotificacaoEntity` + `NotificacaoAudienceEntity` + `NotificacaoLeituraEntity` + enums (`AudienceTipo`, `NotificacaoSeveridade`) | M | 4.1 |
| **4.3** | Repositories: `NotificacaoRepository` + `NotificacaoAudienceRepository` + `NotificacaoLeituraRepository` com queries customizadas (listar por usuário com filtro de unidade ativa, ver D5) | M | 4.2 |
| **4.4** | `NotificacaoService.criar(request)` com idempotência via `ON CONFLICT DO NOTHING` + validação de autorização GLOBAL (só `UserKind=PLATAFORMA`) + testes | L | 4.3 |
| **4.5** | `NotificacaoService.listarParaUsuario(userId, activeTenantId)` resolvendo audience via query D5 + paginação (cursor-based por `criada_em DESC`) + testes | L | 4.3 |
| **4.6** | `NotificacaoService.marcarLida(notificacaoId, userId)` + `executarAcao(notificacaoId, userId)` (upsert em leitura) + testes | S | 4.3 |
| **4.7** | `NotificacaoPurgeJob` com `@Scheduled(cron)` + ShedLock + config opt-in via property | S | 4.2 |
| **4.8** | Evento `NotificacaoCriadaEvent` publicado via `ApplicationEventPublisher` após persist — permite futuros listeners (email/push) | XS | 4.4 |

### Wave 2 — Endpoints REST BE

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.9** | `GET /api/v1/notificacoes/minhas?tenantId={activeId}&apenasNaoLidas=false&limit=50&cursor=` — retorna lista paginada filtrada por D5 | M | 4.5 |
| **4.10** | `POST /api/v1/notificacoes/{id}/marcar-lida?tenantId=` + `POST /api/v1/notificacoes/{id}/acao?tenantId=` (idempotentes) | S | 4.6 |
| **4.11** | `POST /api/v1/notificacoes` — endpoint admin para criar manual (audit log + autorização PLATAFORMA se GLOBAL) | S | 4.4 |
| **4.12** | `GET /api/v1/notificacoes/contadores?tenantId=` — retorna `{naoLidas, urgentesNaoLidas}` para o badge do sino (endpoint leve, cacheável) | S | 4.5 |

### Wave 3 — Substitui `NOTIFICAR_GESTOR` (fecha Story 3.27)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.13** | `CadenciaEscaladaListener` (modulo-crm) consumindo `CadenciaEscaladaEvent` → chama `NotificacaoService.criar(tipo=CADENCIA_ESCALADA, audiencia=ROLE(tenantId, GERENTE_COMERCIAL), severidade=URGENTE, metadata={...})` | M | 4.4 |
| **4.14** | Remover `log.warn` stub do `CrmProcessOverdueService.executarAcaoEscalacao()` para `NOTIFICAR_GESTOR` — agora chama evento que o listener converte em notificação | XS | 4.13 |
| **4.15** | Testes integração BE: escalação NOTIFICAR_GESTOR → assert notificação criada com audience ROLE correta | M | 4.13 |
| **4.16** | Atualizar `CADENCIAS_CRM.md` §6.4 (remover "[stub — ver débito 3.27]") + §14.3 marca 3.27 como ✅ RESOLVIDO via Epic 4 | XS | 4.13 |

### Wave 4 — Core FE (sino + dropdown + página)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.17** | Tipos TS em `src/lib/shared/types/notificacao.ts` espelhando entities + enums + adapter `src/lib/api/notificacoes.ts` | M | 4.9 |
| **4.18** | Hook `useNotifications(activeTenantId)` com react-query + polling 60s + cache | M | 4.17 |
| **4.19** | `<NotificationBell />` no header — badge numérico de não-lidas + ícone `!` adicional quando há URGENTE não-lida (condicional) + click abre dropdown | M | 4.18 |
| **4.20** | `<NotificationDropdown />` popover shadcn com até 10 últimas + ícone por tipo + "há X tempo" + CTA opcional + "Ver todas" link | L | 4.18 |
| **4.21** | Página `/notificacoes` com lista completa + filtros (tipo, severidade, lida/não-lida) + paginação cursor | M | 4.18 |
| **4.22** | Mutation `marcarLida` com optimistic update + mutation `executarAcao` (click em CTA marca lida + navega) | S | 4.18 |

### Wave 5 — Admin SaaS (emissão GLOBAL)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.23** | Página `/admin/notificacoes/emitir` no backoffice (só PLATAFORMA) — form react-hook-form + zod com padrão `onTouched + canSave` | M | 4.11 |
| **4.24** | Audience picker: Select de escopo (GLOBAL/REDE/TENANT/ROLE/USUARIO) + campos condicionais (select de rede, tenant, role, user) | L | 4.23 |
| **4.25** | Audit log visualizável em `/admin/notificacoes/historico` — lista emissões manuais com quem+quando+escopo | M | 4.23 |

### Wave 6 — Preferências por usuário

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.26** | Tabela `user_notification_preference(user_id, tipo, ativo)` + migration + entity | S | 4.1 |
| **4.27** | Filtro em `listarParaUsuario` respeita preferências (default: todos tipos ativos) | S | 4.5, 4.26 |
| **4.28** | Página `/meu-perfil/notificacoes` (usuário) — toggle por tipo + salvar | M | 4.26 |

### Wave 7 — Integrações de exemplo (dogfooding)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.29** | Listener `ContaVencidaEvent` (modulo-financeiro) com dedupe por bucket (1/7/15/30 dias) | M | 4.4 |
| **4.30** | Listener `PagamentoRecebidoEvent` (modulo-financeiro) com severidade INFO e TTL curto | S | 4.4 |
| **4.31** | Listener `ProspectNovoEvent` (modulo-crm) notificando role `VENDEDOR` do tenant | S | 4.4 |

### Wave 8 — Real-time (SSE)

| ID | Título curto | Tamanho | Dependências |
|----|--------------|---------|--------------|
| **4.32** | Endpoint SSE `GET /api/v1/notificacoes/stream?tenantId=` emitindo `NotificacaoCriadaEvent` filtrado por audience do user | L | 4.8 |
| **4.33** | FE: substituir polling do `useNotifications` por EventSource com reconexão automática (fallback polling se SSE indisponível) | L | 4.32 |

---

## Spikes técnicos pré-épico

| Spike | Pergunta | Bloqueia |
|-------|----------|----------|
| **SP-1** | Quais roles existem no sistema? `userKind-taxonomy` da memória menciona PLATAFORMA/OPERADOR/CLIENTE — mas role granular (GERENTE_COMERCIAL, RECEPCIONISTA, etc.) vive onde? | 4.4 validação + 4.13 audience |
| **SP-2** | Como descobrir `userRedeIds` (ids das Academias que o user tem acesso)? No domínio ConceitoFit: Academia/Rede agrupa N Unidades/Tenants. Entidade `Academia` existe em qual módulo? Tabela de associação user↔academia vs user↔tenant? | 4.5 query D5 |
| **SP-3** | SSE no stack atual — `spring-web` SseEmitter funciona bem com múltiplos pods atrás de LB? Precisa sticky session? | 4.32 |
| **SP-4** | UI padrão de `popover` no projeto — shadcn Popover ou DropdownMenu? Conferir componentes existentes no header | 4.20 |

---

## Dependências externas

- **Módulo Auth / User** (existe) — leitura de `userId`, `userRoles`, `userRedeIds` (Academias acessíveis), `activeTenantId` (Unidade ativa), `userKind` via sessão
- **Módulo de Academias/Redes** (existe? spike SP-2) — entidade Academia agrupando Unidades
- **Módulo CRM** (existe) — emite `CadenciaEscaladaEvent` já (Wave 3 do Epic 3)
- **Módulo Financeiro** — precisa emitir `ContaVencidaEvent` / `PagamentoRecebidoEvent` (Wave 7 pode incluir adição desses eventos se ainda não existirem)

## Métricas de sucesso

1. **Adoção:** % de usuários que abriram o sino pelo menos 1x por semana (alvo: >70% após 30 dias de rollout)
2. **Engagement:** taxa de click em CTA (alvo: >25% pra URGENTE, >5% pra INFO)
3. **Dedupe:** contagem de `INSERT ON CONFLICT` evitados (monitorar — se >50%, revisar `idempotency_key` do emissor)
4. **Storage:** tamanho da tabela `notificacao` após 90 dias (alvo: <1GB com purga funcionando)
5. **Zero regressão** em fluxos existentes (CRM cadências, financeiro) durante integração

## Riscos do epic

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Query do sino ficar lenta em academia grande | Média | Alto | Índices bem dimensionados (§SCHEMA abaixo) + cache via endpoint `/contadores` separado + paginação cursor |
| Emissor mal-comportado spammar notificações | Média | Médio | Idempotency key por convenção + monitoramento de emissões duplicadas no job de purga |
| SSE falhar em produção multi-pod | Baixa | Baixo | Wave 8 só depois das outras maduras; polling continua como fallback |
| Role granular não existir ainda | Alta | Alto | SP-1 primeiro; se não existir, audience ROLE vira fase 2 e 4.13 usa TENANT por enquanto |

---

## Schema DB (resumo — Wave 1)

```sql
CREATE TABLE notificacao (
  id UUID PRIMARY KEY,
  idempotency_key VARCHAR(200) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL,
  severidade VARCHAR(20) NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensagem VARCHAR(1000) NOT NULL,
  acao_url VARCHAR(500) NULL,
  acao_label VARCHAR(100) NULL,
  requer_acao BOOLEAN NOT NULL DEFAULT false,
  criada_em TIMESTAMP NOT NULL DEFAULT now(),
  expira_em TIMESTAMP NOT NULL,
  metadata_json JSONB NULL,
  CONSTRAINT notificacao_severidade_chk CHECK (severidade IN ('INFO','AVISO','URGENTE'))
);
CREATE INDEX notificacao_expira_idx ON notificacao(expira_em);
CREATE INDEX notificacao_criada_idx ON notificacao(criada_em DESC);

CREATE TABLE notificacao_audience (
  id UUID PRIMARY KEY,
  notificacao_id UUID NOT NULL REFERENCES notificacao(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  rede_id UUID NULL,
  tenant_id UUID NULL,
  role VARCHAR(50) NULL,
  user_id UUID NULL,
  CONSTRAINT notificacao_audience_tipo_chk CHECK (tipo IN ('GLOBAL','REDE','TENANT','ROLE','USUARIO')),
  CONSTRAINT notificacao_audience_shape_chk CHECK (
    (tipo = 'GLOBAL'  AND rede_id IS NULL AND tenant_id IS NULL AND role IS NULL AND user_id IS NULL)
    OR (tipo = 'REDE'    AND rede_id IS NOT NULL AND tenant_id IS NULL AND role IS NULL AND user_id IS NULL)
    OR (tipo = 'TENANT'  AND tenant_id IS NOT NULL AND rede_id IS NULL AND role IS NULL AND user_id IS NULL)
    OR (tipo = 'ROLE'    AND tenant_id IS NOT NULL AND role IS NOT NULL AND rede_id IS NULL AND user_id IS NULL)
    OR (tipo = 'USUARIO' AND user_id IS NOT NULL AND rede_id IS NULL AND tenant_id IS NULL AND role IS NULL)
  )
);
CREATE INDEX notificacao_audience_notif_idx ON notificacao_audience(notificacao_id);
CREATE INDEX notificacao_audience_tenant_role_idx ON notificacao_audience(tenant_id, role) WHERE tenant_id IS NOT NULL;
CREATE INDEX notificacao_audience_rede_idx ON notificacao_audience(rede_id) WHERE rede_id IS NOT NULL;
CREATE INDEX notificacao_audience_user_idx ON notificacao_audience(user_id) WHERE user_id IS NOT NULL;

CREATE TABLE notificacao_leitura (
  notificacao_id UUID NOT NULL REFERENCES notificacao(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  lida_em TIMESTAMP NOT NULL DEFAULT now(),
  acao_executada_em TIMESTAMP NULL,
  PRIMARY KEY (notificacao_id, user_id)
);
```

(Wave 6 adiciona `user_notification_preference`.)

---

## Handoff

**Próximo passo:** `@sm *draft 4.1` — Wave 1 primeiro, sequencial até 4.8 (schema é base).

**Sequenciamento obrigatório:**
- Waves 1 → 2 → 3 → 4 devem ir em ordem (schema → endpoints → integração CRM → FE).
- Wave 3 **substitui Story 3.27** — confirmar com PO antes de começar.
- Wave 5 (admin) pode ir em paralelo com Wave 4.
- Wave 6 (preferências) só depois da 4 estabilizada.
- Wave 7 (dogfooding outros domínios) incremental, pode paralelizar por domínio.
- Wave 8 (SSE) última, opcional — polling é suficiente até volume crescer.

**Responsáveis por fase:**
- `@architect` — spikes SP-1 a SP-4 + ADR do módulo novo
- `@sm *draft` — cada story
- `@po *validate-story-draft` — 10-point checklist
- `@dev` — implementação
- `@qa *qa-gate` — ao final de cada story
- `@devops *push` — PR e merge

**Story 3.27 (Cadências):** marcar como "Substituída pelo Epic 4 Wave 3 (stories 4.13-4.16)" antes de começar Wave 3.

---

*— Pax + Aria, desenhando a fundação de avisos do sistema 📢*
