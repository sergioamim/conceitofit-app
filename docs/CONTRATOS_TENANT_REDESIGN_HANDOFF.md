# Handoff — Tela de Contratos (single-tenant) · Redesign V5

**Status:** Aprovado pelo PO em 2026-04-29. Pronto pra iniciar implementação.
**Escopo:** Apenas a visão **single-tenant** (`(portal)/contratos`). A versão multi-tenant (V1–V4 do bundle) fica pra fase 2.

Este documento é o handoff completo para um agente sem contexto anterior. Ele cobre decisão de produto, fontes de verdade, contrato backend esperado, refactor frontend, constraints obrigatórias, critérios de aceite, ordem de execução e sugestão de PRs.

**Repo dono da mudança de UX:** `academia-app`.
**Repo dono dos contratos REST/regras:** `academia-java`.
**Consumidores diretos nesta wave:** `academia-app`; mobile/gestão de acesso não consomem estes endpoints na wave 1.
**Risco transversal:** drift entre runtime Java, `openapi.yaml` e adapters manuais do web; vazamento de tenant se os endpoints ignorarem `TenantContext`.

---

## 1. Decisão de produto (já fechada)

1. **Não renomear nada.** A rota `/contratos` é mantida.
2. A página vira um **shell com tabs internas**:
   - Aba **`Visão geral`** (default) — V5 redesign (canais: plano da unidade + agregadores).
   - Aba **`Listagem`** — preserva 100% do código atual (tabela aluno-a-aluno, filtros, paginação, renovar/cancelar).
3. **Regra dura, repetida pelo PO:** *"qualquer listagem, filtro, ou alteração para visão no client deve ser feita no backend"*. Nada de `Array.filter`/`sort`/agregação no React. Toda mudança de estado de visualização → query param → endpoint.
4. CTAs novos da V5 (`Disparar campanha`, `Criar campanha`, `Abrir auditoria`, `Ver lista`, `Solicitar novo canal`) ficam **`disabled` com tooltip `Em breve`**. Nenhum ainda tem rota destino aprovada.

---

## 2. Fontes da verdade

### Design (handoff bundle do Claude Design)

```
/Users/sergioamim/dev/pessoal/conceitofit/contratos/
├── README.md                                 ← contexto do bundle
└── project/
    ├── Tela de Contratos.html                ← entry HTML (canvas com 5 variações)
    ├── shared.jsx                            ← /Users/sergioamim/dev/pessoal/conceitofit/contratos/project/shared.jsx
    ├── mock-data.js                          ← /Users/sergioamim/dev/pessoal/conceitofit/contratos/project/mock-data.js
    ├── v5-tenant.jsx                         ← /Users/sergioamim/dev/pessoal/conceitofit/contratos/project/v5-tenant.jsx
    └── v1.jsx, v2.jsx, v3.jsx, v4-risco.jsx  ← multi-tenant (fase 2, ignorar agora)
```

**Leia `v5-tenant.jsx` linha-a-linha** antes de codar. Layout, hierarquia, tipografia e cores (variáveis CSS `--gym-accent`, `--gym-warning`, `--gym-teal`, `--gym-danger`) já estão alinhadas com o tema do `globals.css`.

`Severity` (alta/média/baixa) referenciada na V5 está definida em `v4-risco.jsx:60` — copiar dali, não reimplementar.

Shapes canônicos do bundle:
- `mock-data.js`: `CONTRATOS`, `AGREGADORES`, `MESES`, `EVOLUCAO_MENSAL`.
- `shared.jsx`: `Donut`, `Sparkline`, `AreaLines`, `KpiCard`, `StatusBadge`, `TipoChip`, `PeriodPicker`.
- `v5-tenant.jsx`: blocos finais da wave 1: KPIs, origem dos alunos, evolução 6m, cards de canais e ações semanais.

### Tela atual (a preservar dentro da aba `Listagem`)

- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/app/(portal)/contratos/page.tsx`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/app/(portal)/contratos/components/contratos-client.tsx` (28KB — KPIs antigos, donut de planos, radar operacional, tabela aluno-a-aluno, paginação, renovar/cancelar)

