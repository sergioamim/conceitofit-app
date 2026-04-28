# Story WFV-001 — Form foundation, guardrails e anti-primitives nativas

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | Wave de validação de formulários web |
| **Agent** | @dev |
| **Created By** | Codex |
| **Created** | 2026-04-28 |
| **Priority** | Alta |
| **Complexity** | M |

---

## Contexto

O `academia-app` já possui formulários novos em `react-hook-form + zod`, mas ainda convive com:

- flows que achatam `fieldErrors` em string genérica;
- uso residual de `alert`, `confirm` e `prompt`;
- formulários equivalentes com regras locais divergentes;
- adapters de erro espalhados.

Esta story cria a foundation obrigatória antes das ondas de domínio.

---

## Problema / Objetivo

**Problema:** cada módulo tende a reimplementar schema, erro e UX de confirmação de forma diferente.

**Objetivo:** consolidar foundation reutilizável para forms, erro canônico e guardrail anti-primitives nativas.

---

## Acceptance Criteria

1. Existe foundation reutilizável para `react-hook-form + zodResolver` nas telas cobertas pela wave.
2. Existe adapter padrão para erro backend -> campo/toast/modal.
3. O guideline deixa claro quando usar erro inline, toast e dialog.
4. Arquivos tocados pela story não usam `alert`, `confirm` ou `prompt` nativos.
5. Há teste automatizado cobrindo mapping de erro por campo.

---

## Escopo técnico

### Arquivos / áreas alvo

- `src/lib/forms/*`
- `src/lib/utils/api-error.ts`
- helper compartilhado de mapping de erro
- regra estrutural anti-primitives nativas para fluxos cobertos

### Fora de escopo

- migração completa de todos os forms do app
- rollout mobile
- mudança de contrato backend além do necessário para `fieldErrors`

---

## Tasks

- [ ] Consolidar foundation compartilhada para forms
- [ ] Criar helper padrão de mapping `ApiRequestError -> setError`
- [ ] Documentar padrão inline/toast/dialog
- [ ] Remover primitives nativas dos fluxos tocados por esta story
- [ ] Cobrir caso inválido principal com teste unit/component

---

## Dependências

- **Bloqueadoras:** `VF-001`, `VF-002`
- **Desbloqueia:** `WFV-002`, `WFV-401A`, `WFV-201A`

---

## Test plan

1. Unit — adapter de erro backend -> campo.
2. Component — erro inline em form RHF.
3. Structural check — ausência de primitives nativas nos arquivos tocados.

---

*Gerada por Codex com backlog validado por @po e @qa*

