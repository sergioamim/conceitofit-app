# ADR-001: Veredicto sobre módulos FE "fantasma"

**Status:** Aceito
**Data:** 2026-04-10
**Contexto:** Task #551 (Wave 0 de saneamento FE↔BE)
**Referência:** `docs/API_AUDIT_BACKEND_VS_FRONTEND.md` seção A

## Contexto

A auditoria de 2026-03-28 identificou **5 arquivos em `src/lib/api/`** que chamam endpoints que não existiam no backend Java na data do audit, somando 42 paths 404 potenciais. Em 2026-04-10, após verificação contra o estado real do backend em `/Users/sergioamim/dev/pessoal/academia-java`, o panorama mudou parcialmente:

- Alguns módulos **continuam 100% fantasma**
- Um módulo (`financial.ts`) **passou a existir parcialmente** mas com paths divergentes
- Um módulo (`whatsapp.ts`) tem **implementação parcial** no backend (credentials + webhook) mas ignora o grosso das chamadas do FE

Este ADR formaliza a decisão por módulo.

## Decisão

### 1. `src/lib/api/billing.ts` → **FEATURE FLAG + TODO**

**Estado BE (2026-04-10):** Nenhum `@RequestMapping` para `/api/v1/billing/*` no backend. 100% fantasma.

**Consumidores FE:**
- `src/lib/query/use-billing-config.ts` (hook TanStack Query)
- `src/lib/tenant/comercial/enrollments-runtime.ts` (matrículas recorrentes — já em try/catch)

**Conflito de roadmap:** O PRD Q2 (`prd-evolucao-2026-q2.md` Épico 3.2) prevê criar um `billing.ts` do zero para Billing Recorrente. Como o arquivo já existe fantasma, a resolução é:

1. **Manter o arquivo atual** com header de aviso apontando para este ADR
2. **Adicionar feature flag** `BILLING_RECORRENTE_ENABLED` (default `false`)
3. Quando o PRD Q2 Épico 3.2 for executado, **reaproveitar** o conteúdo existente (normalizers e tipos) em vez de deletar e recriar do zero
4. **Nenhuma tela nova** deve consumir esse módulo até a flag ser ligada

### 2. `src/lib/api/financial.ts` → **CORRIGIR PATHS (task separada) + TODO**

**Estado BE (2026-04-10):** Parcialmente implementado, com **paths divergentes**.

Existe no BE:
- ✅ `AccountApi` → `/api/v1/financial/accounts`
- ✅ `TransactionApi` → `/api/v1/financial/transactions`
- ✅ `LedgerApi` → `/api/v1/financial/ledgers`
- ✅ `LedgerEntryApi` → `/api/v1/financial/ledger-entries`
- ✅ `ReportApi` → `/api/v1/financial/reports` (com `/roi` e `/category`)
- ✅ `MonitoringController` → `/api/v1/financial/monitoring`

Divergências identificadas (path mismatches):

| Chamada FE | Path BE real | Tipo |
|-----------|-------------|------|
| `GET /financial/ledgers/{id}/entries` | `GET /financial/ledger-entries?ledgerId=...` | path |
| `GET /financial/monitoring/suspicious` | `GET /financial/monitoring/suspicious-transactions` | path |
| `GET /financial/monitoring/patterns` | `GET /financial/monitoring/unusual-patterns/{tenantId}` | path + path param |
| `GET /financial/monitoring/high-frequency` | `GET /financial/monitoring/high-frequency/{tenantId}` | path param |
| `GET /financial/reports/balanco` | **não existe** | missing |
| `GET /financial/reports/fluxo-caixa` | **não existe** | missing |
| `GET /financial/reports/extrato/{contaId}` | **não existe** | missing |

