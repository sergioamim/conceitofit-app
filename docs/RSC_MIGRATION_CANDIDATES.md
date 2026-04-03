# Auditoria RSC — Páginas "use client"

Auditoria realizada em 29/03/2026. Total de páginas com `"use client"`: **77**.

## Classificação

| Classe | Descrição | Qtd |
|--------|-----------|-----|
| **A** | 100% Server — remover `"use client"` imediatamente | 7 |
| **B** | Hybrid — RSC com client island para interatividade mínima | 7 |
| **C** | Precisa client — hooks, estado, eventos complexos | 63 |

---

## Classe A — Remover "use client" (7 páginas)

Nenhum hook React, nenhum event handler, nenhum contexto. A diretiva `"use client"` é desnecessária.

| Página | Linhas | Justificativa |
|--------|--------|---------------|
| `(aluno)/meus-pagamentos/page.tsx` | 20 | Apenas renderiza componente, sem hooks |
| `(aluno)/meus-treinos/page.tsx` | 20 | Idem |
| `(aluno)/minhas-aulas/page.tsx` | 20 | Idem |
| `(portal)/gerencial/contabilidade/page.tsx` | 76 | Layout estático com links |
| `(portal)/gerencial/contas-a-pagar/page.tsx` | 33 | Shell com Suspense |
| `(backoffice)/admin/importacao-evo-p0/page.tsx` | 89 | Shell RSC que importa hook como client island |
| `(backoffice)/admin/unidades/page.tsx` | 48 | Shell com Suspense |

---

## Classe B — Candidatas a Hybrid RSC (7 páginas)

Usam apenas 1-2 event handlers simples ou navigation hooks. Podem ser RSC com client island extraído.

| Página | Linhas | Hooks | Eventos | Migração sugerida |
|--------|--------|-------|---------|-------------------|
| `(portal)/seguranca/rbac/page.tsx` | 162 | 0 | 1 | Extrair tab selector para client island |
| `(portal)/vendas/nova/page.tsx` | 77 | 0 | 1 | Extrair form wrapper para client island |
| `(backoffice)/admin/seguranca/usuarios/[id]/page.tsx` | 201 | 0 | 3 | Extrair tabs para client island |
| `(backoffice)/admin/seguranca/usuarios/page.tsx` | 87 | 0 | 2 | Extrair filtros para client island |
| `storefront/adesao/cadastro/page.tsx` | 45 | 0 Nav:2 | 0 | Mover useSearchParams para client wrapper |
| `storefront/adesao/checkout/page.tsx` | 32 | 0 Nav:2 | 0 | Idem |
| `storefront/adesao/trial/page.tsx` | 32 | 0 Nav:2 | 0 | Idem |

---

## Classe C — Precisa de client (63 páginas)

Usam hooks de estado, efeitos, event handlers complexos. Migração não recomendada sem refatoração significativa.

### Top 15 maiores (candidatas futuras para decomposição):

| Página | Linhas | useState | useEffect | Eventos |
|--------|--------|----------|-----------|---------|
| `(backoffice)/admin/seguranca/catalogo/page.tsx` | 986 | 28 | 4 | 31 |
| `(portal)/crm/playbooks/page.tsx` | 873 | 11 | 2 | 27 |
| `(portal)/reservas/page.tsx` | 811 | 17 | 5 | 12 |
| `(portal)/gerencial/catraca-acessos/page.tsx` | 773 | 25 | 3 | 8 |
| `(backoffice)/admin/financeiro/cobrancas/page.tsx` | 755 | 19 | 4 | 10 |
| `(portal)/prospects/[id]/converter/page.tsx` | 722 | 12 | 3 | 32 |
| `(backoffice)/admin/financeiro/contratos/page.tsx` | 707 | 21 | 3 | 10 |
| `(backoffice)/admin/seguranca/perfis/page.tsx` | 700 | 20 | 3 | 12 |
| `(backoffice)/admin/seguranca/funcionalidades/page.tsx` | 703 | 19 | 3 | 6 |
| `(backoffice)/admin/compliance/page.tsx` | 668 | 9 | 2 | 5 |
| `(portal)/seguranca/acesso-unidade/page.tsx` | 616 | 10 | 5 | 8 |
| `(portal)/conta/aulas/page.tsx` | 335 | 5 | 2 | 5 |
| `(portal)/crm/tarefas/page.tsx` | 567 | 12 | 2 | 10 |
| `(backoffice)/admin/configuracoes/page.tsx` | 605 | 8 | 2 | 9 |
| `(portal)/gerencial/recebimentos/page.tsx` | 506 | 14 | 2 | 12 |

---

## Ação imediata

1. **Remover `"use client"` das 7 páginas Classe A** — sem risco, ganho imediato de SSR
2. **Classe B**: avaliar caso a caso em futuras sprints
3. **Classe C**: manter como client, decompor as maiores (>700 LOC) quando precisar manutenção
