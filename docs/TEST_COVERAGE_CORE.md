# Coverage Core

## Snapshot

- Gerado em: `2026-03-31T04:03:23.388Z`
- Perfil: `core`
- Escopo instrumentado atual: `src/lib/**/*.{ts,tsx}`
- Runtime de coleta: `V8` via `NODE_V8_COVERAGE`
- Suites consideradas:
  - Playwright unit: `199` testes em `58` arquivos
  - Playwright e2e: `89` testes em `39` arquivos
  - Smoke e2e de coverage: `8` arquivos
- Suites executadas neste snapshot: `unit, smoke`
- Baseline funcional atual do repositorio: `288` testes Playwright em `97` arquivos

## Coverage Atual

| Metrica | Coberto | Total | Percentual |
| --- | ---: | ---: | ---: |
| Lines | 3630 | 20694 | 17.54% |
| Statements | 1212 | 6298 | 19.24% |
| Functions | 403 | 2350 | 17.15% |
| Branches | 1246 | 4880 | 25.53% |

## Meta Incremental E Gates Ativos

- Meta global desta trilha: `60%`
- Gates ativos:
  - Lines: `60%`
  - Statements: `60%`
  - Functions: `60%`
  - Branches: `60%`
- Snapshot atual:
  - Lines: `17%`
  - Statements: `19%`
  - Functions: `17%`
  - Branches: `25%`
- Piso inicial por arquivo alterado: `40%` em lines
- Marcos intermediarios:
  - M1: `20%` focando infra compartilhada, src/lib/api, sessao e tenant/contexto
  - M2: `35%` focando comercial, financeiro e seguranca
  - M3: `50%` focando CRM, treinos, reservas, jornada publica e backoffice
  - M4: `60%` focando camadas core estabilizadas com cenarios de erro e borda
- Politica operacional:
  - Task 26 fecha a meta de 60% sobre o runtime core compartilhado em src/lib, onde a instrumentacao Node/V8 ja e confiavel.
  - UI e bundle client-only permanecem fora deste gate ate existir instrumentacao dedicada no navegador; o controle funcional segue pela suite smoke.
  - Task 27 promove esses thresholds a gate de merge, publica artefatos e adiciona piso inicial por arquivo alterado no core.

## Smoke E2E Configurado

- `tests/e2e/sessao-multiunidade.spec.ts`
- `tests/e2e/clientes-cadastro.spec.ts`
- `tests/e2e/comercial-fluxo.spec.ts`
- `tests/e2e/admin-financeiro-integracoes.spec.ts`
- `tests/e2e/backoffice-global.spec.ts`
- `tests/e2e/adesao-publica.spec.ts`
- `tests/e2e/treinos-template-list.spec.ts`
- `tests/e2e/treinos-v2-editor.spec.ts`

## Tendencia Recente

| Gerado Em | Perfil | Suites | Lines | Statements | Functions | Branches |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2026-03-31T04:03:23.388Z | core | unit, smoke | NaN% | NaN% | NaN% | NaN% |
| 2026-03-31T04:03:02.761Z | core | unit, smoke | NaN% | NaN% | NaN% | NaN% |
| 2026-03-14T21:34:54.596Z | core | unit | NaN% | NaN% | NaN% | NaN% |

## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| src/lib/domain | 1 | 0.00% (0/56) | 0.00% (0/20) | 0.00% (0/18) | 0.00% (0/3) |
| src/lib/export | 1 | 0.00% (0/53) | 0.00% (0/30) | 0.00% (0/11) | 0.00% (0/13) |
| src/lib/forms | 6 | 0.00% (0/144) | 0.00% (0/34) | 0.00% (0/11) | 0.00% (0/10) |
| src/lib/icons | 1 | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |
| src/lib/query | 34 | 0.00% (0/1681) | 0.00% (0/334) | 0.00% (0/403) | 0.00% (0/132) |
| src/lib/sanitize.ts | 1 | 0.00% (0/12) | 0.00% (0/1) | 0.00% (0/1) | 100.00% (0/0) |
| src/lib/shared | 20 | 0.00% (0/803) | 0.00% (0/362) | 0.00% (0/92) | 0.00% (0/198) |
| src/lib/tenant | 34 | 0.00% (0/6386) | 0.00% (0/2039) | 0.00% (0/595) | 0.00% (0/1293) |

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| src/lib/tenant/bi/analytics.ts | 0.00% (0/531) | 0.00% (0/159) | 0.00% (0/67) | 0.00% (0/88) |
| src/lib/tenant/treinos/v2-runtime.ts | 0.00% (0/469) | 0.00% (0/111) | 0.00% (0/42) | 0.00% (0/116) |
| src/lib/tenant/treinos/workspace.ts | 0.00% (0/457) | 0.00% (0/107) | 0.00% (0/46) | 0.00% (0/132) |
| src/lib/tenant/rbac/hooks.ts | 0.00% (0/421) | 0.00% (0/202) | 0.00% (0/31) | 0.00% (0/63) |
| src/lib/tenant/administrativo-colaboradores.ts | 0.00% (0/413) | 0.00% (0/154) | 0.00% (0/25) | 0.00% (0/130) |
| src/lib/tenant/financeiro/recebimentos.ts | 0.00% (0/349) | 0.00% (0/147) | 0.00% (0/25) | 0.00% (0/116) |
| src/lib/backoffice/security-governance.ts | 0.00% (0/342) | 0.00% (0/93) | 0.00% (0/47) | 0.00% (0/65) |
| src/lib/api/admin-billing.ts | 0.00% (0/327) | 0.00% (0/88) | 0.00% (0/41) | 0.00% (0/135) |
| src/lib/tenant/hooks/use-session-context.tsx | 0.00% (0/322) | 0.00% (0/120) | 0.00% (0/32) | 0.00% (0/39) |
| src/lib/api/backoffice-seguranca/_shared.ts | 0.00% (0/303) | 0.00% (0/77) | 0.00% (0/35) | 0.00% (0/187) |

## Notas Metodologicas

- A cobertura core mede o runtime compartilhado em src/lib executado em processos Node pelas suites Playwright unit e smoke E2E.
- Componentes e paginas client-only nao entram neste gate porque a baseline atual ainda nao instrumenta o bundle do navegador.
- Branch coverage e derivada de estruturas explicitas do AST TypeScript; nao replica exatamente a semantica de Istanbul.

## Exclusions Basicas

- `**/*.d.ts`
- `arquivos fora de src/lib/`
- `artefatos gerados em .next/, out/ e build/`

## Artefatos

- `coverage/summary.json`
- `coverage/summary.core.json`
- `coverage/lcov.info`
- `coverage/lcov.core.info`
- `coverage/index.html`
- `docs/TEST_COVERAGE_CORE.json`
- `docs/TEST_COVERAGE_CORE.md`
- `docs/TEST_COVERAGE_HISTORY_CORE.json`
