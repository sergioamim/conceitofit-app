# Story WFV-002 — Mapeamento do erro canônico do backend para campo, toast e modal

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | Wave de validação de formulários web |
| **Agent** | @dev |
| **Created By** | Codex |
| **Created** | 2026-04-28 |
| **Priority** | Alta |
| **Complexity** | S |

---

## Contexto

O backend já consegue devolver `fieldErrors`, mas muitas telas ainda reduzem isso a string genérica ou toast único.

Esta story fecha a ponte entre o contrato canônico do backend e o comportamento esperado no web.

---

## Problema / Objetivo

**Problema:** o mesmo payload inválido pode aparecer inline em uma tela e virar mensagem genérica em outra.

**Objetivo:** padronizar o consumo do erro canônico do backend no web.

---

## Acceptance Criteria

1. Erros de validação por campo retornam ao campo quando houver correspondência clara.
2. Erros operacionais sem correspondência de campo continuam em toast/modal coerente.
3. Adapter evita parsing ad hoc por tela.
4. Existe ao menos um fluxo de backoffice e um de catálogo provando o mapeamento correto.

---

## Tasks

- [ ] Definir estratégia única de mapping `fieldErrors`
- [ ] Integrar helper à foundation criada em `WFV-001`
- [ ] Aplicar em um fluxo de backoffice e um de catálogo
- [ ] Validar fallback para erro não mapeável

---

## Dependências

- **Bloqueadoras:** `WFV-001`, `VF-002`
- **Desbloqueia:** `WFV-401A`, `WFV-201A`

---

## Test plan

1. Unit — `fieldErrors` com correspondência de campo.
2. Unit — erro não mapeável cai em toast/modal.
3. Component — campo recebe mensagem do backend.

---

*Gerada por Codex com backlog validado por @po e @qa*

