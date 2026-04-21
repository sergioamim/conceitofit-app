# Story VUN-2.2 — Catálogos `catalog-planos`, `catalog-servicos`, `catalog-produtos`

## Metadados

| Campo | Valor |
|-------|-------|
| **Status** | `[x]` Draft → `[ ]` Ready → `[ ]` In Progress → `[ ]` Review → `[ ]` Done |
| **Epic** | VUN-2 · Catálogo + Busca Universal |
| **Agent** | @dev (Dex) |
| **Created By** | @sm (River) |
| **Created** | 2026-04-20 |
| **Priority** | Alta |
| **Complexity** | M (≈ 2 dias) |
| **Branch** | `feat/vun-2.2-catalogos` |

---

## Contexto

PRD §8.1 pede 3 catálogos novos:

- `catalog-planos.tsx` — grid 2×2 com ribbon "Recomendado" dourado + card invertido para destaque.
- `catalog-servicos.tsx` — lista vertical com botão `+`.
- `catalog-produtos.tsx` — grid 3×2 com thumbnail placeholder.

Eles vivem dentro do slot `center` do `CockpitShell`. VUN-2.3 (tab segmented) coordena qual catálogo aparece; nesta story entregamos os três componentes isolados.

### Problema

Componentes atuais (dentro de `sale-type-selector`) misturam catálogo com controle de tab; separar em componentes puros por modalidade prepara o terreno pra VUN-2.3.

---

## Objetivo

Três catálogos puros (stateless sobre tab), cada um consumindo sua própria lista via props.

---

## Acceptance Criteria

1. **AC1** — `components/catalog-planos.tsx` renderiza grid 2×2 recebendo `planos: Plano[]` como props; item com flag `recomendado: true` ganha ribbon dourado; item com flag `destaque: true` ganha card invertido (cores trocadas).
2. **AC2** — `components/catalog-servicos.tsx` renderiza lista vertical recebendo `servicos: Servico[]`; cada item tem botão `+` que dispara `onAdd(servico)`.
3. **AC3** — `components/catalog-produtos.tsx` renderiza grid 3×2 recebendo `produtos: Produto[]`; cada card tem thumbnail (placeholder `--muted` se sem imagem), nome, preço formatado (`font-mono`), botão `+`.
4. **AC4** — Nenhum dos componentes faz fetch — todos consomem props. Fetch fica em quem orquestra (`page.tsx` ou hook).
5. **AC5** — Preços renderizados com `font-mono` (classe Tailwind, consumindo `--font-mono` da VUN-1.1).
6. **AC6** — Responsivo: em breakpoint 768-1279 (right collapsed), catálogos ajustam colunas (2→1 produto, mantém planos 2×2 ou cai pra 1 coluna se largura <600px).
7. **AC7** — Testes unitários para os 3 componentes: render happy, ribbon/destaque, botão `+` dispara handler.
8. **AC8** — `npm run lint/typecheck/test/build` passam.

---

## Escopo técnico

### Arquivos a criar

| Arquivo | Ação |
|---------|------|
| `components/catalog-planos.tsx` | NOVO |
| `components/catalog-servicos.tsx` | NOVO |
| `components/catalog-produtos.tsx` | NOVO |
| `components/catalog-planos.spec.tsx` | Test unit |
| `components/catalog-servicos.spec.tsx` | Test unit |
| `components/catalog-produtos.spec.tsx` | Test unit |

### Tipos (pseudo-schema)

```ts
type Plano = {
  id: string;
  nome: string;
  preco: number;
  badge?: string;
  recomendado?: boolean;
  destaque?: boolean;
};
type Servico = { id: string; nome: string; preco: number; descricao?: string };
type Produto = { id: string; nome: string; preco: number; thumbnailUrl?: string };
```

Tipos devem ser co-localizados ou reusar tipos existentes em `src/lib/types/` (verificar antes de criar novos).

### Libs

- Nenhuma nova. Ícone `+` via `lucide-react` (já instalado).

---

## Tasks

- [ ] Verificar se tipos `Plano`, `Servico`, `Produto` já existem em `src/lib/types/`; reusar se sim
- [ ] Criar `catalog-planos.tsx` com grid 2×2 + ribbon + destaque
- [ ] Criar `catalog-servicos.tsx` com lista vertical
- [ ] Criar `catalog-produtos.tsx` com grid 3×2
- [ ] Implementar responsividade (AC6)
- [ ] Aplicar `font-mono` nos preços (AC5)
- [ ] Specs unit para os 3 componentes (AC7)
- [ ] Rodar suite

---

## Dependências

- **Bloqueadoras:** VUN-1.1 (`font-mono`), VUN-1.3 (page.tsx usando shell).
- **Bloqueia:** VUN-2.3 (tab segmented que coordena os 3).

---

## Riscos específicos

| Risco | Mitigação |
|-------|-----------|
| Tipos `Plano`/`Servico`/`Produto` divergem dos tipos do backend atual | Reusar tipos existentes; se não houver, derivar de schemas `src/lib/api/` atuais |
| Ribbon "Recomendado" dourado sem token definido | Usar `--gold` se existir, senão derivar de tokens amber do Tailwind e documentar no PR |
| Grid 3×2 em produtos não acomoda 6+ itens | Adicionar scroll interno vertical no container; paginação só em Epic futuro |

---

## Test plan

- Unit: render + interação do botão `+`.
- Visual snapshot: 1 snapshot por catálogo a 1440×900.
- A11y: axe sobre cada catálogo renderizado.

---

## Notas

- Nenhum catálogo cria/chama API. Apenas props.
- Ícone PIX customizado (SVG) não é necessário aqui — é só pagamento (VUN-3.2).

---

*Gerada por @sm (River) · validada por @po (Pax) · AIOX VUN*
