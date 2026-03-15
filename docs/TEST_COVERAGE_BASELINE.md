# Test Coverage Baseline

## Snapshot

- Gerado em: `2026-03-14T21:17:50.296Z`
- Escopo instrumentado atual: `src/**/*.{ts,tsx}`
- Runtime de coleta: `V8` via `NODE_V8_COVERAGE`
- Suites consideradas:
  - Playwright unit: `87` testes em `26` arquivos
  - Playwright e2e: `29` testes em `19` arquivos
  - Smoke e2e de coverage: `5` arquivos
- Baseline funcional atual do repositorio: `116` testes Playwright em `45` arquivos

## Coverage Atual

| Metrica | Coberto | Total | Percentual |
| --- | ---: | ---: | ---: |
| Lines | 5184 | 54337 | 9.54% |
| Statements | 1713 | 12717 | 13.47% |
| Functions | 595 | 5071 | 11.73% |
| Branches | 1545 | 9340 | 16.54% |

## Meta Incremental E Gates Iniciais

- Meta global desta trilha: `60%`
- Gates iniciais do baseline:
  - Lines: `9%`
  - Statements: `13%`
  - Functions: `11%`
  - Branches: `16%`
- Marcos intermediarios:
  - M1: `20%` focando infra compartilhada, src/lib/api, sessao e tenant/contexto
  - M2: `35%` focando comercial, financeiro e seguranca
  - M3: `50%` focando CRM, treinos, reservas, jornada publica e backoffice
  - M4: `60%` focando fechamento da meta global com cenarios de erro e borda
- Politica inicial:
  - Os gates iniciais ficam definidos sobre o baseline instrumentado atual para impedir regressao bruta antes da task 26.
  - A automacao de CI e bloqueio de merge ficam para a task 27; nesta fase o gate e documental e executavel via coverage:baseline.

## Smoke E2E Usado Na Baseline

- `tests/e2e/clientes-cadastro.spec.ts`
- `tests/e2e/comercial-fluxo.spec.ts`
- `tests/e2e/admin-financeiro-integracoes.spec.ts`
- `tests/e2e/treinos-template-list.spec.ts`
- `tests/e2e/treinos-v2-editor.spec.ts`

## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| src/app | 100 | 0.00% (0/30453) | 0.00% (0/7098) | 0.00% (0/2656) | 0.00% (0/4965) |
| src/components | 69 | 0.00% (0/12754) | 0.00% (0/2203) | 0.00% (0/1267) | 0.00% (0/1787) |
| src/debug | 2 | 0.00% (0/270) | 0.00% (0/54) | 0.00% (0/25) | 0.00% (0/53) |
| src/hooks | 1 | 0.00% (0/250) | 0.00% (0/106) | 0.00% (0/33) | 0.00% (0/23) |
| src/instrumentation.ts | 1 | 0.00% (0/34) | 0.00% (0/18) | 0.00% (0/3) | 0.00% (0/8) |
| src/lib/icons | 1 | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |
| src/lib/tenant-context.ts | 1 | 0.00% (0/151) | 0.00% (0/80) | 0.00% (0/33) | 0.00% (0/51) |
| src/lib/utils.ts | 1 | 0.00% (0/43) | 0.00% (0/22) | 0.00% (0/5) | 0.00% (0/9) |

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| src/app/(backoffice)/admin/importacao-evo-p0/page.tsx | 0.00% (0/3060) | 0.00% (0/956) | 0.00% (0/282) | 0.00% (0/645) |
| src/components/treinos/treino-v2-editor.tsx | 0.00% (0/1892) | 0.00% (0/272) | 0.00% (0/259) | 0.00% (0/295) |
| src/app/(app)/gerencial/contas-a-pagar/page.tsx | 0.00% (0/1753) | 0.00% (0/196) | 0.00% (0/166) | 0.00% (0/222) |
| src/app/(app)/pagamentos/page.tsx | 0.00% (0/894) | 0.00% (0/302) | 0.00% (0/66) | 0.00% (0/167) |
| src/app/(app)/vendas/nova/page.tsx | 0.00% (0/889) | 0.00% (0/395) | 0.00% (0/110) | 0.00% (0/177) |
| src/app/(app)/treinos/page.tsx | 0.00% (0/883) | 0.00% (0/176) | 0.00% (0/74) | 0.00% (0/166) |
| src/app/(backoffice)/admin/unidades/page.tsx | 0.00% (0/835) | 0.00% (0/202) | 0.00% (0/89) | 0.00% (0/177) |
| src/app/(app)/crm/playbooks/page.tsx | 0.00% (0/769) | 0.00% (0/82) | 0.00% (0/86) | 0.00% (0/87) |
| src/app/(app)/seguranca/rbac/page.tsx | 0.00% (0/733) | 0.00% (0/113) | 0.00% (0/63) | 0.00% (0/90) |
| src/app/(app)/reservas/page.tsx | 0.00% (0/692) | 0.00% (0/167) | 0.00% (0/55) | 0.00% (0/145) |

## Notas Metodologicas

- A cobertura atual mede arquivos do src executados em processos Node durante as suites Playwright unit e smoke E2E.
- A trilha smoke E2E cobre cadastro de clientes, comercial, admin financeiro e treinos V2.
- Branch coverage e derivada de estruturas explicitas do AST TypeScript; nao replica exatamente a semantica de Istanbul.
- Client code executado exclusivamente no bundle do navegador ainda nao possui instrumentacao dedicada nesta baseline.

## Exclusions Basicas

- `**/*.d.ts`
- `arquivos fora de src/`
- `artefatos gerados em .next/, out/ e build/`

## Artefatos

- `coverage/summary.json`
- `coverage/lcov.info`
- `coverage/index.html`
- `docs/TEST_COVERAGE_BASELINE.json`
