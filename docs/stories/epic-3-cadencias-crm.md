# Epic 3 — Cadências CRM (destravar módulo ponta-a-ponta)

**Criado por:** @po (Pax, the Balancer)
**Data:** 2026-04-24
**Status:** Ready for `@sm *draft`
**PRD de referência:** Este documento + `docs/integracoes/CADENCIAS_CRM_API_CONTRACT.md` (em `academia-java/docs/integracoes/`)
**ADR relacionado:** [`../adr/ADR-001-modulos-fe-fantasma.md`](../adr/ADR-001-modulos-fe-fantasma.md) item 5
**Task tracking:** #545 (low → alta após aprovação do epic)
**Predecessor:** Módulo CRM base (prospects, tarefas, campanhas, playbooks, retenção — já em produção)
**Escopo:**
- FE: `academia-app/src/app/(portal)/crm/cadencias/`, `src/lib/api/crm-cadencias.ts`, `src/lib/tenant/crm/cadence-engine.ts`, `src/lib/shared/types/prospect.ts`
- BE: `academia-java/modulo-crm/` (novo conjunto de entidades, controller, service, scheduler)

---

## Objetivo do épico

Destravar o módulo **Cadências CRM** saindo do estado "fantasma consciente" (FE completo + BE zero) para módulo funcional end-to-end: criar cadências, executá-las em prospects, monitorar execuções, aplicar escalação automática. Ao final, a feature flag `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED` é promovida para `true` por padrão e o placeholder `CrmCadenciasEmPreparacao` é removido.

Valor de negócio: reduzir tempo médio de follow-up em prospects (baseline de ~48h sem automação) e aumentar taxa de conversão visita → matrícula através de triggers determinísticos + WhatsApp.

## Decisão arquitetural (Opção A — entrega completa)

Escopo único: **CRUD da Cadência + Runtime (execuções) + Escalação + UI de edição** saem juntos. Alternativa faseada (B) descartada pelo PO em 2026-04-24 — risco gerenciável dado que o FE já está desenhado e tipado.

## Premissas e restrições

- **Constitution Artigo IV (No Invention):** nenhum dado fabricado. A tela `/crm/cadencias` permanece atrás da flag até todas as stories BE estarem em produção com seed mínimo.
- **Integração WhatsApp:** reutilizar `sendWhatsAppMessageApi` já existente (`src/lib/api/whatsapp.ts`). Engine já possui `executeCadenceWhatsAppAction` em `cadence-engine.ts:15-70` — não reescrever.
- **Integração Tarefa:** passo do tipo `TAREFA_INTERNA` cria `CrmTarefaEntity` via service existente. Zero duplicação de lógica.
- **Idempotência do trigger:** disparar duas vezes `(cadenciaId, prospectId)` ativo NÃO pode criar execução duplicada — retorna a execução existente em andamento.
- **Migration naming:** seguir convenção `V{YYYYMMDDHHmm}__desc.sql` (ver memory "Migration naming") — **NUNCA** `V{YYYY_MM_DD_HHmm}`.
- **Feature flag:** `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED` permanece `false` por padrão em todos os ambientes até Wave 6 concluída; promoção para `true` é a última story.
- **Tenant isolation:** todas as queries BE DEVEM filtrar por `tenant_id` (RLS-equivalente).
- **Retrocompatibilidade:** `CrmCadencia` já tem entrada no mock/fixture via `listCrmCadenciasApi` em `crm.ts`. Os novos endpoints substituem o mock — remover mock ao fim do epic.

## Decisões do PO (D1-D9)

- **[D1]** Opção A aprovada: CRUD + Runtime + Escalação + UI de edição em um epic único. (2026-04-24)
- **[D2]** Engine de WhatsApp permanece no FE (`cadence-engine.ts`) disparando via `/api/v1/notificacoes/whatsapp`. BE não envia WhatsApp diretamente — só cria a tarefa/execução pendente e FE polling ou event-bus dispara. Revisitar em iteração futura se latência for problema.
- **[D3]** Escalação é síncrona no endpoint `process-overdue` (roda sob demanda e via cron externo). Sem fila assíncrona (Kafka/RabbitMQ) nesta iteração.
- **[D4]** Passos com `delayDias = 0` executam imediatamente no trigger; `delayDias > 0` ficam agendados (coluna `agendado_para`) e são processados pelo scheduler.
- **[D5]** Cadência inativa (`ativo=false`) rejeita trigger com 400. Execuções em andamento continuam.
- **[D6]** `process-overdue` tem lock pessimista por tenant (`SELECT FOR UPDATE`) para evitar concorrência quando chamado via cron + manual.
- **[D7]** UI de edição de Cadência (Wave 4) usa Sheet/Drawer — não nova página. Padronizado com Perfil v3 Drawer de Ações.
- **[D8]** Regras de escalação (Wave 5) têm CRUD inline na aba "Escalação" (sem drawer separado) — linha da tabela vira editável.
- **[D9]** Playwright E2E (Wave 6) cobre apenas golden path: criar cadência → trigger → ver execução em andamento. Edge cases (cancelar, escalar, erro WhatsApp) ficam para iteração seguinte.

