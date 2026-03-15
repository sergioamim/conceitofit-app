# Coverage Core

## Snapshot

- Gerado em: `2026-03-14T21:34:54.596Z`
- Perfil: `core`
- Escopo instrumentado atual: `src/lib/**/*.{ts,tsx}`
- Runtime de coleta: `V8` via `NODE_V8_COVERAGE`
- Suites consideradas:
  - Playwright unit: `101` testes em `33` arquivos
  - Playwright e2e: `29` testes em `19` arquivos
  - Smoke e2e de coverage: `8` arquivos
- Suites executadas neste snapshot: `unit`
- Baseline funcional atual do repositorio: `130` testes Playwright em `52` arquivos

## Coverage Atual

| Metrica | Coberto | Total | Percentual |
| --- | ---: | ---: | ---: |
| Lines | 6635 | 10576 | 62.74% |
| Statements | 2193 | 3238 | 67.73% |
| Functions | 751 | 1087 | 69.09% |
| Branches | 1991 | 2504 | 79.51% |

## Meta Incremental E Gates Ativos

- Meta global desta trilha: `60%`
- Gates ativos:
  - Lines: `60%`
  - Statements: `60%`
  - Functions: `60%`
  - Branches: `60%`
- Snapshot atual:
  - Lines: `62%`
  - Statements: `67%`
  - Functions: `69%`
  - Branches: `79%`
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
| 2026-03-14T21:34:54.596Z | core | unit | NaN% | NaN% | NaN% | NaN% |

## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| src/lib/icons | 1 | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |
| src/lib/rbac | 2 | 11.42% (62/543) | 15.64% (38/243) | 18.03% (11/61) | 15.79% (12/76) |
| src/lib/tenant-theme.ts | 1 | 20.24% (17/84) | 60.00% (6/10) | 100.00% (3/3) | 83.33% (5/6) |
| src/lib/public | 3 | 27.41% (162/591) | 38.68% (82/212) | 44.12% (30/68) | 28.70% (33/115) |
| src/lib/aulas | 1 | 42.72% (44/103) | 67.50% (27/40) | 69.23% (9/13) | 55.56% (5/9) |
| src/lib/planos | 1 | 45.36% (44/97) | 56.25% (9/16) | 75.00% (6/8) | 46.15% (18/39) |
| src/lib/backoffice | 4 | 49.83% (148/297) | 47.00% (47/100) | 56.10% (23/41) | 44.44% (24/54) |
| src/lib/business-date.ts | 1 | 57.14% (32/56) | 59.09% (13/22) | 90.91% (10/11) | 0.00% (0/1) |

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| src/lib/rbac/hooks.ts | 0.00% (0/387) | 0.00% (0/191) | 0.00% (0/30) | 0.00% (0/58) |
| src/lib/api/cartoes.ts | 0.00% (0/112) | 0.00% (0/32) | 0.00% (0/13) | 0.00% (0/26) |
| src/lib/public/use-public-journey.ts | 0.00% (0/80) | 0.00% (0/32) | 0.00% (0/10) | 0.00% (0/17) |
| src/lib/api/beneficios.ts | 0.00% (0/77) | 0.00% (0/16) | 0.00% (0/14) | 0.00% (0/4) |
| src/lib/api/conciliacao-bancaria.ts | 0.00% (0/71) | 0.00% (0/9) | 0.00% (0/5) | 0.00% (0/4) |
| src/lib/treinos/v2-backlog.ts | 0.00% (0/62) | 0.00% (0/1) | 100.00% (0/0) | 100.00% (0/0) |
| src/lib/api/contas-bancarias.ts | 0.00% (0/57) | 0.00% (0/9) | 0.00% (0/5) | 0.00% (0/3) |
| src/lib/api/maquininhas.ts | 0.00% (0/52) | 0.00% (0/9) | 0.00% (0/5) | 0.00% (0/1) |
| src/lib/api/dashboard.ts | 0.00% (0/45) | 0.00% (0/16) | 0.00% (0/5) | 0.00% (0/12) |
| src/lib/icons/activity-icons.ts | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |

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
