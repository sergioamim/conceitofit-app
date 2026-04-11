# Architect Analysis — Story 1.1 RSC Migration Wave 1

**Agent:** @architect (Aria)  
**Date:** 2026-04-11  
**Story:** 1.1-rsc-migration-wave-1.md  
**Status:** ✅ Complete

---

## 1. Páginas Alvo — Análise Detalhada

### 1.1 Relatórios Contábeis (`portal/gerencial/contabilidade/relatorios/page.tsx`)

| Propriedade | Valor |
|-------------|-------|
| Tamanho atual | 220 linhas (monolítico Client Component) |
| `"use client"` | Sim (linha 1) |
| Data fetching | `useQuery` × 2 (balanco + fluxo) via `getBalancoPatrimonialApi`, `getFluxoCaixaApi` |
| State local | 6x `useState` (reportType, startDate, endDate, fetchKey, shouldFetch, loading) |
| Interatividade | Form (select, 2x date input, button), tabelas, export menu |
| Dependências UI | `Button`, `Input`, `Select`, `ExportMenu`, `ListErrorState` |
| Dependencies data | `@/lib/api/financial`, `@/lib/tenant/hooks/use-session-context` |
| Complexidade | **Média** — lógica simples, mas renderização pesada de tabelas |

**APIs envolvidas:**
- `getBalancoPatrimonialApi({ tenantId, dataBase })` → `/api/v1/relatorios/balanco-patrimonial`
  - ⚠️ **Nota:** Endpoint retorna dados vazios no backend atual (documentado em `financial.ts` lines 303-315)