### API e tipos atuais (frontend)

- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/api/contratos.ts`
  - `ContratoDashboardMensalResult { mes, resumo, carteiraAtivaPorPlano, contratos }` — usar pra aba Listagem.
  - `listContratosDashboardMensalApi({ tenantId, mes, page })`
  - `renovarContratoApi`, `cancelarContratoApi`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/query/use-contratos.ts` — hooks `useContratos`, `useRenovarContrato`, `useCancelarContrato`.
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/api/agregadores-vinculos.ts`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/api/integracoes-agregadores.ts`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/api/agregadores-admin.ts`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/query/use-agregadores.ts`
- `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/query/use-agregadores-admin.ts`

### Backend (Java, Spring Boot multi-módulo)

- Módulo a estender: `modulo-comercial` (matrículas/contratos) + `modulo-agregadores` (canais).
- Port atual: `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-comercial/src/main/java/fit/conceito/comercial/port/ComercialMatriculaDashboardPort.java`.
- Controllers de agregador já existentes:
  - `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-agregadores/src/main/java/fit/conceito/agregadores/controller/AgregadorVinculoController.java`
  - `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-agregadores/src/main/java/fit/conceito/agregadores/controller/admin/AgregadorDashboardAdminController.java`
  - `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-agregadores/src/main/java/fit/conceito/agregadores/service/AgregadorDashboardService.java`
  - `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-agregadores/src/main/java/fit/conceito/agregadores/dto/AgregadorDashboardDtos.java`
- OpenAPI canônico: `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-app/src/main/resources/static/openapi.yaml`.
- Teste de contrato/export: `/Users/sergioamim/dev/pessoal/conceitofit/academia-java/modulo-app/src/test/java/fit/conceito/app/application/ApiOpenApiRuntimeExportIntegrationTest.java`.
- Testes de integração HTTP novos devem ficar em `modulo-app/src/test/java/fit/conceito/app/application/`, seguindo o padrão dos testes `Api*IntegrationTest`.

---

## 3. Backend — entregáveis (3 endpoints novos, escopo da unidade ativa)

> Todos sob path `app/v1/...` ou equivalente já em uso pela visão portal-operador. Auth: tenant ativo via `TenantContext`. Resposta sempre **agregada no servidor** — nunca devolver lista crua pro front filtrar.

### 3.1 Evolução 6m por canal

`GET /api/v1/app/contratos/evolucao-canais?monthKey=YYYY-MM&meses=6`

Query params:
- `monthKey` (`YYYY-MM`, obrigatório): mês de referência final da série.
- `meses` (`number`, opcional, default `6`, máximo sugerido `12`): quantidade de meses incluindo `monthKey`.

Request body: nenhum.

Resposta:
```json
{
  "mesAtual": "2026-04",
  "meses": ["2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04"],
  "canais": [
    {
      "id": "plano",
      "tipo": "PLANO",
      "label": "Plano Pro",
      "cor": null,
      "serie": [260, 268, 275, 281, 284, 287]
    },
    {
      "id": "ag-wellhub",
      "tipo": "AGREGADOR",
      "agregadorId": "wellhub",
      "label": "Wellhub",
      "cor": "#FE4F12",
      "serie": [220, 240, 256, 270, 280, 287]
    }
  ],
  "totalAtual": 574,
  "totalAnterior": 564,
  "deltaPct": 1.77
}
```

Notas:
- `serie` = #alunos ativos no fim de cada mês (não MRR — V5 plota alunos).
- Exatamente um item com `tipo=PLANO` (o plano vigente da unidade) + N agregadores integrados ativos.
- Cor do agregador vem da config do agregador (já existe `cor` no domínio? confirmar — senão hardcode no DTO).

### 3.2 Origem dos alunos (donut do mês)

`GET /api/v1/app/contratos/origem-alunos?monthKey=YYYY-MM`

Query params:
- `monthKey` (`YYYY-MM`, obrigatório): mês de referência do snapshot.

