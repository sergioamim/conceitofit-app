# Story VUN-1.2 — `CockpitShell` com header escuro 56px + grid 3 colunas

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-1 — Fundação Visual (Cockpit Shell) |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Crítica |
| **Complexity** | S |
| **Branch** | `feat/vun-1.2-cockpit-shell` |

---

## Contexto

PRD §8.1 e §10 definem a casca do cockpit: header escuro 56px (fundo `--ink`), grid de 3 colunas (cliente/tabs ~360px + catálogo flex + painel pagamento ~400px) e target 1440×900 para a estação de recepção. Esta story cria apenas o shell (`cockpit-shell.tsx`) — **não** consome nem refatora nenhum componente de negócio; foca em slots tipados que serão preenchidos pelas Fases 2-4.

Deve ser o segundo merge do programa VUN, imediatamente após VUN-1.1.

---

## Problema / Objetivo

**Problema:** sem um container oficial do cockpit, componentes de catálogo/pagamento não têm onde se encaixar; layout atual em `src/app/(portal)/vendas/nova/page.tsx` não tem a estrutura de 3 colunas.

**Objetivo:** entregar um componente `CockpitShell` puramente estrutural com slots (`headerLeft`, `headerCenter`, `headerRight`, `columnLeft`, `columnCenter`, `columnRight`) e breakpoints responsivos base.

---

## Acceptance Criteria

1. **AC1** — Novo arquivo `src/app/(portal)/vendas/nova/components/cockpit-shell.tsx` exporta `CockpitShell` como Server Component (sem `"use client"`) com props tipadas:
   ```ts
   type CockpitShellProps = {
     headerLeft?: ReactNode;
     headerCenter?: ReactNode;
     headerRight?: ReactNode;
     columnLeft: ReactNode;
     columnCenter: ReactNode;
     columnRight: ReactNode;
   };
   ```
2. **AC2** — Header de altura fixa **56px**, background `var(--ink)`, color `oklch(0.98 0 0)` (texto claro); padding horizontal equivalente a `px-6` (24px); três slots horizontais alinhados `justify-between`.
3. **AC3** — Corpo em `grid grid-cols-[360px_minmax(0,1fr)_400px]` no viewport `>=1440px`. No breakpoint `>=1024px` e `<1440px` ajustar para `grid-cols-[320px_minmax(0,1fr)_380px]`. Abaixo de 1024px não renderiza em produção (fora do escopo — target é 1440×900).
4. **AC4** — Gap interno entre colunas `gap-0` (colunas são contíguas com separador via border-right — ver handoff). Separador usa `--border`.
5. **AC5** — Altura do body = `calc(100vh - 56px - altura-do-app-shell-externo)`. Exato: inspecionar layout atual do `(portal)` e ajustar.
6. **AC6** — Testes visuais 1440×900 e 1920×1080 OK.
7. **AC7** — `npm run build`, `npm run lint`, `npm run typecheck`, `npm test` passam.
8. **AC8** — Página `/vendas/nova` **não** é alterada nesta story — apenas o componente é criado e testado isoladamente.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/(portal)/vendas/nova/components/cockpit-shell.tsx` | Shell puro com slots tipados |
| `src/app/(portal)/vendas/nova/components/cockpit-shell.spec.tsx` | Teste unitário: renderiza 6 slots |

### Dependências de libs

- Nenhuma nova.

---

## Tasks

- [ ] **T1** Criar componente `CockpitShell` com slots tipados (AC1)
- [ ] **T2** Implementar header 56px com `bg-[var(--ink)]` e 3 sub-slots (AC2)
- [ ] **T3** Implementar grid 3 colunas com breakpoints do handoff (AC3, AC4, AC5)
- [ ] **T4** Criar teste unitário (AC6)
- [ ] **T5** Snapshots Playwright em 1440×900 e 1920×1080 de uma página de sandbox que renderiza `CockpitShell` com slots mockados
- [ ] **T6** Rodar build/lint/typecheck/test (AC7)

---

## Dependências

- **Bloqueadora:** VUN-1.1 (tokens `--ink`)
- **Desbloqueia:** VUN-1.3, toda a Epic VUN-2 e downstream

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Header 56px conflitar com nav global do `(portal)` | Média | Médio | Inspecionar layout do `(portal)` — header do cockpit fica **abaixo** do nav global |
| Largura 360/400 não acomodar componentes legados | Média | Médio | Colunas com `overflow-y: auto`; ajustar `min-width` interno |
| SSR/Hydration — slots `ReactNode` passados por Server Component | Baixa | Alto | Seguir CLAUDE.md do projeto: árvore SSR idêntica à client, sem `Date.now`/`Math.random` |

---

## Test plan

1. **Unit** — renderiza os 6 slots identificados por `data-testid`.
2. **Visual** — Playwright snapshot em 1440×900 e 1920×1080 com slots mockados (cor sólida por slot).
3. **Regressão** — build/lint/typecheck/test OK.

---

## Notas de implementação

- Preferir **Server Component** (seguindo padrão do projeto — `docs/rsc-pattern.md`). Se algum filho vier a precisar de `"use client"`, isso é responsabilidade do consumidor do slot, não do shell.
- Não renderizar nada condicional baseado em window/tempo no shell.

---

*Gerada por @sm (River)*
