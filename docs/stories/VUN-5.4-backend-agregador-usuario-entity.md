# Story VUN-5.4 — [BE] Evolução `AgregadorUsuarioEntity` + `AgregadorVinculoService` + `POST /api/v1/agregadores/vinculos`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Backend) |
| **Agent** | @dev (Dex — backend Java) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Crítica |
| **Complexity** | L |
| **Branch** | `feat/vun-5.4-agregador-usuario-evolucao` |
| **Repo** | `academia-java/modulo-agregadores/` |

---

## Contexto

PRD §2.3 e §8.2 fixam a decisão arquitetural: **evoluir `AgregadorUsuarioEntity`** (migração aditiva) em vez de criar entidade nova. Adiciona os campos do contrato B2B permanente preservando compatibilidade com `WellhubAdapter.java` e `TotalPassAdapter.java`.

Campos já existentes: `id`, `tenantId`, `agregador`, `externalUserId`, `customCode`, `status`, `lastCheckinAt`, `createdAt`, `updatedAt`.

Campos a adicionar:
- `aluno_id` (FK `Aluno`, NULLABLE no primeiro release para backfill)
- `data_inicio` (timestamp)
- `data_fim` (timestamp nullable = sem prazo)
- `ciclo_expira_em` (derivado de `lastCheckinAt + N dias`)
- `metadata_json` (jsonb)

Campo `status` ganha constraint explícita `ATIVO|INATIVO|SUSPENSO`.

---

## Problema / Objetivo

**Problema:** sem `aluno_id` persistido, vínculo agregador não liga a taxonomia de cliente; sem `data_inicio/data_fim`, não há contrato temporal.

**Objetivo:** migração aditiva + service + endpoint criando vínculo, preparando base para VUN-5.5 e VUN-5.7.

---

## Acceptance Criteria

1. **AC1** — Migração Flyway em `modulo-agregadores/src/main/resources/db/migration/` com nome `V{YYYY_MM_DD_HHmm}__evoluir_agregador_usuario.sql` (seguindo convenção do projeto — ver memory "Migration naming"):
   - Adiciona `aluno_id UUID NULL REFERENCES aluno(id)`
   - Adiciona `data_inicio TIMESTAMP NULL`
   - Adiciona `data_fim TIMESTAMP NULL`
   - Adiciona `ciclo_expira_em TIMESTAMP NULL`
   - Adiciona `metadata_json JSONB NULL`
   - Constraint `status` = check (`ATIVO|INATIVO|SUSPENSO`)
2. **AC2** — `AgregadorUsuarioEntity.java` atualizada com os novos campos (JPA annotations + getters/setters).
3. **AC3** — Novo `AgregadorVinculoService.java` com método `criarVinculo(tenantId, alunoId, agregador, externalUserId, dataInicio, metadata): AgregadorUsuarioEntity`.
4. **AC4** — Service faz validação: se já existe vínculo ativo para (tenantId, agregador, externalUserId), retorna 409 conflict.
5. **AC5** — Endpoint REST `POST /api/v1/agregadores/vinculos` expõe o service; payload alinhado com frontend VUN-5.2.
6. **AC6** — Backfill: script em `modulo-agregadores/src/main/java/.../backfill/AgregadorAlunoBackfillJob.java` que para cada `AgregadorUsuarioEntity` com `aluno_id NULL`, tenta resolver via `externalUserId → AgregadorVisitaEntity.visitanteId → Aluno`. Linhas sem match ficam `NULL` (reconciliação manual).
7. **AC7** — Testes unitários do service (happy, 409, validação).
8. **AC8** — Teste de integração do endpoint com banco de teste.
9. **AC9** — Adapters `WellhubAdapter.java` e `TotalPassAdapter.java` continuam funcionais (regressão).
10. **AC10** — Compat: método existente `AgregadorUsuarioRepository.findFirstByTenantIdAndAgregadorAndExternalUserId` continua funcionando.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `modulo-agregadores/src/main/resources/db/migration/V{timestamp}__evoluir_agregador_usuario.sql` | Migração Flyway |
| `modulo-agregadores/src/main/java/.../AgregadorVinculoService.java` | Service |
| `modulo-agregadores/src/main/java/.../AgregadorVinculoController.java` | Endpoint REST |
| `modulo-agregadores/src/main/java/.../backfill/AgregadorAlunoBackfillJob.java` | Job de backfill |
| Tests unitários + integração | — |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `AgregadorUsuarioEntity.java` | Adicionar campos novos |
| `AgregadorUsuarioRepository.java` | Adicionar query `findAtivoByTenantIdAndAgregadorAndExternalUserId` |

---

## Tasks

- [ ] **T1** Criar migração Flyway com convenção `YYYY_MM_DD_HHmm` (AC1)
- [ ] **T2** Atualizar entity (AC2)
- [ ] **T3** Service `AgregadorVinculoService` (AC3, AC4)
- [ ] **T4** Endpoint REST (AC5)
- [ ] **T5** Job de backfill (AC6)
- [ ] **T6** Testes unit + integração (AC7, AC8)
- [ ] **T7** Regressão em `WellhubAdapter` / `TotalPassAdapter` (AC9, AC10)

---

## Dependências

- **Bloqueadoras:** nenhuma (é a fundação do backend Fase 5)
- **Desbloqueia:** VUN-5.2 (frontend modal), VUN-5.5, VUN-5.7

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Backfill inconsistente — linhas órfãs `aluno_id NULL` | Alta | Médio | Aceitação parcial (linhas sem match ficam `NULL`, reconciliadas manualmente no próximo check-in — §13 do PRD) |
| Colisão de migração Flyway entre módulos | Média | Alto | Seguir convenção `YYYY_MM_DD_HHmm` (memory "Migration naming") |
| Constraint `status` quebrar registros existentes | Média | Alto | Antes da constraint, UPDATE de normalização: `UPDATE ... SET status='ATIVO' WHERE status NOT IN ('ATIVO','INATIVO','SUSPENSO')` |

---

## Test plan

1. **Unit** service em 3 casos (happy, 409, validação).
2. **Integração** endpoint com `@SpringBootTest` + H2/Testcontainers.
3. **Regressão** testes existentes dos adapters.
4. **Backfill dry-run** em cópia de produção (staging) para medir taxa de match.

---

*Gerada por @sm (River)*