- `getFluxoCaixaApi({ tenantId, startDate, endDate })` → `/api/v1/relatorios/fluxo-caixa`
  - ✅ Funcional (Task #553)

**Veredito:** ✅ **MIGRÁVEL** com ganho imediato. O formulário é interativo mas os dados iniciais podem vir do server.

### 1.2 Catálogo de Segurança (`backoffice/admin/seguranca/catalogo/page.tsx`)

| Propriedade | Valor |
|-------------|-------|
| Tamanho atual | **986 linhas** (monolítico Client Component) |
| `"use client"` | Sim (linha 1) |
| Data fetching | `useEffect` + `apiRequest` direto (3 tabs com fetch independente) |
| State local | **20+** `useState` distribuídos por tab |
| Tabs | 3 (Catalogo, Perfis, Excecoes/Review Board) |
| Interatividade | Forms inline, modais, pagination, filtros, edição inline |
| Dependencies UI | `GlobalSecurityShell`, `PaginatedTable`, `Tabs`, `Card`, `Toast`, `SecurityRiskBadge` |
| Dependencies data | `@/backoffice/api/admin-seguranca-avancada`, `@/backoffice/lib/seguranca` |
| Complexidade | **Alta** — lógica de negócio densa, múltiplos sub-formulários |

**APIs envolvidas:**
- `listCatalogoFuncionalidades()` → `POST /api/v1/admin/seguranca/catalogo/list`
- `listPerfisPadrao()` → `POST /api/v1/admin/seguranca/perfis/list`
- `getPerfilPadraoVersoes(key)` → `POST /api/v1/admin/seguranca/perfis/versoes`
- `getGlobalSecurityReviewBoard()` → `GET /api/v1/admin/seguranca/review-board`
- Write ops: `createCatalogoFuncionalidade`, `updateCatalogoFuncionalidade`, `createPerfilPadrao`, `createExcecao`, `revisarExcecao`

**Veredito:** ✅ **MIGRÁVEL** mas com esforço maior. Split em 4+ Client Islands necessário.

---

## 2. Arquitetura de Client Islands

### 2.1 Relatórios Contábeis — Split Proposto

```
app/(portal)/gerencial/contabilidade/relatorios/
├── page.tsx                          ← Server Component (SEM "use client")
│   ├── serverFetch balanco
│   ├── serverFetch fluxo
│   └── <RelatoriosContent initialBalanco={...} initialFluxo={...} />
└── components/
    ├── relatorios-content.tsx        ← Client Island (form + dispatcher)
    │   ├── State: reportType, dates, shouldFetch
    │   ├── On generate: ou usa props ou re-fetch via apiRequest
    │   └── Renderiza <BalancoTable> ou <FluxoTable>
    ├── balanco-table.tsx            ← Client Island (tabela + cards)
    │   ├── Props: BalancoPatrimonial
    │   ├── Cards resumo (Ativos, Passivos, Patrimonio)
    │   ├── Tabela detalhada
    │   └── <ExportMenu>
    └── fluxo-table.tsx              ← Client Island (tabela + cards)
        ├── Props: FluxoCaixa
        ├── Cards resumo (Inicial, Final, Variacao)
        ├── Tabela por período
        └── <ExportMenu>
```

**Rationale:**
- `page.tsx` faz `serverFetch` inicial → dados disponíveis no primeiro render
- `RelatoriosContent` gerencia estado do formulário (tipo relatório, datas)
- Tables são pure presentation → recebem dados como props
- Se usuário muda datas e clica "Gerar" → `RelatoriosContent` faz `apiRequest` para re-fetch

**Interface Types:**
```typescript
// relatorios-content.tsx
interface RelatoriosContentProps {
  initialBalanco: BalancoPatrimonial | null;
  initialFluxo: FluxoCaixa | null;
}

// balanco-table.tsx
interface BalancoTableProps {
  balanco: BalancoPatrimonial;
}

// fluxo-table.tsx
interface FluxoTableProps {
  fluxo: FluxoCaixa;
}
```

### 2.2 Catálogo de Segurança — Split Proposto

```
app/(backoffice)/admin/seguranca/catalogo/
├── page.tsx                          ← Server Component (SEM "use client")
│   ├── serverFetch catalogo
│   ├── serverFetch perfis
│   ├── serverFetch review-board
│   └── <CatalogoContent initialCatalogo={...} initialPerfis={...} initialBoard={...} />
└── components/
    ├── catalogo-content.tsx          ← Client Island (tabs shell + toast)
    │   ├── State: activeTab, toast
    │   ├── Tabs wrapper
    │   └── Delega para tab components
    ├── catalogo-tab.tsx             ← Client Island (lista + form inline)
    │   ├── Props: initialCatalogo
    │   ├── State: loading, items (after edits), busca, riskFilter, page, editingId
    │   ├── PaginatedTable
    │   ├── Form criar/editar funcionalidade
    │   └── Write ops via apiRequest
    ├── perfis-tab.tsx               ← Client Island (lista perfis + form)
    │   ├── Props: initialPerfis
    │   ├── State: items, busca, scopeFilter, form state
    │   ├── Lista perfis
    │   ├── Form criar perfil
    │   └── Write ops via apiRequest
    ├── excecoes-tab.tsx             ← Client Island (review board + decisões)
    │   ├── Props: initialBoard
    │   ├── State: board, revisao form
    │   ├── Lista pendências
    │   ├── Form decidir exceção
    │   └── Write ops via apiRequest
    └── catalogo-form.tsx            ← Client Island (form reutilizável)
        ├── Props: editingItem?, onSubmit, onCancel
        └── Usado por catalogo-tab e perfis-tab
```

**Rationale:**
- `page.tsx` pré-carrega TODOS os dados iniciais via `serverFetch`
- `CatalogoContent` é o orchestrator dos tabs (state machine simples)
- Cada tab é um Client Island independente com seu próprio state de edição
- Write operations (POST/PUT/DELETE) continuam via `apiRequest` nas islands
- `GlobalSecurityShell` pode ser movido para page.tsx (Server Component) como wrapper

**Interface Types:**
```typescript
// catalogo-content.tsx
interface CatalogoContentProps {
  initialCatalogo: CatalogoFuncionalidade[];
  initialPerfis: PerfilPadrao[];
  initialBoard: GlobalAdminReviewBoard;
}

// catalogo-tab.tsx
interface CatalogoTabProps {
  initialCatalogo: CatalogoFuncionalidade[];
}

// perfis-tab.tsx
interface PerfisTabProps {
  initialPerfis: PerfilPadrao[];
}

// excecoes-tab.tsx
interface ExcecoesTabProps {
  initialBoard: GlobalAdminReviewBoard;
}
```

---

## 3. Validação de APIs para serverFetch

### APIs disponíveis para server-side fetch

| Endpoint | Método | serverFetch ready? | Notas |
|----------|--------|-------------------|-------|
| `/api/v1/relatorios/balanco-patrimonial` | GET | ⚠️ Sim, mas dados vazios | Backend não implementou ainda |
| `/api/v1/relatorios/fluxo-caixa` | GET | ✅ Sim | Funcional |
| `/api/v1/admin/seguranca/catalogo/list` | POST | ⚠️ Precisa adaptar | `serverFetch` suporta POST via `options.method` e `options.body` |
| `/api/v1/admin/seguranca/perfis/list` | POST | ⚠️ Precisa adaptar | Idem |
| `/api/v1/admin/seguranca/review-board` | GET | ✅ Sim | Se endpoint existir |

### Adaptação necessária no serverFetch

Para APIs que usam **POST** (como catálogo e perfis), o `serverFetch` já suporta:
```typescript
await serverFetch("/api/v1/admin/seguranca/catalogo/list", {
  method: "POST",
  body: { tenantId: "..." }, // Se necessário
  next: { revalidate: 0 },
});
```

✅ **Sem modificações no serverFetch necessárias.**

---

## 4. eslint-plugin-boundaries — Validação

O projeto usa `eslint-plugin-boundaries` (config em `eslint.config.mjs`).

**Regras relevantes:**
- `app/` pode importar de `@/components/*`, `@/lib/*`
- `components/` pode importar de `@/components/ui/*`, `@/components/shared/*`, `@/lib/*`
- `backoffice/` tem seu próprio namespace

**Novos arquivos propostos:**
- `relatorios/components/*.tsx` → namespace `portal/gerencial/contabilidade`
  - Pode importar de `@/components/ui/*`, `@/components/shared/*`, `@/lib/*` ✅
- `catalogo/components/*.tsx` → namespace `backoffice/admin/seguranca`
  - Pode importar de `@/backoffice/components/*`, `@/components/ui/*`, `@/lib/*` ✅

✅ **Sem violações de boundaries previstas.**

---

## 5. Riscos Identificados

| # | Risco | Probabilidade | Impacto | Mitigação |
|---|-------|--------------|---------|-----------|
| R1 | `getBalancoPatrimonialApi` retorna dados vazios | **Alta** | Médio | Page ainda funciona — mostra "sem dados". Não bloqueia migração. |
| R2 | `serverFetch` com POST pode precisar de body serialization | **Baixa** | Baixo | `serverFetch` já suporta `method: "POST"` + `body`. Testar antes. |
| R3 | Catálogo tem 986 linhas — split pode introduzir bugs | **Média** | Médio | Manter lógica de negócio intacta nas islands. Testar cada tab isoladamente. |
| R4 | `useTenantContext` só funciona em Client Components | **Alta** | Alto | Page (Server) pega tenantId de cookie → passa como prop. Islands não precisam do hook. |
| R5 | `GlobalSecurityShell` pode precisar de serverFetch também | **Média** | Médio | Se o shell faz fetch interno, mover para page.tsx ou criar wrapper server. |

---

## 6. Plano de Implementação Detalhado

### Wave 1A — Relatórios Contábeis (1 dia)

**Ordem de execução:**
1. Criar `components/balanco-table.tsx` (extrair JSX de balanco da page atual)
2. Criar `components/fluxo-table.tsx` (extrair JSX de fluxo da page atual)
3. Criar `components/relatorios-content.tsx` (orchestrator com form state)
4. Reescrever `page.tsx` como Server Component
5. Testar no dev server
6. Rodar quality gates

### Wave 1B — Catálogo de Segurança (1.5 dias)

**Ordem de execução:**
1. Extrair `components/catalogo-tab.tsx` (copiar função CatalogoTab da page atual)
2. Extrair `components/perfis-tab.tsx` (copiar função PerfisTab)
3. Extrair `components/excecoes-tab.tsx` (copiar função ReviewBoardTab)
4. Criar `components/catalogo-content.tsx` (Tabs shell + state)
5. Reescrever `page.tsx` como Server Component
6. Testar cada tab individualmente
7. Rodar quality gates

---

## 7. Handoff para @dev

**Próximo agente:** @dev (Dex)  
**Comando:** `*dev-develop-story 1.1-rsc-migration-wave-1`  
**Story file:** `docs/stories/1.1-rsc-migration-wave-1.md`

**O que @dev precisa fazer:**
1. Ler esta análise técnica
2. Seguir o plano de implementação detalhado (Seção 6)
3. Criar os Client Islands na ordem especificada
4. Reescrever page.tsx como Server Component
5. Manter funcionalidade idêntica (sem regressão)
6. Rodar quality gates antes de marcar completo

**Arquivos de referência:**
- `src/app/(backoffice)/admin/leads/page.tsx` — pattern já migrado
- `src/lib/shared/server-fetch.ts` — helper
- `docs/rsc-pattern.md` — documentação do pattern

---

*Analisado por @architect (Aria) — Synkra AIOX*
*Handoff pronto para @dev →*
