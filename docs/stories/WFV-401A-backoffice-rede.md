# Story WFV-401A — Backoffice Rede vertical para academias, unidades e onboarding

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | Wave de validação de formulários web |
| **Agent** | @dev |
| **Created By** | Codex |
| **Created** | 2026-04-28 |
| **Priority** | Alta |
| **Complexity** | L |

---

## Contexto

O recorte executivo desta wave congela o backoffice de rede em:

- academias
- unidades
- onboarding de unidade

Sem abrir `WhatsApp`, `gateways` e `configurações globais`.

---

## Problema / Objetivo

**Problema:** os forms globais ainda usam validação manual parcial e dependem de backend permissivo em updates.

**Objetivo:** fechar o ciclo FE + BE + UX de erro para os formulários globais de rede.

---

## Acceptance Criteria

1. Formulários de academia e unidade usam schema claro e erro inline nos campos críticos.
2. Campos como `nome`, `documento`, `email`, `subdomain` e partes relevantes de `onboarding` validam antes do submit.
3. Erros do backend voltam ao campo correspondente quando aplicável.
4. Fluxos cobertos não usam primitives nativas.
5. Playwright cobre create/edit com caso inválido principal.

---

## Escopo técnico

### Áreas alvo

- telas de academias globais
- telas de unidades globais
- onboarding de unidade

### Fora de escopo

- `WhatsApp`
- `gateways`
- `configurações globais`
- importação ZIP/ETL

---

## Tasks

- [ ] Refatorar form de academia para schema e erro inline
- [ ] Refatorar form de unidade para schema e erro inline
- [ ] Refatorar onboarding de unidade para section-level/field-level error
- [ ] Substituir primitives nativas por dialog/toast do sistema
- [ ] Cobrir create/edit inválido com teste automatizado

---

## Dependências

- **Bloqueadoras:** `WFV-001`, `WFV-002`, `VF-401A`
- **Desbloqueia:** replicação do padrão para módulos globais futuros

---

## Test plan

1. Unit/schema — academia, unidade, onboarding.
2. Component — erro inline e preserve state após erro.
3. E2E — create/edit inválido no backoffice global.

---

*Gerada por Codex com backlog validado por @po e @qa*

