# Story VUN-2.1 — `universal-search.tsx` com Command shadcn + scanner inline

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft |
| **Epic** | VUN-2 — Catálogo + Busca Universal |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | M |
| **Branch** | `feat/vun-2.1-universal-search` |

---

## Contexto

PRD §2.2 e §10.3 pedem busca universal com atalho **⌘K** usando o componente `Command` do shadcn, com resultados **agrupados** (Clientes / Planos / Produtos) e **scanner inline** (código de barras). A busca fica no slot `headerCenter` do `CockpitShell` (VUN-1.3).

Hoje existe `hooks/use-barcode-scanner.ts` que pode ser reusado diretamente. Também existem endpoints REST para clientes, planos e produtos — esta story **não cria endpoints novos**, apenas orquestra chamadas a endpoints existentes (`@dev` valida no spike inicial).

---

## Problema / Objetivo

**Problema:** atendente precisa abrir menus diferentes para achar cliente, plano ou produto. Scanner físico de código de barras não se conecta ao cockpit.

**Objetivo:** uma única caixa de busca que acha qualquer entidade (cliente por nome/CPF, plano por nome/código, produto por código de barras ou nome) e permite adicionar ao carrinho com 1 clique.

---

## Acceptance Criteria

1. **AC1** — Componente `src/app/(portal)/vendas/nova/components/universal-search.tsx` (Client Island) renderiza um `Command` do shadcn com trigger "⌘K" visível no header do cockpit.
2. **AC2** — Atalho `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux) abre a busca. Tecla `Esc` fecha.
3. **AC3** — Input digitado **≥3 caracteres** dispara busca debounced (300ms) em 3 endpoints existentes (confirmar no spike):
   - `GET /api/v1/clientes?q={termo}&limit=5`
   - `GET /api/v1/planos?q={termo}&limit=5`
   - `GET /api/v1/produtos?q={termo}&limit=5`
4. **AC4** — Resultados são **agrupados** em 3 seções (Clientes / Planos / Produtos) usando `CommandGroup`. Cada item mostra ícone `lucide` correspondente e uma descrição curta.
5. **AC5** — Scanner inline: botão `ScanLine` dentro do input abre submode que escuta `use-barcode-scanner.ts`. Código lido dispara busca exata em `/api/v1/produtos?codigoBarras={cod}` e adiciona produto ao carrinho.
6. **AC6** — Selecionar um **cliente** chama `onSelectCliente(cliente)` via callback prop — `page.tsx` faz set do cliente ativo.
7. **AC7** — Selecionar um **plano** chama `onSelectPlano(plano)` — plano adicionado ao carrinho (comportamento atual preservado em VUN-1.3).
8. **AC8** — Selecionar um **produto** chama `onSelectProduto(produto)` — adicionado ao carrinho.
9. **AC9** — Se cliente **não existe** ao digitar CPF válido, exibe opção "Criar prospect rápido" (RN-014) — essa ação fica em VUN-2.4 mas o placeholder/footer já deve aparecer.
10. **AC10** — A11y: input tem label, resultados navegáveis por setas, `aria-selected` correto, foco gerenciado.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Descrição |
|---------|-----------|
| `src/app/(portal)/vendas/nova/components/universal-search.tsx` | Client Island com `Command` |
| `src/app/(portal)/vendas/nova/components/universal-search.spec.tsx` | Testes unitários |

### Arquivos a alterar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `src/app/(portal)/vendas/nova/page.tsx` | Editar | Injetar `<UniversalSearch />` no slot `headerCenter` do `CockpitShell`, com callbacks cabíveis |

### Dependências de libs

- shadcn `Command` (confirmar que já está instalado — é padrão do projeto).
- `lucide-react` (`ScanLine`, `User`, `Zap`, `Package`).
- Reusa `hooks/use-barcode-scanner.ts`.

---

## Tasks

- [x] **T1** Spike: confirmar endpoints existentes (AC3) — endpoints reais encontrados: `/api/v1/comercial/alunos?search=` (aceita `search`, não `q`), `/api/v1/comercial/planos?tenantId=&apenasAtivos=` (**não** aceita `q` → filtro client-side), `/api/v1/comercial/produtos?apenasAtivos=` (**não** aceita `q` → filtro client-side). Spike `?codigoBarras=` também não existe: scanner resolve via lista cacheada com filtro client-side por `codigoBarras`/`sku`, alinhado ao comportamento atual de `use-sale-items::applyCodeToProduct`.
- [x] **T2** Criar `universal-search.tsx` usando `cmdk` diretamente (AC1, AC2) — shadcn `Command` wrapper não existe no repo; projeto já usa `cmdk` direto (ver `command-palette.tsx`).
- [x] **T3** Implementar busca debounced (300ms) + fetch paralelo via `Promise.allSettled` nos 3 endpoints existentes (AC3, AC4)
- [x] **T4** Integrar `use-barcode-scanner.ts` via modo scanner inline (AC5)
- [x] **T5** Callbacks `onSelect*` + injeção na `page.tsx` (AC6, AC7, AC8)
- [x] **T6** Footer "Criar prospect rápido" como placeholder para VUN-2.4 (AC9) — ativa quando termo parece CPF (11 dígitos) e não há clientes.
- [x] **T7** A11y (AC10) — input com `aria-label`, lista com `aria-label`, toggle scanner com `aria-pressed`, itens com `role=option`/`aria-selected` (herdado do `cmdk`), trigger com `aria-label`.
- [x] **T8** Testes unitários (`tests/components/universal-search.test.tsx`) — 9/9 passam. E2E Playwright: pendente (fora do escopo desta entrega).

---

## Dependências

- **Bloqueadoras:** VUN-1.3
- **Desbloqueia:** VUN-2.4 (criação inline de prospect usa footer)

---

## Riscos específicos da story

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Endpoint não aceita `?q=` | Média | Alto | Spike T1; se ausente, story é replanejada com endpoint agregador (seria VUN-2.1b) |
| Scanner captura tecla enquanto busca aberta | Média | Médio | Desabilitar scanner quando modal fechada; só ativar em modo "scanner inline" |
| `Cmd+K` conflitar com shortcut do Next.js dev tools | Baixa | Baixo | Testar em build de produção |

---

## Test plan

1. **Unit** — render do `Command`, filtro agrupado, select dispara callback.
2. **E2E Playwright**:
   - abrir com ⌘K, digitar "Maria", selecionar cliente
   - buscar plano, adicionar ao carrinho
   - simular scan de código de barras e adicionar produto
3. **A11y** — navegação por teclado end-to-end.

---

*Gerada por @sm (River)*
