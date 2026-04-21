# Story VUN-5.2 — Modal "Vincular Agregador" + service `src/lib/api/agregadores-vinculos.ts`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador (Frontend) |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | S |
| **Branch** | `feat/vun-5.2-modal-vincular-agregador` |

---

## Contexto

PRD §8.1 pede modal "Vincular agregador" com 3 campos (select tipo + ID externo + confirmar), disparada via CTA do wizard (VUN-5.1) e também pelo perfil do aluno (fora desta story — apenas o componente é reusável).

Consome endpoint `POST /api/v1/agregadores/vinculos` implementado no backend pela VUN-5.4 — esta story **depende do backend estar em prod** para fechar.

---

## Problema / Objetivo

**Problema:** hoje criar vínculo agregador requer cadastro em tela separada ou ticket manual.

**Objetivo:** UX rápida pela recepção.

---

## Acceptance Criteria

1. **AC1** — Novo componente `src/components/shared/vincular-agregador-modal.tsx` (Client Island) com 3 campos:
   - Select "Tipo" (options: `WELLHUB`, `TOTALPASS` — lista deve vir de enum compartilhado com backend)
   - Input "ID externo" (text, obrigatório)
   - (Opcional) Input "Data início" (date picker, default hoje)
2. **AC2** — Submit chama `postAgregadorVinculo({ alunoId, agregador, externalUserId, dataInicio })` via novo service `src/lib/api/agregadores-vinculos.ts`.
3. **AC3** — Sucesso (201): toast "Vínculo criado", modal fecha, emite evento para caller (ex: wizard → redireciona para perfil).
4. **AC4** — Erro: toast com mensagem do backend (409 se já existe vínculo, 400 se validação).
5. **AC5** — `react-hook-form` + `zod`.
6. **AC6** — Testes E2E completo.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/components/shared/vincular-agregador-modal.tsx` | Modal reusável |
| `src/components/shared/vincular-agregador-modal.schema.ts` | Schema zod |
| `src/lib/api/agregadores-vinculos.ts` | Client service |
| `src/components/shared/__tests__/vincular-agregador-modal.spec.tsx` | Testes |

---

## Tasks

- [ ] **T1** Criar service `agregadores-vinculos.ts` (AC2)
- [ ] **T2** Modal com form (AC1, AC5)
- [ ] **T3** Submit + toasts (AC3, AC4)
- [ ] **T4** E2E (AC6)

---

## Dependências

- **Bloqueadoras:** VUN-5.4 (endpoint backend em produção)
- **Desbloqueia:** CTA 3 do wizard (VUN-5.1) + reuso no perfil do aluno

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Enum `agregador` divergir front/back | Alta | Alto | Compartilhar via types gerados ou literal union espelhando entidade |
| Endpoint retornar diferente do spec | Alta | Alto | Valida junto com VUN-5.4 no mesmo PR de integração |

---

## Test plan

1. **Unit** schema zod.
2. **E2E** cenário happy + cenário 409.

---

*Gerada por @sm (River)*
