# Coverage Baseline

## Snapshot

- Gerado em: `2026-03-31T17:08:19.260Z`
- Perfil: `full`
- Escopo instrumentado atual: `src/**/*.{ts,tsx}`
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
| Lines | 10503 | 87182 | 12.05% |
| Statements | 3456 | 19588 | 17.64% |
| Functions | 1178 | 7801 | 15.10% |
| Branches | 3358 | 15775 | 21.29% |

## Baseline Informacional E Meta

- Meta global desta trilha: `60%`
- Este perfil acompanha o repositorio inteiro e continua informacional.
- O gate obrigatorio de 60% fica no perfil `core`, usado pelos scripts padrao de `coverage:*` para merge.
- Gates ativos:
  - Lines: `9%`
  - Statements: `13%`
  - Functions: `11%`
  - Branches: `16%`
- Snapshot atual:
  - Lines: `12%`
  - Statements: `17%`
  - Functions: `15%`
  - Branches: `21%`
- Piso inicial por arquivo alterado: `0%` em lines
- Marcos intermediarios:
  - M1: `20%` focando infra compartilhada, src/lib/api, sessao e tenant/contexto
  - M2: `35%` focando comercial, financeiro e seguranca
  - M3: `50%` focando CRM, treinos, reservas, jornada publica e backoffice
  - M4: `60%` focando fechamento da meta global com cenarios de erro e borda
- Politica operacional:
  - O perfil full continua como baseline informacional do repositorio inteiro e nao substitui o gate obrigatorio do perfil core.
  - A meta de 60% fica formalmente aplicada ao perfil core em src/lib, onde a instrumentacao Node/V8 e confiavel para gate de merge.
  - Os thresholds do full permanecem como piso documental para acompanhar tendencia global sem bloquear areas ainda nao instrumentadas no bundle cliente.

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

## Grupos Prioritarios

| Grupo | Arquivos | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: | ---: |
| src/debug | 2 | 0.00% (0/270) | 0.00% (0/54) | 0.00% (0/25) | 0.00% (0/53) |
| src/hooks | 7 | 0.00% (0/364) | 0.00% (0/238) | 0.00% (0/48) | 0.00% (0/66) |
| src/instrumentation.ts | 1 | 0.00% (0/51) | 0.00% (0/25) | 0.00% (0/4) | 0.00% (0/13) |
| src/lib/export | 1 | 0.00% (0/53) | 0.00% (0/30) | 0.00% (0/11) | 0.00% (0/13) |
| src/lib/icons | 1 | 0.00% (0/38) | 0.00% (0/14) | 0.00% (0/3) | 0.00% (0/3) |
| src/lib/sanitize.ts | 1 | 0.00% (0/12) | 0.00% (0/1) | 0.00% (0/1) | 100.00% (0/0) |
| src/proxy.ts | 1 | 0.00% (0/108) | 0.00% (0/66) | 0.00% (0/5) | 0.00% (0/29) |
| src/app | 269 | 0.04% (21/47123) | 0.25% (24/9507) | 0.08% (3/3823) | 0.10% (8/7714) |

## Top Gaps Por Arquivo

| Arquivo | Lines | Statements | Functions | Branches |
| --- | ---: | ---: | ---: | ---: |
| src/app/(backoffice)/admin/importacao-evo-p0/hooks/useEvoImportPage.ts | 0.00% (0/2348) | 0.00% (0/1053) | 0.00% (0/263) | 0.00% (0/604) |
| src/app/(app)/pagamentos/components/pagamentos-client.tsx | 0.00% (0/927) | 0.00% (0/309) | 0.00% (0/65) | 0.00% (0/176) |
| src/app/(backoffice)/admin/seguranca/catalogo/page.tsx | 0.00% (0/873) | 0.00% (0/148) | 0.00% (0/94) | 0.00% (0/96) |
| src/components/treinos/treino-v2-editor.tsx | 0.00% (0/830) | 0.00% (0/205) | 0.00% (0/119) | 0.00% (0/148) |
| src/components/administrativo/funcionarios/funcionario-form-page.tsx | 0.00% (0/802) | 0.00% (0/111) | 0.00% (0/69) | 0.00% (0/127) |
| src/app/(backoffice)/admin/importacao-evo-p0/components/EvoPacoteTab.tsx | 0.00% (0/776) | 0.00% (0/29) | 0.00% (0/41) | 0.00% (0/147) |
| src/app/(app)/clientes/[id]/use-cliente-workspace.ts | 0.00% (0/746) | 0.00% (0/356) | 0.00% (0/75) | 0.00% (0/130) |
| src/app/(app)/reservas/page.tsx | 0.00% (0/729) | 0.00% (0/168) | 0.00% (0/55) | 0.00% (0/162) |
| src/app/(app)/crm/playbooks/page.tsx | 0.00% (0/707) | 0.00% (0/49) | 0.00% (0/82) | 0.00% (0/77) |
| src/app/(backoffice)/admin/seguranca/usuarios/[id]/user-detail-tabs.tsx | 0.00% (0/696) | 0.00% (0/22) | 0.00% (0/47) | 0.00% (0/125) |

## Notas Metodologicas

- A cobertura atual mede arquivos do src executados em processos Node durante as suites Playwright unit e smoke E2E.
- A trilha smoke E2E cobre fluxos hermeticos de autenticacao/contexto, comercial, admin financeiro, backoffice, adesao publica e treinos V2.
- Suites que ainda dependem de backend externo, health checks reais ou dados nao deterministas ficam fora deste lote de coverage e seguem validadas separadamente.
- Branch coverage e derivada de estruturas explicitas do AST TypeScript; nao replica exatamente a semantica de Istanbul.
- Client code executado exclusivamente no bundle do navegador ainda nao possui instrumentacao dedicada nesta baseline.

## Exclusions Basicas

- `**/*.d.ts`
- `arquivos fora de src/`
- `artefatos gerados em .next/, out/ e build/`

## Artefatos

- `coverage/summary.json`
- `coverage/summary.full.json`
- `coverage/lcov.info`
- `coverage/lcov.full.info`
- `coverage/index.html`
- `docs/TEST_COVERAGE_BASELINE.json`
- `docs/TEST_COVERAGE_BASELINE.md`

