# Story WFV-201A — Catálogo comercial vertical para planos, serviços, produtos e convênios

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

O recorte executivo desta wave cobre o catálogo que alimenta a operação comercial:

- planos
- serviços
- produtos
- convênios

`cargo`, vouchers, financeiro, CRM e storefront ficam fora deste slice.

---

## Problema / Objetivo

**Problema:** create/update de catálogo não seguem o mesmo nível de blindagem e o tratamento de erro ainda varia entre modais.

**Objetivo:** padronizar schema, submit e erro server-side para o catálogo comercial prioritário.

---

## Acceptance Criteria

1. Forms de plano, serviço, produto e convênio usam schema padronizado e erro inline consistente.
2. Campos numéricos críticos rejeitam lixo residual antes do submit.
3. Erros do backend são preservados no campo correto.
4. Updates deixam de depender só de saneamento no handler.
5. Há evidência automatizada de erro mapeado em pelo menos um fluxo por entidade.

---

## Escopo técnico

### Áreas alvo

- catálogo de planos
- catálogo de serviços
- catálogo de produtos
- cadastro/edição de convênios

### Fora de escopo

- `cargo`
- vouchers
- financeiro
- storefront / checkout público
- CRM

---

## Tasks

- [ ] Revisar schema e payload de planos
- [ ] Revisar schema e payload de serviços
- [ ] Revisar schema e payload de produtos
- [ ] Revisar schema e payload de convênios
- [ ] Padronizar mapping de erro backend -> campo
- [ ] Cobrir erro inválido com teste automatizado por entidade prioritária

---

## Dependências

- **Bloqueadoras:** `WFV-001`, `WFV-002`, `VF-201A`
- **Desbloqueia:** ondas futuras de venda/CRM apoiadas em catálogo

---

## Test plan

1. Unit/schema — plano, serviço, produto e convênio.
2. Component — erro inline em campos críticos monetários/textuais.
3. E2E — CRUD inválido do catálogo comercial.

---

*Gerada por Codex com backlog validado por @po e @qa*

