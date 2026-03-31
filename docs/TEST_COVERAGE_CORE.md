# Coverage Core

## Snapshot

- Gerado em: `2026-03-31T17:08:18.764Z`
- Perfil: `core`
- Escopo instrumentado atual: `src/lib/**/*.{ts,tsx}`
- Runtime de coleta: `V8` via `NODE_V8_COVERAGE`
- Suites consideradas:
  - Playwright unit: `222` testes em `64` arquivos
  - Playwright e2e: `94` testes em `40` arquivos
  - Smoke e2e de coverage: `12` arquivos
- Suites executadas neste snapshot: `unit, smoke`
- Baseline funcional atual do repositorio: `316` testes Playwright em `104` arquivos

## Coverage Atual

| Metrica | Coberto | Total | Percentual |
| --- | ---: | ---: | ---: |
| Lines | 10210 | 20773 | 49.15% |
| Statements | 3417 | 6330 | 53.98% |
| Functions | 1162 | 2361 | 49.22% |
| Branches | 3218 | 4909 | 65.55% |

## Meta Incremental E Gates Ativos

- Meta global desta trilha: `60%`
- Este perfil `core` e o gate obrigatorio da trilha.
- Os scripts padrao de `coverage:report`, `coverage:baseline` e `coverage:gate` operam neste perfil.
- Gates ativos:
  - Lines: `60%`
  - Statements: `60%`
  - Functions: `60%`
  - Branches: `60%`
- Snapshot atual:
  - Lines: `49%`
  - Statements: `53%`
  - Functions: `49%`
  - Branches: `65%`
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
  - Os scripts padrao de report, baseline e gate operam no perfil core; o perfil full segue como baseline informacional do repositorio.

## Smoke E2E Configurado

- `tests/e2e/sessao-multiunidade.spec.ts`
- `tests/e2e/comercial-fluxo.spec.ts`
- `tests/e2e/admin-financeiro-integracoes.spec.ts`
- `tests/e2e/backoffice-global.spec.ts`
- `tests/e2e/adesao-publica.spec.ts`
- `tests/e2e/treinos-template-list.spec.ts`
- `tests/e2e/treinos-v2-editor.spec.ts`
- `tests/e2e/financeiro-admin.spec.ts`
- `tests/e2e/reservas-aulas.spec.ts`
- `tests/e2e/crm-operacional.spec.ts`
- `tests/e2e/rbac.spec.ts`
- `tests/e2e/bi-operacional.spec.ts`

## Tendencia Recente

| Gerado Em | Perfil | Suites | Lines | Statements | Functions | Branches |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| 2026-03-31T17:08:18.764Z | core | unit, smoke | 49.15% | 53.98% | 49.22% | 65.55% |
| 2026-03-31T17:04:43.910Z | core | unit, smoke | 49.15% | 53.98% | 49.22% | 65.55% |

## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| src/lib/export | 1 | 0.00% (0/53) | 0.00% (0/30) | 0.00% (0/11) | 0.00% (0/13) |
| src/lib/icons | 1 | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |
| src/lib/sanitize.ts | 1 | 0.00% (0/12) | 0.00% (0/1) | 0.00% (0/1) | 100.00% (0/0) |
| src/lib/query | 34 | 1.67% (28/1681) | 2.40% (8/334) | 1.74% (7/403) | 1.52% (2/132) |
| src/lib/domain | 1 | 7.14% (4/56) | 10.00% (2/20) | 5.56% (1/18) | 33.33% (1/3) |
| src/lib/public | 10 | 15.58% (165/1059) | 21.69% (72/332) | 25.41% (31/122) | 11.43% (28/245) |
| src/lib/forms | 6 | 15.97% (23/144) | 35.29% (12/34) | 54.55% (6/11) | 60.00% (6/10) |
| src/lib/shared | 20 | 43.84% (352/803) | 51.38% (186/362) | 64.13% (59/92) | 51.52% (102/198) |

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| src/lib/api/admin-billing.ts | 0.00% (0/327) | 0.00% (0/88) | 0.00% (0/41) | 0.00% (0/135) |
| src/lib/tenant/hooks/use-session-context.tsx | 0.00% (0/322) | 0.00% (0/120) | 0.00% (0/32) | 0.00% (0/39) |
| src/lib/tenant/hooks/use-commercial-flow.ts | 0.00% (0/288) | 0.00% (0/145) | 0.00% (0/39) | 0.00% (0/49) |
| src/lib/public/server-services.ts | 0.00% (0/208) | 0.00% (0/44) | 0.00% (0/28) | 0.00% (0/80) |
| src/lib/api/financial.ts | 0.00% (0/189) | 0.00% (0/48) | 0.00% (0/30) | 0.00% (0/25) |
| src/lib/api/admin-seguranca-avancada.ts | 0.00% (0/162) | 0.00% (0/50) | 0.00% (0/20) | 0.00% (0/45) |
| src/lib/query/admin/use-admin-financeiro.ts | 0.00% (0/159) | 0.00% (0/45) | 0.00% (0/47) | 0.00% (0/2) |
| src/lib/query/use-prospects.ts | 0.00% (0/144) | 0.00% (0/43) | 0.00% (0/29) | 0.00% (0/17) |
| src/lib/api/billing.ts | 0.00% (0/142) | 0.00% (0/54) | 0.00% (0/17) | 0.00% (0/34) |
| src/lib/query/use-treinos.ts | 0.00% (0/125) | 0.00% (0/29) | 0.00% (0/29) | 0.00% (0/12) |

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