Request body: nenhum.

Resposta:
```json
{
  "totalAlunos": 841,
  "canais": [
    { "id": "plano", "tipo": "PLANO", "label": "Plano Pro", "cor": null, "alunos": 412, "percentual": 48.99, "mrr": 6168.30 },
    { "id": "ag-wellhub", "tipo": "AGREGADOR", "agregadorId": "wellhub", "label": "Wellhub", "cor": "#FE4F12", "alunos": 287, "percentual": 34.13, "mrr": 9327.50 },
    { "id": "ag-totalpass", "tipo": "AGREGADOR", "agregadorId": "totalpass", "label": "TotalPass", "cor": "#0066FF", "alunos": 142, "percentual": 16.88, "mrr": 3976.00 }
  ]
}
```

### 3.3 Sinais de retenção (KPIs novos)

`GET /api/v1/app/contratos/sinais-retencao?monthKey=YYYY-MM`

Query params:
- `monthKey` (`YYYY-MM`, obrigatório): mês de referência dos KPIs.

Request body: nenhum.

Resposta:
```json
{
  "alunosAtivos": 841,
  "alunosAtivosDeltaPct": 1.77,
  "alunosPlano": 412,
  "alunosAgregadores": 429,
  "receitaMes": 19471.80,
  "emRiscoChurn": {
    "quantidade": 32,
    "criterio": "SEM_CHECKIN_21_DIAS",
    "diasLimite": 21
  },
  "trialsEncerrando": {
    "quantidade": 7,
    "diasLimite": 30
  }
}
```

Critérios sugeridos (validar com PO se necessário):
- `emRiscoChurn`: matrícula `ATIVA` + último check-in há ≥ 21 dias.
- `trialsEncerrando`: contratos `TRIAL` com `dataFim` nos próximos 30 dias.

Contrato comum dos 3 endpoints:
- Escopo é sempre unidade ativa resolvida por `TenantContext`/`X-Context-Id`.
- `tenantId` explícito só deve existir se o padrão atual do endpoint operacional exigir; se enviado junto com `X-Context-Id`, backend precisa rejeitar divergência.
- Respostas vazias retornam `200` com arrays vazios e totais `0`, nunca `null`.
- Campos monetários usam número decimal em BRL, sem string formatada.
- Erros seguem contrato HTTP já usado no backend, sem inventar envelope próprio no frontend.
- Runtime, `openapi.yaml` e teste de integração precisam entrar no mesmo PR.

### Migrations & nomes
- Sem nova tabela esperada — todos derivados de matrículas + check-ins + agregador_vinculo já existentes.
- Se precisar de view materializada ou índice, criar como `V{YYYYMMDDHHmm}__add_idx_contratos_canais.sql` (formato compacto, **sem underscores entre data e hora** — bug recorrente já corrigido na memória do projeto).

### Tabela aluno-a-aluno (aba Listagem)
- **Manter `listContratosDashboardMensalApi` como está.** Já é server-side paginated. Se o PO pedir filtros novos (status, canal, etc.) na aba Listagem, eles **entram como query params** no mesmo endpoint, nunca como filtro client-side.

---

## 4. Frontend — entregáveis

### 4.1 Refactor da rota
```
academia-app/src/app/(portal)/contratos/
├── page.tsx                                      ← fica como está
└── components/
    ├── contratos-client.tsx                      ← VIRA shell com Tabs + filtro de mês compartilhado
    ├── contratos-overview.tsx                    ← NOVO (V5)
    ├── contratos-list.tsx                        ← código atual movido pra cá (tabela + paginação + renovar/cancelar)
    └── contratos-overview/                       ← (opcional) sub-componentes da V5
        ├── kpi-strip.tsx
        ├── origem-alunos-donut.tsx
        ├── evolucao-canais-area.tsx
        ├── canais-cards.tsx
        └── acoes-semana.tsx
```

`page.tsx` segue chamando `<ContratosClient />` — **nada muda na URL nem na assinatura**.

