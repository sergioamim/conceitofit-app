# Financeiro Gerencial — Contas a Pagar / Receber

**Status:** shipped 2026-04-23 via F1-F4 do plano de redesign.
**Rotas:** `/gerencial/contas-a-pagar` · `/gerencial/contas-a-receber`.

## Visão geral

Duas telas dedicadas (decisão arquitetural: não unificar atrás de toggle —
URLs bookmark-áveis, permissões granulares, navegação sidebar). Ambas
seguem a mesma arquitetura server-side:

```
┌─────────────────────────────────────────────────────────────┐
│  Header (eyebrow + título + link para a outra rota)         │
├─────────────────────────────────────────────────────────────┤
│  4 KPIs via sumário GROUP BY no DB (BiMetricCard)           │
│  • Em aberto  • Vencidas  • Vence hoje  • Pago/Recebido    │
├─────────────────────────────────────────────────────────────┤
│  TimelineVencimentos -3d..+14d (barras por dia)            │
├─────────────────────────────────────────────────────────────┤
│  CategoriaBreakdown (donut)  │  PrevisaoMini (5 buckets)   │
├─────────────────────────────────────────────────────────────┤
│  Filtros backend (status/período/CPF ou CNPJ) + reset       │
├─────────────────────────────────────────────────────────────┤
│  Tabela paginada (PAGE_SIZE=50) + StatusContaPill           │
│  Paginação prev/next                                         │
└─────────────────────────────────────────────────────────────┘
```

## Backend

### Endpoints

Ambos sob `@RequestMapping("/api/v1/gerencial/financeiro")`.

| Endpoint | Filtros | Retorna |
|---|---|---|
| `GET /contas-receber` | status, categoria, origem, startDate, endDate, documentoCliente, page, size | `ContaReceberEntity[]` + headers paginação |
| `GET /contas-receber/sumario-operacional` | startDate, endDate, documentoCliente | totais por status (GROUP BY) |
| `GET /contas-pagar` | status, categoria, tipoContaId, grupoDre, origem, startDate, endDate, documentoFornecedor, page, size | `ContaPagarEntity[]` + headers |
| `GET /contas-pagar/sumario-operacional` | startDate, endDate, documentoFornecedor | totais por status (GROUP BY) |

### Regra de soma no sumário

- **Contas a receber**: `valorOriginal - desconto + jurosMulta` para
  todos os status (planejado/projetado).
- **Contas a pagar**:
  - `status = PAGA` → `valorPago` (desembolso efetivo).
  - `status = PENDENTE | VENCIDA` → `valorOriginal - desconto + jurosMulta`.

CANCELADAs são excluídas dos sumários.

### Filtro por documento (CPF/CNPJ)

Normalização digits-only em ambos os lados: o frontend envia só dígitos
(`"12345678900"`); o backend faz `LIKE '%digits%'` tolerante a qualquer
formato stored (`"123.456.789-00"` ou `"12345678900"`).

## Frontend

### API wrappers (em `src/lib/api/`)

- `contas-receber.ts`:
  - `listContasReceberPageApi` — envelope paginado.
  - `getSumarioOperacionalContaReceberApi` — sumário.
- `financeiro-gerencial.ts`:
  - `listContasPagarPageApi` — envelope paginado.
  - `getSumarioOperacionalContaPagarApi` — sumário.

### React Query hooks (em `src/lib/query/`)

- `use-contas-receber.ts`: `useContasReceberPage` + `useSumarioOperacionalContaReceber`.
- `use-contas-pagar.ts`: `useContasPagarPage` + `useSumarioOperacionalContaPagar`.

Query-keys distintas (`["contas-a-pagar", ...]` vs `["contas-a-receber", ...]`
vs `["pagamentos", ...]`) evitam invalidação cruzada entre as 3 telas
que consomem o mesmo domínio.

### Biblioteca compartilhada (`src/components/shared/financeiro-viz/`)

Primitives reutilizáveis construídas a partir do handoff do Claude Design:

| Componente | Responsabilidade |
|---|---|
| `Sparkline` | SVG path + area fill compacto pra cards. |
| `Donut` | Donut chart com segmentos + cor custom. |
| `BarChart` | Barras CSS-flex coloridas. |
| `StatusContaPill` | Pill com os 5 estados derivados (pago/vencido/hoje/próximo/agendado). Estende `StatusBadge` agregando regra de derivação cliente-side. |
| `TimelineVencimentos` | Linha do tempo clicável (-N..+M dias) com agrupamento por dia. |
| `CategoriaBreakdown` | Card donut + legenda top-N com percentuais. |
| `PrevisaoMini` | Card com 5 buckets semanais (Atraso / Esta sem / +1 / +2 / +3). |

### Helpers puros (`src/lib/finance/contas-status.ts`)

- `diasPara(iso, today)` — diferença inteira em dias ancorada em 12:00 UTC
  (sem bugs de DST/timezone).
- `statusContaDe(conta, today)` — classifica em `pago | vencido | hoje |
  proximo | agendado` (regra: `proximo = 1..3 dias`).
- `CATEGORIAS_PAGAR` / `CATEGORIAS_RECEBER` — mapas `{ id, nome, color }`
  alinhados com enums backend. Cores hardcoded (decisão: não introduzir
  CRUD de categorias neste ciclo).

### Hydration safety

Todas as telas recebem `today` via `useSyncExternalStore` com fallback
estável no SSR — nenhuma chamada a `new Date()` ou `Date.now()` durante
render. Em caso de SSR, a string de fallback é o primeiro dia do mês
corrente (`initialRange().start`), substituída após mount.

## O que ficou fora deste ciclo

Escopo explicitamente deferido (ver plano do arquiteto em chat de sessão):

- Drawer lateral de detalhe de conta (usa modais existentes).
- Modal "Nova despesa" / "Nova receita" (CRUD backend já existe; UI
  nas telas antigas foi mantida conceitualmente — ações rápidas podem
  ser adicionadas via handler que abre esses modais).
- Bulk "Dar baixa em lote" — selecionar múltiplas contas e pagar/receber
  com uma única operação.
- Estornar baixa (reverter PAGA → PENDENTE) — backend não suporta;
  requer story dedicada.
- Conciliação bancária, DRE no dashboard, exportação PDF, anexos.
- Toggle unificado substituindo as 2 rotas — preferência por manter
  ambas separadas (bookmarks, permissões, sidebar).

## Testes

- **Backend**: `ContaPagarServiceFiltrosTest` (5 testes), espelho de
  `ContaReceberServiceFiltrosTest` (8 testes já existentes em P0-A).
- **Frontend**:
  - `tests/unit/finance-contas-status.test.ts` — 20 testes dos helpers
    puros (diasPara, statusContaDe, categorias).
  - `tests/components/financeiro-viz/` — testes de StatusContaPill (6)
    e TimelineVencimentos (7).
  - `tests/unit/api-contas-receber-paged.test.ts` — wrappers P0-A.
  - `tests/unit/api-contas-pagar-paged.test.ts` — wrappers F4 (6 testes).
  - `tests/unit/use-contas-receber-page.test.ts` — shape dos hooks.

## Referências

- Plano original do @architect: chat da sessão 2026-04-23 (F1-F5).
- Design handoff: `/tmp/design-p1/contas-a-pagar-receber/` (exportado
  do Claude Design).
- P0-A (pré-requisito): telas `/pagamentos` operacional, commits
  `4e9bb81d` (backend) e `6e046b7` (app).
