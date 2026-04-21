# Story VUN-4.2 — Modal Recibo: a11y + "Nova venda" reset + mocks de print/email

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-4 — Modal Recibo Upgrade |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Média |
| **Complexity** | S |
| **Branch** | `feat/vun-4.2-modal-recibo-a11y` |

---

## Contexto

Fecha a Epic VUN-4 adicionando as ações funcionais (mockadas em V1 por estar fora de escopo a impressora real — PRD §5) com `aria-live`, gerenciamento de foco, e o comportamento "Nova venda" que limpa tudo e foca o input da busca universal (VUN-2.1).

---

## Problema / Objetivo

**Objetivo:** completar a Fase 4 com acessibilidade e fluxo de "próxima venda" sem atrito.

---

## Acceptance Criteria

1. **AC1** — Botão "Enviar por e-mail" dispara handler mockado que (a) valida e-mail via zod, (b) simula delay 600ms, (c) anuncia via `aria-live="polite"` "E-mail enviado". Estado visual de loading durante envio.
2. **AC2** — Botão "Imprimir" mock: simula delay 800ms, anuncia `aria-live` "Enviado para impressora".
3. **AC3** — Atalhos PDF / WhatsApp / 2ª via: stubs com handlers vazios e `aria-label` corretos.
4. **AC4** — Botão "Nova venda" limpa `use-venda-workspace`, fecha modal e **foca o input** da `universal-search` (ref + `focus()` no effect).
5. **AC5** — Foco ao abrir modal vai para o botão "Enviar por e-mail"; `Esc` fecha modal e devolve foco ao botão que chamou a venda.
6. **AC6** — E2E: venda → modal abre → clicar "Nova venda" → modal fecha → `/vendas/nova` recém-iniciada, foco na busca universal.
7. **AC7** — Axe/axe-core rodando nos testes: zero violações críticas.

---

## Escopo técnico

### Arquivos a alterar

| Arquivo | Ação |
|---------|------|
| `src/components/shared/sale-receipt-modal.tsx` | Adicionar handlers mock + a11y |

### Arquivos a alterar (secundário)

| Arquivo | Ação |
|---------|------|
| `src/app/(portal)/vendas/nova/components/universal-search.tsx` | Expor ref/imperativa para foco |

---

## Tasks

- [ ] **T1** Handler mock e-mail + aria-live (AC1)
- [ ] **T2** Handler mock print + aria-live (AC2)
- [ ] **T3** Stubs PDF/WhatsApp/2ª via (AC3)
- [ ] **T4** "Nova venda" reset + foco na busca (AC4, AC5)
- [ ] **T5** Testes E2E + Axe (AC6, AC7)

---

## Dependências

- **Bloqueadoras:** VUN-4.1, VUN-2.1

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| "Focus leak" ao navegar entre buscou/modal | Média | Baixo | Usar `useRef` + `focusTrap` do shadcn Dialog |
| Axe reportar violações não-óbvias | Média | Médio | Rodar axe local antes de abrir PR |

---

## Test plan

1. **Unit** handlers mock.
2. **E2E** fluxo completo pós-venda (AC6).
3. **A11y** axe-core sem violações críticas.

---

*Gerada por @sm (River)*