### 4.2 Tabs shell (`contratos-client.tsx`)

- Usar `@/components/ui/tabs` (Radix, já existe em `src/components/ui/tabs.tsx`).
- Estado de aba sincronizado com query param `?aba=overview|listagem` (default `overview`) — atende a regra de "estado de visão = backend/URL, não estado local".
- O **filtro de mês fica no shell**, fora das tabs, e é compartilhado pelas duas abas.
- Header da página (chip "Unidade atual" + título + botão "Nova contratação") fica também no shell, **não duplica** entre abas.
- Atenção a hydration safety (regra do `academia-app/CLAUDE.md`): `selectedMonthKey` deve ser inicializado em `useEffect`, manter árvore Radix idêntica SSR/client.

### 4.3 Aba `Listagem` (`contratos-list.tsx`)

- Mover **todo** o conteúdo abaixo do header da `contratos-client.tsx` atual: KPIs antigos (BiMetricCard), radar operacional, action items legados, donut por plano, tabela aluno-a-aluno, paginação. Sem mudança de comportamento.
- Hooks `useContratos` / `useRenovarContrato` / `useCancelarContrato` continuam idênticos.
- Receber `monthKey` por prop do shell.

### 4.4 Aba `Visão geral` (`contratos-overview.tsx`) — V5

Mapeamento direto do `v5-tenant.jsx`:

| Bloco V5 | Componente atual a usar | Endpoint |
|---|---|---|
| Header da unidade | (vem do shell) | — |
| 4 KPIs (Alunos ativos, Receita do mês, Em risco, Trials) | `BiMetricCard` (`@/components/shared/bi-metric-card`) | 3.3 `sinais-retencao` |
| Donut "Origem dos alunos" + lista lateral | `Donut` (`@/components/shared/financeiro-viz/donut`) — verificar se aceita center label/value; se não, criar variante | 3.2 `origem-alunos` |
| Área "Evolução de alunos 6m" | **Criar** `<AreaLines>` em `src/components/shared/financeiro-viz/area-lines.tsx` (port direto de `shared.jsx:185`) | 3.1 `evolucao-canais` |
| Cards "Meus contratos & canais" (3 colunas) | Usar `<Sparkline>` existente em `src/components/shared/financeiro-viz/sparkline.tsx` se atender; `StatusBadge`/`TipoChip` portar de `shared.jsx:9-48` somente após auditar `src/components/shared/` para evitar duplicação | 3.1 + 3.2 |
| Lista "Ações para esta semana" (severidade alta/média/baixa) | Heurística client-side por enquanto, baseada em `sinais-retencao` (ex: `quantidade > N` → alta). **Nenhum endpoint novo só pra isso na wave 1.** Severidade → componente novo `<SeverityDot>` em `src/components/shared/severity-dot.tsx` (port de `v4-risco.jsx:60`). | derivado de 3.3 |

### 4.5 CTAs em "Em breve"

Criar 1 helper local na overview:

```tsx
function ComingSoonButton({ children }: { children: React.ReactNode }) {
  return (
    <Button disabled title="Em breve" variant="outline">
      {children}
    </Button>
  );
}
```

Aplicar em: `Disparar campanha`, `Criar campanha`, `Abrir auditoria`, `Ver lista`, `Solicitar novo canal`.

### 4.6 Tipos novos em `lib/api/contratos.ts`

Adicionar em `/Users/sergioamim/dev/pessoal/conceitofit/academia-app/src/lib/api/contratos.ts` sem quebrar os tipos existentes:

