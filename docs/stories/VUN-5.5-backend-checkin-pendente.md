# Story VUN-5.5 — [BE] `AgregadorCheckinPendenteEntity` + sinks + `CheckinExpiradoJob`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Backend) |
| **Agent** | @dev (Dex — backend Java) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Crítica |
| **Complexity** | M |
| **Branch** | `feat/vun-5.5-checkin-pendente` |
| **Repo** | `academia-java/modulo-agregadores/` |

---

## Contexto

PRD §8.2 e §8.3 introduzem `AgregadorCheckinPendenteEntity` como "memória de curto prazo" do backend. Quando o webhook HMAC do Wellhub/TotalPass chega, cria-se um pendente com TTL (RN-015: 60 min default). Catraca consome no validate síncrono (VUN-5.6).

---

## Problema / Objetivo

**Problema:** hoje webhook não persiste nada — catraca não tem como validar se há check-in legítimo.

**Objetivo:** ponte de estado webhook → catraca.

---

## Acceptance Criteria

1. **AC1** — Migração Flyway cria tabela `agregador_checkin_pendente`:
   - `id UUID PK`
   - `tenant_id UUID NOT NULL`
   - `vinculo_id UUID NOT NULL REFERENCES agregador_usuario(id)`
   - `agregador_id UUID NOT NULL`
   - `usuario_externo_id VARCHAR(128) NOT NULL`
   - `criado_em TIMESTAMP NOT NULL`
   - `expira_em TIMESTAMP NOT NULL`
   - `status VARCHAR(16) NOT NULL CHECK IN ('PENDENTE','CONSUMIDO','EXPIRADO')`
2. **AC2** — Entity + Repository JPA.
3. **AC3** — Atualizar `WellhubCheckinSink.java` para, ao receber webhook HMAC válido:
   - buscar `AgregadorUsuarioEntity` via `findAtivoBy...`
   - criar `AgregadorCheckinPendenteEntity` com `expira_em = now + TTL` (TTL por agregador×unidade, default 60 min — RN-015 + RN-004)
   - publicar evento `CheckinPendenteCriado(vinculoId, alunoId)` no bus interno
4. **AC4** — Mesma lógica em `TotalPassAdapter.java` (sink equivalente).
5. **AC5** — `CheckinExpiradoJob` (`@Scheduled` fixedRate 5 min) varre pendentes `PENDENTE` com `expira_em < now` e marca `EXPIRADO`.
6. **AC6** — TTL configurável via `AgregadorConfigEntity` (já existe) — RN-004.
7. **AC7** — Testes unitários + integração (job, sinks, entity).

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `V{timestamp}__criar_checkin_pendente.sql` | Migração |
| `AgregadorCheckinPendenteEntity.java` | Entity |
| `AgregadorCheckinPendenteRepository.java` | Repository |
| `CheckinExpiradoJob.java` | Job @Scheduled |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `WellhubCheckinSink.java` | Criar pendente ao receber webhook |
| `WellhubCheckinAppSink.java` | Idem (se diferente caminho) |
| `WellhubBookingSink.java` | Idem (se aplicável) |
| `TotalPassAdapter.java` | Sink equivalente |

---

## Tasks

- [ ] **T1** Migração + entity + repository (AC1, AC2)
- [ ] **T2** Adequar sinks (AC3, AC4)
- [ ] **T3** Job @Scheduled (AC5)
- [ ] **T4** Config TTL via `AgregadorConfigEntity` (AC6)
- [ ] **T5** Testes (AC7)
- [ ] **T6** Publicar evento `CheckinPendenteCriado` no bus existente (ver infra pub/sub do projeto)

---

## Dependências

- **Bloqueadoras:** VUN-5.4
- **Desbloqueia:** VUN-5.6, VUN-5.8

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Webhook HMAC mal validado → check-in forjado | Alta | Alto | Validação HMAC já existe (`WellhubCheckinSink`); não mexer sem testes |
| Job @Scheduled não rodar em ambientes multi-instance | Média | Alto | Usar ShedLock ou flag "single-node scheduler"; seguir padrão existente do projeto |
| TTL padrão 60 min curto demais para fluxo real | Média | Médio | Configurável por unidade via `AgregadorConfigEntity` (RN-004) |

---

## Test plan

1. **Unit** sinks criam pendente com TTL correto.
2. **Integração** job expira itens vencidos.
3. **Regressão** webhook HMAC continua rejeitando assinaturas inválidas.

---

*Gerada por @sm (River)*