## Fora de escopo (reservado para iteração seguinte)

- Fila assíncrona para disparo de WhatsApp (hoje síncrono no FE).
- Passos `EMAIL` e `LIGACAO` executados automaticamente — nesta iteração, apenas `WHATSAPP` é automática; `LIGACAO`/`EMAIL`/`TAREFA_INTERNA` geram tarefa manual.
- Dashboard analítico de conversão por cadência (funil, taxa de resposta).
- A/B testing de cadências.
- Integração com `CrmAutomationEntity` — `cadenceId` já existe em `CrmAutomation` mas fica sem uso nesta iteração.
- Templates de WhatsApp por step — hoje reutiliza template global `PROSPECT_FOLLOWUP`.

---

## Stories

Cada story está pronta para `@sm *draft`. @sm expande título, descrição, tasks técnicas e File List a partir dos ACs deste epic e do API Contract.

### Wave 1 — Schema BE + CRUD Cadência (base de dados)

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.1** | Migration Flyway `V{ts}__crm_cadencias_schema.sql` (5 tabelas) | BE | M | — |
| **3.2** | `CrmCadenciaEntity` + `CrmCadenciaPassoEntity` (JPA + relacionamentos) | BE | M | 3.1 |
| **3.3** | `CrmCadenciaService` + `CrmCadenciaRepository` (CRUD + validações) | BE | M | 3.2 |
| **3.4** | Endpoints REST `GET/POST/PUT/DELETE /api/v1/crm/cadencias` + testes | BE | M | 3.3 |
| **3.5** | Remover mock de `listCrmCadenciasApi` + integração real | FE | S | 3.4 |

### Wave 2 — Runtime de Execuções

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.6** | `CrmCadenceExecutionEntity` + `CrmCadenceStepExecutionEntity` + repositórios | BE | M | 3.1, 3.2 |
| **3.7** | `CrmCadenceExecutionService.trigger(cadenciaId, prospectId)` com idempotência (D5) | BE | L | 3.6 |
| **3.8** | Endpoints `GET /execucoes`, `GET /execucoes/{id}`, `POST /trigger` + filtros | BE | M | 3.7 |
| **3.9** | `POST /execucoes/{id}/cancelar` (transição status + rollback de passos pendentes) | BE | S | 3.7 |
| **3.10** | Integração FE: remover graceful degradation de `crm-cadencias.ts` (listar execuções) | FE | S | 3.8 |

### Wave 3 — Escalação

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.11** | `CrmEscalationRuleEntity` + migration + repositório | BE | S | 3.1 |
| **3.12** | CRUD endpoints escalation-rules (`GET/POST/PUT/DELETE`) | BE | M | 3.11 |
| **3.13** | `POST /process-overdue` com lock pessimista (D6) + cron docstring | BE | L | 3.7, 3.11 |
| **3.14** | Job scheduler Spring `@Scheduled` a cada 15min chamando `processOverdue` (opt-in via property) | BE | S | 3.13 |

### Wave 4 — UI de edição de Cadência

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.15** | Drawer `CadenciaEditor` (Sheet) com formulário react-hook-form + zod (nome, objetivo, gatilho, stageStatus) | FE | M | 3.5 |
| **3.16** | Editor de Passos drag-and-drop (adicionar/remover/reordenar) com react-hook-form useFieldArray | FE | L | 3.15 |
| **3.17** | Integração mutation `createCrmCadenciaApi` / `updateCrmCadenciaApi` + invalidação de cache | FE | S | 3.16 |
| **3.18** | Botão "Nova cadência" na aba Cadências + ação "Editar" no card | FE | S | 3.15 |