```ts
export type ContratoCanalTipo = "PLANO" | "AGREGADOR";

export type ContratoCanalEvolucao = {
  id: string;
  tipo: ContratoCanalTipo;
  agregadorId?: string;
  label: string;
  cor: string | null;
  serie: number[];
};

export type ContratoEvolucaoCanaisResult = {
  mesAtual: string;
  meses: string[];
  canais: ContratoCanalEvolucao[];
  totalAtual: number;
  totalAnterior: number;
  deltaPct: number;
};

export type ContratoCanalOrigem = ContratoCanalEvolucao & {
  alunos: number;
  percentual: number;
  mrr: number;
};

export type ContratoOrigemAlunosResult = {
  totalAlunos: number;
  canais: ContratoCanalOrigem[];
};

export type ContratoSinaisRetencaoResult = {
  alunosAtivos: number;
  alunosAtivosDeltaPct: number;
  alunosPlano: number;
  alunosAgregadores: number;
  receitaMes: number;
  emRiscoChurn: { quantidade: number; criterio: string; diasLimite: number };
  trialsEncerrando: { quantidade: number; diasLimite: number };
};

export async function listContratosEvolucaoCanaisApi(input: {
  monthKey: string;
  meses?: number;
}): Promise<ContratoEvolucaoCanaisResult> {
  return apiRequest<ContratoEvolucaoCanaisResult>({
    path: "/api/v1/app/contratos/evolucao-canais",
    query: {
      monthKey: input.monthKey,
      meses: input.meses,
    },
  });
}

export async function listContratosOrigemAlunosApi(input: {
  monthKey: string;
}): Promise<ContratoOrigemAlunosResult> {
  return apiRequest<ContratoOrigemAlunosResult>({
    path: "/api/v1/app/contratos/origem-alunos",
    query: {
      monthKey: input.monthKey,
    },
  });
}

export async function listContratosSinaisRetencaoApi(input: {
  monthKey: string;
}): Promise<ContratoSinaisRetencaoResult> {
  return apiRequest<ContratoSinaisRetencaoResult>({
    path: "/api/v1/app/contratos/sinais-retencao",
    query: {
      monthKey: input.monthKey,
    },
  });
}
```

Criar hooks correspondentes em `use-contratos.ts` (`useContratosEvolucaoCanais`, `useContratosOrigemAlunos`, `useContratosSinaisRetencao`) — todos com `enabled: tenantResolved && !!monthKey`.

### 4.7 Empty / loading states

- Cada bloco da overview tem loading skeleton próprio. Usar padrão já presente no projeto (`ListErrorState`, ou `Skeleton` de `src/components/ui/skeleton.tsx`).
- **Não** mostrar zeros como se fossem dados reais — `Carregando…` enquanto pendente, e `—` se erro recoverable.

---

## 5. Constraints obrigatórios (do CLAUDE.md e da memória do projeto)

Resumo do que **vai bater no review** se ignorado:

- **pt-BR** em copy, comentários e docs.
- **Forms (se aparecerem):** `react-hook-form` + `zod` + `@hookform/resolvers/zod`. Modais: `mode: "onTouched"` + `watch` manual. **Nunca** `formState.isValid`.
- **Hydration:** zero `Date.now()`, `Math.random()`, `new Date()`, `crypto.randomUUID()` no render hidratável. `localStorage`/`window` só em `useEffect`. Árvore Radix (Tabs!) idêntica SSR/client.
- **Toast:** `sonner` (já delegado por `useToast`).
- **Migrations Java:** `V{YYYYMMDDHHmm}__desc.sql` compacto. **NUNCA** `V{YYYY_MM_DD_HHmm}`.
- **Snapshot hook do java:** `academia-java` reescreve mensagens de commit como `chore: snapshot residual ...`. Não brigar com isso.
- **Agregadores:** estender `modulo-agregadores` (adapter já canônico). Não criar módulo novo.
- **Auth fail-closed:** `IntegrationAuthorizationService` é fail-CLOSED desde 2026-04-29. Endpoints novos sob mesma policy.
- **OpenAPI:** qualquer endpoint novo no Java exige runtime + `modulo-app/src/main/resources/static/openapi.yaml` + teste de integração no mesmo PR.
- **Tenant/contexto:** APIs operacionais usam unidade ativa. Não misturar semântica admin/global com rota operacional da unidade.
- **Logical delete:** queries Java devem excluir registros inativos/deletados por padrão (`ativo`, `deletedAt`, `deletedBy`) salvo caso admin/auditoria explícito.
- **Tudo no servidor:** *"qualquer listagem, filtro, ou alteração para visão no client deve ser feita no backend."* Filtros novos viram query params; ordenação vira query param; agregação vira endpoint. **Sem `useMemo` que filtra ou ordena dataset principal no cliente.** (`useMemo` pra derivar campo de exibição num item, ok.)

