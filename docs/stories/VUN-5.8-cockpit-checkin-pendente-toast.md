# Story VUN-5.8 — [FE] Cockpit recebe SSE/WebSocket "CheckinPendenteCriado" → toast lateral recepção

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Frontend) |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Média |
| **Complexity** | M |
| **Branch** | `feat/vun-5.8-cockpit-checkin-toast` |

---

## Contexto

PRD §9.3 e §8.3 descrevem: quando webhook HMAC chega (VUN-5.5), backend publica evento `CheckinPendenteCriado` que o cockpit da recepção deve exibir como toast lateral ("Maria fez check-in Gympass — chegando em breve"). Também exibir toast negativo no sad path `CheckinValidacaoFalhou` (VUN-5.6) com ação "Liberar manualmente" (RN-019 — perfil Alto).

---

## Problema / Objetivo

**Problema:** recepção hoje não tem visibilidade de check-ins em fila — só fica sabendo quando aluno chega na catraca.

**Objetivo:** feedback em tempo real para preparar atendimento.

---

## Acceptance Criteria

1. **AC1** — Novo hook `src/hooks/use-checkin-pendente-stream.ts` abre conexão SSE ou WebSocket (a escolher conforme SP-VUN-3) ao `/api/v1/cockpit/stream`.
2. **AC2** — Hook emite evento `CheckinPendenteCriado(vinculoId, alunoNome, agregador, expiraEm)` → cockpit mostra toast lateral persistente (não auto-dismiss) com nome do aluno + contador "expira em N min".
3. **AC3** — Evento `CheckinValidacaoFalhou(alunoId, codigo, erro)` → toast de erro com botão "Liberar manualmente" — só aparece para usuários com perfil Alto (RN-019); ação dispara endpoint auditado.
4. **AC4** — Reconexão automática com backoff exponencial (1s, 2s, 5s, 10s, 30s).
5. **AC5** — Hook só conecta quando cockpit `/vendas/nova` está aberto; desconecta ao navegar away.
6. **AC6** — Toasts empilham até 3 visíveis; restantes colapsam em "+N check-ins pendentes".
7. **AC7** — Teste E2E com mock de stream.
8. **AC8** — Se SP-VUN-3 indicar ausência de infra SSE/WS, fallback polling `GET /api/v1/cockpit/checkins-pendentes` a cada 20s — story passa de M para S (reescopar antes de iniciar).

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/hooks/use-checkin-pendente-stream.ts` | Hook de stream |
| `src/components/cockpit/checkin-pendente-toast.tsx` | Toast lateral customizado |
| `src/lib/api/cockpit-stream.ts` | Client (SSE/WS ou polling) |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/page.tsx` | Montar hook condicional à flag `catraca.agregador.strict.enabled` |

---

## Tasks

- [ ] **T1 — Spike SP-VUN-3** confirmar infra SSE/WS no projeto (AC8 fallback)
- [ ] **T2** Hook de stream (AC1, AC4, AC5)
- [ ] **T3** Toast lateral customizado (AC2, AC6)
- [ ] **T4** Evento `CheckinValidacaoFalhou` + ação "Liberar manualmente" (AC3)
- [ ] **T5** Reconexão + backoff (AC4)
- [ ] **T6** E2E mockado (AC7)

---

## Dependências

- **Bloqueadoras:** VUN-5.5 (backend publica eventos), VUN-5.6 (validação falhou), VUN-1.3 (cockpit existente)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Infra SSE/WS ausente → stack fica mais pesada | Alta | Médio | AC8 fallback polling |
| "Liberar manualmente" sem validação de perfil na UI | Média | Crítico | Checar perfil via claim do JWT antes de mostrar botão |
| Toast persistente criar ruído se muitos check-ins | Média | Médio | Colapso "+N" (AC6) + som opcional desabilitado |

---

## Test plan

1. **Unit** hook de stream com eventos mockados.
2. **E2E** fluxo completo mockando SSE.
3. **Regressão** cockpit continua funcionando com a flag desligada.

---

*Gerada por @sm (River) · última story do programa VUN*