### Wave 5 — UI CRUD Escalação

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.19** | Tabela editável de Escalação (inline edit por linha) + botão "Nova regra" | FE | M | 3.12 |
| **3.20** | Form com 3 condições (`TAREFA_VENCIDA`, `SEM_RESPOSTA_APOS_CADENCIA`, `SLA_EXCEDIDO`) + 4 ações | FE | S | 3.19 |

### Wave 6 — E2E + Flip flag

| ID | Título curto | Alvo | Tamanho | Dependências |
|----|--------------|------|---------|--------------|
| **3.21** | Testes unitários BE: service trigger + process-overdue + idempotência | BE | M | 3.7, 3.13 |
| **3.22** | Playwright E2E `cadencias-golden-path.spec.ts` (D9) | FE | M | 3.18, 3.19 |
| **3.23** | Seed de 2 cadências de exemplo em `modulo-crm/.../seed/CrmCadenciaSeed.java` | BE | XS | 3.4 |
| **3.24** | Promover `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED=true` default + remover `CrmCadenciasEmPreparacao` + atualizar ADR-001 | FE + docs | XS | 3.22, 3.23 |

---

## Spikes técnicos pré-épico (@dev)

| Spike | Pergunta a responder | Bloqueia |
|-------|----------------------|----------|
| **SP-1** Timezone | `CrmCadenciaStep.delayDias` é relativo a que timezone? Decidir: UTC no BE, conversão no FE pelo tenant. | 3.7 |
| **SP-2** Lock estratégia | `process-overdue` deve usar `SELECT FOR UPDATE SKIP LOCKED` (Postgres) ou row-level lock via flag `processando_em`? | 3.13 |
| **SP-3** Cron infra | Já existe scheduler Spring configurado no monolito? Se não, definir qual módulo hospeda o `@Scheduled` (candidato: `modulo-crm` ou `modulo-agendamentos`). | 3.14 |
| **SP-4** WhatsApp quota | Qual o rate limit da WhatsApp Business API em uso? Disparo em massa de cadência pode estourar. | 3.7 |

Se SP-4 retornar limite baixo, adicionar throttling (fila) — escopo +1 story.

---

## Dependências externas

- **Módulo WhatsApp:** já operacional (`sendWhatsAppMessageApi`, templates).
- **Módulo Tarefa (`CrmTarefaEntity`):** já operacional — novo tipo `TAREFA_INTERNA` reutiliza entidade existente.
- **Módulo Atividade (`CrmActivityEntity`):** passo executado emite `CADENCIA_ATIVADA` (tipo já previsto em `CrmActivityTipo`).
- **Módulo Prospect:** leitura para enriquecer execução com `prospectNome` e `stageStatus`.

## Métricas de sucesso

1. **Tempo médio de primeiro contato** em prospect `NOVO` — baseline (sem cadência) vs. pós-rollout. Alvo: redução ≥50%.
2. **% de execuções concluídas sem escalação** — alvo: ≥70% após 30 dias.
3. **Zero regressões P0/P1** nos módulos CRM existentes (prospects, tarefas, playbooks).
4. **Taxa de erro de trigger** < 2% (monitorar via logs do `cadence-engine.ts`).

## Riscos do epic

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Concorrência em `process-overdue` causar execução duplicada | Média | Alto | Lock pessimista (D6) + teste de concorrência explícito na story 3.13 |
| WhatsApp quota estourar em tenant grande | Média | Médio | SP-4 mede; adicionar throttling se necessário |
| Migração do mock para BE real quebrar tela ativa | Baixa | Médio | Story 3.5 testa em ambiente dev antes de remover mock |
| Usuário criar cadência com 50+ passos | Baixa | Médio | Validação BE: máx 20 passos por cadência (D validar com PO) |

---

## Handoff

**Próximo passo:** `@sm *draft 3.1` (começar pela Wave 1, story por story em ordem).

**Sequenciamento obrigatório:**
- Waves 1 → 2 → 3 devem ser sequenciais no BE (compartilham migrations e entities).
- Waves 4 e 5 (FE) podem rodar em paralelo depois da Wave 2 concluída.
- Wave 6 (E2E + flag) é a última, obrigatoriamente após todas.

**Responsáveis por fase:**
- `@sm *draft` — cria cada story a partir dos ACs deste epic + API contract.
- `@po *validate-story-draft` — valida cada story (checklist 10 pontos).
- `@dev` — spikes SP-1 a SP-4 + implementação BE (Java) e FE (TS).
- `@qa *qa-gate` — ao final de cada story.
- `@devops *push` — PR e merge.

---

*— Pax, destravando o que já estava desenhado 🎯*