---

## 6. Critérios de aceite

1. ✅ `/contratos` carrega na aba **Visão geral** (V5) por padrão; query `?aba=listagem` abre direto a tabela atual.
2. ✅ Filtro de mês no shell aplica nas duas abas e refaz fetches.
3. ✅ Aba **Listagem** preserva 100% do comportamento atual (KPIs antigos, paginação, renovar, cancelar, donut por plano, radar operacional).
4. ✅ Aba **Visão geral** consome **somente os 3 endpoints novos** (`evolucao-canais`, `origem-alunos`, `sinais-retencao`). Nenhum dado da V5 calculado por filtro/reduce no cliente.
5. ✅ CTAs novos em `disabled` com tooltip `Em breve`.
6. ✅ Tema dark/light continua funcionando (variáveis `--gym-accent` etc. já cobrem).
7. ✅ Hydration limpa: `npm run build` + `npm run lint` + `npm run typecheck` passam.
8. ✅ Sem regressão: e2e de contratos/matrículas que existir continua verde.
9. ✅ Backend: testes de integração dos 3 endpoints novos (escopo: tenant resolvido, vazio, com canais) + `openapi.yaml` alinhado ao runtime.
10. ✅ Frontend: tipos e hooks novos em `contratos.ts`/`use-contratos.ts`, com queries habilitadas só quando `tenantResolved && !!monthKey`.

---

## 7. Ordem sugerida de execução

1. Ler nesta ordem: `contratos/README.md` → `contratos/project/Tela de Contratos.html` → `v5-tenant.jsx` → `shared.jsx` → `mock-data.js` → `contratos-client.tsx` atual → `lib/api/contratos.ts` → controllers existentes em `modulo-agregadores`.
2. **Backend primeiro** (3 endpoints + DTOs + testes de integração). Validar resposta com Postman/curl em tenant de dev.
3. **Tipos + hooks** no front (`lib/api/contratos.ts`, `use-contratos.ts`).
4. **Refactor** `contratos-client.tsx` em shell de Tabs + mover existente pra `contratos-list.tsx` (sem mudar comportamento, deve passar nos testes atuais).
5. **Construir overview** (`contratos-overview.tsx`) ligando aos hooks novos. Sub-componentes podem ser inline antes de extrair.
6. Portar primitives (`Sparkline`, `AreaLines`, `SeverityDot`, eventualmente `TipoChip`) — auditar `src/components/shared` pra evitar duplicação.
7. CTAs `Em breve`. Loading/error states.
8. Manual smoke em dev (light + dark, mobile width 1280px). Build + lint + typecheck.
9. PR com screenshot da overview vazia, populada e com erro.

---

## 8. Fora de escopo (NÃO fazer agora)

- Renomear rota ou tela.
- Multi-tenant V1/V2/V3/V4.
- Implementar de fato `Disparar campanha`, `Criar campanha`, `Auditoria`, etc. (apenas botão `Em breve`).
- Campanha SMS/email (a memória do projeto cita Epic 3 Cadências CRM e Epic 4 Notificações Globais — eles são plataforma, não consumir aqui).
- Voucher / convênios / split — não relacionado.

---

## 9. Quando subir

PRs separados se possível:
1. **Backend:** 3 endpoints + DTOs + testes (modulo-comercial estendido, eventualmente modulo-agregadores).
2. **Frontend tabs refactor:** shell + mover listagem (zero comportamento novo). Já entregável sozinho — descomplica review.
3. **Frontend overview V5:** ligando aos endpoints novos. Por trás de feature-flag se quiser canary, mas não é obrigatório.

Commit do `.taskmaster/tasks/tasks.json` se mexer com Task Master.
