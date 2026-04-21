# Story VUN-2.4 — Criação inline de Prospect via busca universal (RN-014)

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-2 — Catálogo + Busca Universal |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Média |
| **Complexity** | S |
| **Branch** | `feat/vun-2.4-prospect-inline` |

---

## Contexto

RN-014 (PRD §11): "Se cliente não existe ao digitar CPF na busca universal, cockpit abre inline o fluxo de criação rápida de Prospect (mínimo: nome + CPF) antes de permitir adicionar plano."

VUN-2.1 adicionou um footer placeholder "Criar prospect rápido"; esta story implementa o fluxo completo.

---

## Problema / Objetivo

**Problema:** atendente digita CPF de cliente novo, não acha ninguém, precisa cancelar fluxo e abrir outro menu.

**Objetivo:** criar Prospect rapidamente (nome + CPF) sem sair da busca universal, e já pré-selecioná-lo no cockpit.

---

## Acceptance Criteria

1. **AC1** — Quando input da busca universal contém CPF válido (11 dígitos) e **nenhum** cliente retorna nos resultados, exibir footer "Nenhum cliente encontrado — Criar prospect com CPF {cpf formatado}".
2. **AC2** — Clicar no footer abre mini-form inline no mesmo `Command` com 2 campos: Nome completo (obrigatório) + CPF (pré-preenchido, readonly).
3. **AC3** — Submit dispara `POST /api/v1/clientes` com payload `{ nome, cpf, tipo: "PROSPECT" }` (confirmar rota e shape no spike).
4. **AC4** — Sucesso: toast "Prospect criado", cliente auto-selecionado no cockpit, busca fecha.
5. **AC5** — Erro: toast com mensagem do backend, form permanece aberto.
6. **AC6** — Se CPF não é válido (formato), footer **não** aparece.
7. **AC7** — Usa `react-hook-form` + `zod` (projeto CLAUDE.md exige).
8. **AC8** — Teste E2E do fluxo completo.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/(portal)/vendas/nova/components/prospect-inline-form.tsx` | Mini form Client Island |
| `src/app/(portal)/vendas/nova/components/prospect-inline-form.schema.ts` | Schema zod |
| `src/lib/api/clientes/create-prospect.ts` | Client fetcher (confirmar se já existe) |

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/components/universal-search.tsx` | Substituir footer placeholder pelo fluxo real |

### Dependências de libs

- `react-hook-form`, `zod`, `@hookform/resolvers/zod` (já no projeto).

---

## Tasks

- [x] **T1** Spike: rota real é `POST /api/v1/academia/prospects` (e não `/api/v1/clientes`). Payload via `ProspectUpsertApiRequest` exige `telefone` além de `nome`/`cpf`. Sem `tipo: "PROSPECT"` — tipo é implícito pelo endpoint.
- [x] **T2** Criar schema zod e mini-form (AC2, AC7)
- [x] **T3** Validação de CPF reusa `validateCPF` em `src/components/shared/cpf-validator.ts`
- [x] **T4** Integrar no `universal-search.tsx` (AC1, AC4, AC5, AC6)
- [x] **T5** Toast + reflexo visual no campo cliente do cockpit via `setClienteQuery` (AC4)
- [ ] **T6** E2E Playwright (AC8) — pendente (fora do escopo deste agente; unit tests cobrem os ACs principais)

---

## Dependências

- **Bloqueadoras:** VUN-2.1
- **Desbloqueia:** fluxo de venda para cliente novo via cockpit

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Backend `POST /api/v1/clientes` exigir mais campos que CPF+nome | Alta | Médio | Spike T1; se exigir, story expande para campos adicionais (ex: telefone) |
| CPF já existe mas como inativo/oculto | Média | Alto | Backend retorna 409 conflict com cliente existente → cockpit abre cliente em vez de criar novo |

---

## Test plan

1. **Unit** — validação zod (CPF válido/inválido, nome vazio).
2. **E2E** — fluxo completo criar + auto-selecionar.
3. **Sad path** — CPF já existe → abre cliente existente; nome vazio → bloqueia submit.

---

*Gerada por @sm (River)*