**Ação:** Criar task dedicada para reconciliação de paths (`financial.ts` align — fora do escopo da #551). Até lá:
1. **Não deletar** o arquivo — a base está correta, só os paths precisam migração
2. Header de aviso apontando para o ADR e a task de reconciliação
3. As 4 telas consumidoras em `src/app/(portal)/gerencial/contabilidade/` continuam funcionando para os endpoints corretos (accounts, transactions, ledgers list, reports ROI/category) e falhando graciosamente nos outros

### 3. `src/lib/api/whatsapp.ts` → **FEATURE FLAG + MANTER**

**Estado BE (2026-04-10):** Parcialmente implementado.

Existe no BE:
- ✅ `WhatsAppCredentialController` → `/api/v1/whatsapp/credentials` (path novo, diferente de `/config`)
- ✅ `WhatsAppWebhookController` → `/api/v1/whatsapp/webhook` (gestão interna, não exposto pelo FE)

Continua fantasma no BE:
- ❌ `/api/v1/whatsapp/config` — FE usa este path
- ❌ `/api/v1/whatsapp/templates`
- ❌ `/api/v1/whatsapp/logs`
- ❌ `/api/v1/whatsapp/send`
- ❌ `/api/v1/whatsapp/status/{id}`
- ❌ `/api/v1/whatsapp/stats`

**Consumidores FE:**
- `src/lib/query/use-whatsapp.ts` (hook)
- `src/lib/tenant/crm/cadence-engine.ts` (automação CRM — chama `sendWhatsAppMessageApi`)
- `src/app/(backoffice)/admin/whatsapp/page.tsx`
- `src/app/(portal)/administrativo/whatsapp/page.tsx`

**Ação:**
1. **Feature flag** `WHATSAPP_INTEGRATION_ENABLED` (default `false`)
2. Header de aviso no arquivo
3. Criar task futura para: (a) migrar `/config` → `/credentials` quando a feature ligar; (b) implementar templates/logs/send/stats no backend
4. As páginas admin continuam renderizando mas mostram aviso de "módulo em preparação" quando a flag está off

### 4. `src/lib/api/reservas.ts` → **FEATURE FLAG + MANTER**

**Estado BE (2026-04-10):** Nenhum `@RequestMapping` para `/api/v1/agenda/aulas/*`. 100% fantasma.

**Consumidores FE:**
- `src/lib/query/use-aulas.ts` (hook)
- `src/lib/query/use-portal-aluno.ts` (**portal do aluno** — Épico 3.1 do PRD Q2, item 26)
- `src/app/(portal)/reservas/page.tsx`

**Ação:**
1. **Feature flag** `RESERVAS_AULAS_ENABLED` (default `false`)
2. Header de aviso no arquivo
3. O módulo fica como **pronto para ligar** quando o BE entregar `/agenda/aulas/*`. Não deletar: o código tem normalizers, tipos e ordenação bem estruturados que serão reaproveitados.
4. A página `/reservas` e `/meus-treinos` (portal aluno) devem renderizar estado vazio ou "em preparação" quando a flag está off

### 5. `src/lib/api/crm-cadencias.ts` → **IMPLEMENTADO (2026-04-24) — ver Epic 3**

**Status histórico (2026-04-10):** Nenhum `@RequestMapping` para `/api/v1/crm/cadencias/*`. 100% fantasma.
**Status atual (2026-04-24):** **IMPLEMENTADO.** Backend Java agora expõe o módulo completo (`/api/v1/crm/cadencias/*`, `/execucoes`, `/trigger`, `/escalation-rules`, `/process-overdue`) e o FE foi evoluído com editor completo + trigger manual + CRUD de escalação + golden path E2E. Task #545 **concluída**.

**Referência de entrega:** Epic 3 — Cadências CRM (Waves 1-6).
- Wave 1-2: migrations + endpoints BE.
- Wave 3: CRUD base + listas.
- Wave 4 (Stories 3.15-3.18): drawer de edição + trigger manual.
- Wave 5 (Stories 3.19-3.20): CRUD UI de regras de escalação.
- Wave 6 (Stories 3.22 + 3.24): golden path Playwright + flip da feature flag (`NEXT_PUBLIC_CRM_CADENCIAS_ENABLED` default **true**) + remoção do placeholder "Em preparação".

**Consumidores FE:**
- `src/lib/tenant/crm/cadence-engine.ts`
- `src/app/(portal)/crm/cadencias/page.tsx` (+ tabs extraídos)
- `src/app/(portal)/crm/cadence-executions-panel.tsx`

**Ações já executadas:**
1. Feature flag `isCrmCadenciasEnabled()` mantida como override explícito, mas default passou de `false` → `true`.
2. Placeholder `CrmCadenciasEmPreparacao` removido — a tela renderiza diretamente o conteúdo ativo.
3. `graceful degradation` via `mapUnavailableCapability` **mantido** por segurança em ambientes que ainda não tenham o backend atualizado (o operador continua recebendo mensagem amigável em vez de stack trace).

**Próximos passos:** nenhum — módulo sai do escopo deste ADR e vira manutenção padrão do Epic 3.

## Impacto transversal

### Feature flags novas (em `src/lib/feature-flags.ts`)

| Flag | Env var | Default | Cobertura |
|------|---------|---------|-----------|
| `isBillingRecurrenteEnabled()` | `NEXT_PUBLIC_BILLING_RECORRENTE_ENABLED` | `false` | billing.ts + telas admin billing |
| `isWhatsappIntegrationEnabled()` | `NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED` | `false` | whatsapp.ts + telas admin whatsapp |
| `isReservasAulasEnabled()` | `NEXT_PUBLIC_RESERVAS_AULAS_ENABLED` | `false` | reservas.ts + /reservas + portal aluno |
| `isCrmCadenciasEnabled()` | `NEXT_PUBLIC_CRM_CADENCIAS_ENABLED` | **`true`** (2026-04-24) | tela /crm/cadencias |

### Tasks futuras criadas por este ADR

1. **Financial.ts path reconciliation** (novo — ainda não criado no task-master)
   - Migrar `/ledgers/{id}/entries` para `/ledger-entries?ledgerId=`
   - Migrar paths do monitoring (`/suspicious` → `/suspicious-transactions`, etc.)
   - Decidir destino dos reports missing (`balanco`, `fluxo-caixa`, `extrato`)

2. **Billing recorrente implementation** — já coberta pelo PRD Q2 Épico 3.2 (tasks 29-32 do PRD)

3. **WhatsApp integration full-stack** — precisa decisão de produto + implementação BE de templates/logs/send/stats

4. **Reservas de aulas full-stack** — já coberta parcialmente pelo PRD Q2 Épico 3.1 (task 26 do PRD) para o portal do aluno, mas precisa tasks de implementação BE

5. **Task #545 (CRM cadências)** — **CONCLUÍDA em 2026-04-24** via Epic 3 (Waves 1-6). Backend passou a expor `/api/v1/crm/cadencias/*` completo; FE entrega editor, trigger manual, escalação e Playwright golden path (`tests/e2e/cadencias-golden-path.spec.ts`). Feature flag default flipou para `true`.

## Consequências

**Positivas:**
- Zero código deletado → preservamos normalizers, tipos e testes existentes
- Feature flags criam contratos explícitos entre FE e BE (não liga a feature até o BE estar pronto)
- Cada módulo tem um header de aviso que vincula aos issues reais
- PRD Q2 Épico 3.2 (Billing) não precisa mais decidir "criar novo arquivo ou reusar existente" — ADR define reuso

**Negativas:**
- Os 5 arquivos continuam no bundle JS (tree-shaking não ajuda se forem importados)
- Desenvolvedores novos podem se confundir com arquivos existentes cujos endpoints não existem — **mitigado pelos headers de aviso**

**Neutras:**
- Nenhuma tela é deletada agora. Telas esquecidas (ex: `/reservas`) continuam acessíveis mas mostram estado vazio/erro até as flags ligarem. Saneamento cosmético fica para task posterior.

## Critérios para reavaliação

Este ADR deve ser reaberto se:

1. O backend implementar qualquer um dos módulos acima → ligar a flag correspondente e remover header de aviso
2. O produto decidir **não** implementar algum módulo → deletar o arquivo FE + telas + remover flag
3. Novas telas começarem a consumir esses módulos **sem** checar a flag → gate de review no PR
