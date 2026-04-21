# Story VUN-5.7 — [BE] Jobs `AgregadorCicloJob`, `PlanoInativacaoJob` + `DireitoAcessoQueryService` + purge facial

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Backend) |
| **Agent** | @dev (Dex — backend Java) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | L |
| **Branch** | `feat/vun-5.7-jobs-inativacao-purge` |
| **Repos** | `academia-java/modulo-agregadores/` + `modulo-catraca/` + `modulo-academia/` |

---

## Contexto

PRD §7.3, §8.2 e §8.3 definem jobs de inativação + purge facial automática (RN-001, RN-002, RN-003). Centraliza lógica em:
- `PlanoInativacaoJob` (`modulo-catraca` — diário) — detecta `plano.dataFim < hoje`, marca inativo, purga facial.
- `AgregadorCicloJob` (`modulo-agregadores` — diário) — detecta vínculo agregador com `ultimaVisita + N dias < hoje`, marca inativo, purga facial se sem outros vínculos.
- `DireitoAcessoQueryService` (`modulo-academia` — opção B do PRD §8.4) — service agregador que responde "aluno X tem vínculo ativo?".
- Endpoint `POST /catraca/purge-facial/{alunoId}` (idempotente).

---

## Problema / Objetivo

**Problema:** hoje sem job, biometria fica retida pós-vencimento (risco LGPD + satura iDFace MAX de 10.000 faces).

**Objetivo:** compliance LGPD + sustentabilidade do iDFace.

---

## Acceptance Criteria

1. **AC1** — `DireitoAcessoQueryService.java` em `modulo-academia` expõe `temVinculoAtivo(alunoId): boolean` — consulta `modulo-comercial` (matriculas), `modulo-pacote` e `modulo-agregadores` via ports.
2. **AC2** — `PlanoInativacaoJob` em `modulo-catraca` (`@Scheduled cron = "0 5 0 * * *"` — 00:05 diário):
   - busca planos com `dataFim < hoje`
   - marca aluno inativo via `modulo-academia`
   - chama `DireitoAcessoQueryService.temVinculoAtivo(alunoId)`: se `false`, POST `/catraca/purge-facial/{alunoId}`
   - publica evento `FacialPurgadaPorInativacao` (retenção 5 anos)
3. **AC3** — `AgregadorCicloJob` em `modulo-agregadores` (`@Scheduled cron = "0 10 0 * * *"` — 00:10 diário):
   - busca `AgregadorUsuarioEntity` com status ATIVO e `lastCheckinAt + N dias < hoje` (N por agregador×unidade — `AgregadorConfigEntity`)
   - marca `status = INATIVO`
   - checa outros vínculos via `DireitoAcessoQueryService`; se sem, purge facial
4. **AC4** — Endpoint `POST /catraca/purge-facial/{alunoId}` em `modulo-catraca`:
   - idempotente: se já purgado, retorna 200 OK sem erro
   - remove facial do iDFace via adapter existente
   - retorna 200 `{ purged: bool, razao: string }`
5. **AC5** — Testes unit + integração (jobs, service, endpoint).
6. **AC6** — Feature flag `catraca.facial.purge.enabled` (default false) — permite rollout gradual.
7. **AC7** — Métricas expostas: `facial_purge_count`, `vinculo_inativado_count` por tipo de inativação.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `DireitoAcessoQueryService.java` | Service agregador (modulo-academia) |
| `PlanoInativacaoJob.java` | Job diário (modulo-catraca) |
| `AgregadorCicloJob.java` | Job diário (modulo-agregadores) |
| `PurgeFacialController.java` | Endpoint (modulo-catraca) |
| Tests unit + integração | — |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| Adapter iDFace existente (modulo-catraca) | Expor método `removerFacial(alunoId)` idempotente |

---

## Tasks

- [ ] **T1** Implementar `DireitoAcessoQueryService` com 3 ports (AC1)
- [ ] **T2** `PlanoInativacaoJob` (AC2)
- [ ] **T3** `AgregadorCicloJob` (AC3)
- [ ] **T4** Endpoint purge facial (AC4)
- [ ] **T5** Feature flag (AC6)
- [ ] **T6** Métricas (AC7)
- [ ] **T7** Testes (AC5)

---

## Dependências

- **Bloqueadoras:** VUN-5.4, VUN-5.5
- **Desbloqueia:** — (última story backend)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Purge facial dispara em falso positivo (aluno tem vínculo mas service responde false) | Média | Crítico | Feature flag AC6; rollout gradual por tenant; alertar recepção no primeiro evento |
| Job @Scheduled rodar em todas as instâncias (multi-node) | Alta | Alto | Usar ShedLock; seguir padrão existente |
| iDFace falhar no purge (rede/dispositivo down) | Média | Médio | Retry + dead-letter-queue; evento `FacialPurgaFalhou` para reconciliação manual |

---

## Test plan

1. **Unit** — cada job com service mockado; service com 3 ports mockados.
2. **Integração** — end-to-end com BD em memória: plano vence → job → aluno inativo → facial purgada.
3. **Regressão** — operações normais de facial (cadastro, atualização) continuam OK.

---

*Gerada por @sm (River)*
