# RSC & Bundle Optimization Audit

> Gerado em 2026-03-27 | Task 113

## Resumo

80 de ~85 arquivos de rota em `src/app` possuem `"use client"` no topo, forçando todo o JS para o bundle do cliente. Este documento classifica as principais rotas e define prioridades de migração para Server Components (RSC) + client islands.

## Classificacao

| Tipo | Descricao |
|------|-----------|
| **A** | Fetch em `useEffect` — pode buscar dados no servidor via RSC wrapper |
| **B** | Interacao pesada — precisa ser 100% client |
| **C** | Hibrida — RSC wrapper + client island viavel |

## Paginas Principais (app)

| Rota | Arquivo | Linhas | Tipo | Notas |
|------|---------|--------|------|-------|
| `/planos` | planos/page.tsx | ~305 | **A** | Fetch `listPlanosService`, filtros simples |
| `/matriculas` | matriculas/page.tsx | ~512 | **C** | Dashboard mensal + pie chart + acoes |
| `/pagamentos` | pagamentos/page.tsx | ~1050 | **C** | 16+ estados, 3 modais, CSV import/export |
| `/clientes` | clientes/page.tsx | ~570 | **C** | Tabela paginada + wizard + modais |
| `/vendas` | vendas/page.tsx | ~375 | **C** | Filtros + tabela paginada |
| `/vendas/nova` | vendas/nova/page.tsx | ~550 | **B** | Flow completo de venda, steps interativos |
| `/prospects` | prospects/page.tsx | ~400 | **C** | Lista + modal de detalhes |
| `/dashboard` | dashboard/page.tsx | ~400 | **C** | Cards + graficos + fetch |
| `/clientes/[id]` | clientes/[id]/page.tsx | ~1400 | **B** | Detalhe com 6 tabs, muitos modais |
| `/crm/prospects-kanban` | crm/prospects-kanban/page.tsx | ~500 | **B** | Drag-and-drop kanban |

## Modais Pesados (>500 linhas)

| Componente | Linhas | Candidato lazy load |
|------------|--------|---------------------|
| `novo-cliente-wizard.tsx` | ~871 | SIM |
| `prospect-detail-modal.tsx` | ~581 | SIM |
| `treino-modal.tsx` | ~577 | SIM |
| `sale-receipt-modal.tsx` | ~418 | Nao (abaixo de 500) |
| `nova-matricula-modal.tsx` | ~379 | Nao (abaixo de 500) |

## Restricoes

- Todas as paginas `(app)` usam `useTenantContext()` que depende de contexto client-side (session/cookie).
- APIs sao chamadas via `apiRequest` que usa headers do browser (`X-Context-Id`).
- RSC wrappers precisariam de uma camada de fetch server-compatible ou passar dados iniciais como props.

## Estrategia Adotada (Task 113)

1. **Lazy load modais pesados** com `next/dynamic({ ssr: false })` — impacto imediato no bundle.
2. **Bundle analyzer** para medir First Load JS por rota.
3. RSC conversion completa das listagens fica como fase futura (requer refatoracao das APIs para funcionar server-side).
