# Story VUN-5.6 — [BE] `POST /catraca/validar-entrada` síncrono + consumo em `academia-gestao-acesso`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Backend + Catraca) |
| **Agent** | @dev (Dex — backend Java + catraca) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Crítica |
| **Complexity** | L |
| **Branch** | `feat/vun-5.6-validar-entrada-sincrono` |
| **Repos** | `academia-java/modulo-agregadores/` + `academia-gestao-acesso/` |

---

## Contexto

PRD §8.3 detalha a sequência completa do happy path agregador — webhook cria pendente (VUN-5.5), catraca consulta síncrono, backend chama `WellhubAdapter.validate(gate_trigger)`, cria `AgregadorVisitaEntity`, responde LIBERA/NEGA. Política default `STRICT` (**RN-009**).

---

## Problema / Objetivo

**Problema:** catraca atualmente não tem endpoint síncrono → aluno agregador pode entrar sem check-in legítimo (fraude/conflito).

**Objetivo:** validação em tempo real com política STRICT.

---

## Acceptance Criteria

1. **AC1** — Novo endpoint `POST /catraca/validar-entrada` no `modulo-agregadores` aceita payload `{ alunoId, unidadeId, biometriaConfianca }` e retorna:
   - 200 `{ liberar: true, visitaId: UUID }` — happy path
   - 403 `{ code: "MISSING_CHECKIN", mensagem }` — sem pendente
   - 403 `{ code: "VALIDATE_FAILED", mensagem }` — Wellhub validate retornou 5xx
   - 403 `{ code: "NO_VINCULO_ATIVO", mensagem }` — aluno não tem vínculo agregador
2. **AC2** — Lógica (PRD §8.3):
   1. Buscar `AgregadorUsuarioEntity` ativo do aluno
   2. Se não tem vínculo agregador → 403 NO_VINCULO_ATIVO (fluxo segue para outra modalidade)
   3. Buscar `AgregadorCheckinPendenteEntity` válido → se não acha, 403 MISSING_CHECKIN
   4. Chamar `WellhubAdapter.validate(gate_trigger)` (ou `TotalPassAdapter` equivalente) — síncrono
      - 200 → criar `AgregadorVisitaEntity`, marcar pendente CONSUMIDO, 200 LIBERA
      - 5xx/404 → STRICT 403 VALIDATE_FAILED + publicar evento `CheckinValidacaoFalhou` para cockpit (VUN-5.8)
3. **AC3** — Em `academia-gestao-acesso/` (repo catraca), atualizar serviço local para chamar o novo endpoint no `gate_trigger`, e mapear respostas:
   - 200 → abre catraca
   - 403 MISSING_CHECKIN → display "Abra o Gympass antes de entrar"
   - 403 VALIDATE_FAILED → display "Falha temporária — procurar a recepção"
   - 403 NO_VINCULO_ATIVO → fluxo continua para outras modalidades (plano, pacote)
4. **AC4** — Latência total (catraca → backend → Wellhub → backend → catraca) < 2s (p95). Timeout do validate Wellhub configurável (default 1500ms).
5. **AC5** — Eventos auditáveis: cada negação registra `CatracaNegouEntrada(alunoId, codigo, ts)`; cada liberação `CatracaLiberouEntrada(alunoId, visitaId, ts)`.
6. **AC6** — Testes unit + integração backend; testes manual catraca com conta Wellhub de sandbox.
7. **AC7** — **Feature flag** `catraca.agregador.strict.enabled` (default false em prod inicialmente) — permite ligar gradualmente.

---

## Escopo técnico

### Arquivos a criar (backend)

| Arquivo | Descrição |
|---------|-----------|
| `CatracaValidarEntradaController.java` | Endpoint |
| `CatracaValidarEntradaService.java` | Lógica orquestradora |

### Arquivos a alterar (backend)

| Arquivo | Ação |
|---------|------|
| `WellhubAdapter.java` | Confirmar método `validate(gate_trigger)` (PRD §2.3 diz já existir — validar) |
| `TotalPassAdapter.java` | Idem |
| `AgregadorVisitaEntity.java` | Campo `checkinPendenteId` (FK) |

### Arquivos a alterar (catraca)

| Arquivo | Ação |
|---------|------|
| `academia-gestao-acesso/...` (TBD no spike) | Chamar novo endpoint no `gate_trigger` |

---

## Tasks

- [ ] **T1 — Spike SP-VUN-1** confirmar HTTP síncrono <1s catraca→backend (listado no VUN-0-index)
- [ ] **T2 — Spike SP-VUN-2** validar `WellhubAdapter.validate(gate_trigger)` em ambiente de teste
- [ ] **T3** Controller + Service (AC1, AC2)
- [ ] **T4** Adapter changes em `academia-gestao-acesso` (AC3)
- [ ] **T5** Timeout + latência (AC4)
- [ ] **T6** Eventos auditáveis (AC5)
- [ ] **T7** Feature flag (AC7)
- [ ] **T8** Testes unit + integração + manual (AC6)

---

## Dependências

- **Bloqueadoras:** VUN-5.5
- **Desbloqueia:** operação em produção do fluxo agregador completo

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Wellhub API indisponível | Alta | Crítico | Feature flag AC7 permite rollback rápido; RN-019 "Liberar manualmente" no cockpit (VUN-5.8) |
| Latência > 2s quebra UX recepção | Média | Alto | Timeout 1500ms (AC4) + fallback STRICT nega |
| Spike SP-VUN-2 revelar que `validate()` não está realmente funcional | Média | Crítico | Se confirmado, story bloqueia até fix do adapter (pode virar sub-story) |
| Webhook chega após gate_trigger (corrida) | Média | Médio | TTL 60min (VUN-5.5) + mensagem catraca "abra o app" dá tempo pro aluno regularizar |

---

## Test plan

1. **Unit** service em 4 cenários (AC1).
2. **Integração** endpoint com adapter mockado.
3. **Manual catraca** conta Wellhub sandbox (5 cenários).
4. **Carga** — 50 gate_trigger/min por 5 minutos para medir p95.

---

*Gerada por @sm (River)*
