# Story VUN-5.1 — Wizard Novo Cliente com 3 CTAs finais + remoção `wizard-step-plano`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-5 — Consolidação Comercial + Agregador |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | M |
| **Branch** | `feat/vun-5.1-wizard-3-ctas` |

---

## Contexto

**RN-010 (PRD §11):** "Wizard Novo Cliente termina com 3 CTAs: Salvar, Vender, Vincular agregador. Nenhum deles force o usuário a continuar para o wizard-step-plano."

Hoje `src/components/shared/novo-cliente-wizard/novo-cliente-wizard.tsx` linhas 94-106 já tem 3 CTAs no Step 1, mas o wizard ainda expõe passos 2-3 (`wizard-step-plano.tsx`, `wizard-step-pagamento.tsx`). Esta story **remove** a etapa plano e reconecta as 3 CTAs aos destinos certos.

---

## Problema / Objetivo

**Problema:** wizard atual obriga navegar Step 2 (plano) e Step 3 (pagamento) — é exatamente a duplicação que o cockpit resolve.

**Objetivo:** wizard termina no Step 1 com 3 CTAs reais: Salvar (lista), Vender (redirect cockpit), Vincular agregador (modal — VUN-5.2).

---

## Acceptance Criteria

1. **AC1** — Remover arquivo `src/components/shared/novo-cliente-wizard/wizard-step-plano.tsx`.
2. **AC2** — Ajustar `novo-cliente-wizard.tsx` para **não** navegar ao step-plano; Step 1 é final.
3. **AC3** — CTA "Salvar" chama `POST /api/v1/clientes` (tipo PROSPECT), fecha wizard, retorna para listagem com toast de sucesso.
4. **AC4** — CTA "Vender" cria prospect, redireciona para `/vendas/nova?clienteId=<id>`; cockpit pré-popula cliente (slot `columnLeft`) e ativa tab PLANO.
5. **AC5** — CTA "Vincular agregador" cria prospect e abre modal de VUN-5.2 (esta story apenas emite evento; modal implementado em VUN-5.2).
6. **AC6** — `wizard-step-pagamento.tsx` deixa de ser referenciado pelo wizard mas **não é deletado** (ainda pode ser usado por outros fluxos — remoção completa fica para VUN-5.3/limpeza).
7. **AC7** — Teste E2E: 3 CTAs funcionais, cada uma seguindo seu destino.
8. **AC8** — Build/lint/typecheck/test passam.

---

## Escopo técnico

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/components/shared/novo-cliente-wizard/novo-cliente-wizard.tsx` | Remover navegação para step-plano, conectar CTAs |

### Arquivos a remover

| Arquivo |
|---------|
| `src/components/shared/novo-cliente-wizard/wizard-step-plano.tsx` |

### Arquivos a ler (contexto)

- `src/app/(portal)/vendas/nova/page.tsx` — aceitar `?clienteId=` e pré-popular

---

## Tasks

- [ ] **T1** Remover `wizard-step-plano.tsx` (AC1)
- [ ] **T2** Ajustar orquestração do wizard (AC2)
- [ ] **T3** Implementar handlers das 3 CTAs (AC3, AC4, AC5)
- [ ] **T4** Aceitar `?clienteId=` em `/vendas/nova` (AC4)
- [ ] **T5** E2E (AC7)
- [ ] **T6** Build/lint/typecheck/test (AC8)

---

## Dependências

- **Bloqueadoras:** VUN-5.2 (modal de vínculo agregador — CTA 3 precisa abrir modal real)
- **Bloqueadora soft:** Epic VUN-1..VUN-4 em produção ≥ 14 dias (ver §13 do PRD — risco regressão)
- **Desbloqueia:** VUN-5.3 (limpeza final)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Outro componente ainda importar `wizard-step-plano` | Alta | Alto | Grep `wizard-step-plano` pré-remoção; bloquear merge se houver import |
| Redirect `/vendas/nova?clienteId=` sem handler | Alta | Alto | Task T4 dedicada para aceitar query param |

---

## Test plan

1. **E2E** as 3 CTAs cada uma.
2. **Regressão** — qualquer outro lugar que chamava wizard (busca grep) continua funcional.

---

*Gerada por @sm (River)*
