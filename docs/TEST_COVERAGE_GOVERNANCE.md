# Politica De Coverage E Gates

## Escopo Ativo

- O gate obrigatorio das tasks 26 e 27 mede o runtime compartilhado em `src/lib/**/*.{ts,tsx}` no perfil `core`.
- O racional tecnico permanece o mesmo: a baseline atual usa `NODE_V8_COVERAGE` em processos Node, entao `src/app` e `src/components` client-only ainda nao recebem instrumentacao confiavel no bundle do navegador.
- O comportamento de UI continua protegido pela suite smoke E2E e por suites focadas fora do gate percentual.
- O perfil `full` continua publicado como baseline informacional do repositorio inteiro, sem bloquear merge.

## Thresholds

- Gate global obrigatorio:
  - Lines: `60%`
  - Statements: `60%`
  - Functions: `60%`
  - Branches: `60%`
- Gate inicial por arquivo alterado dentro de `src/lib`:
  - Lines: `40%`
- O gate por arquivo alterado existe para impedir que regressao local seja escondida pelo agregado historico.
- Os scripts padrao `coverage:report`, `coverage:baseline` e `coverage:gate` operam no perfil `core`.
- O perfil `full` usa `coverage:report:full` e `coverage:baseline:full` apenas para acompanhamento historico.

## Smoke Pack Obrigatorio

- Autenticacao/contexto: `tests/e2e/sessao-multiunidade.spec.ts`
- Comercial vendas: `tests/e2e/comercial-fluxo.spec.ts`
- Financeiro: `tests/e2e/admin-financeiro-integracoes.spec.ts`
- Backoffice: `tests/e2e/backoffice-global.spec.ts`
- Jornada publica: `tests/e2e/adesao-publica.spec.ts`
- Treinos: `tests/e2e/treinos-template-list.spec.ts`
- Treinos editor: `tests/e2e/treinos-v2-editor.spec.ts`
- Financeiro operacional: `tests/e2e/financeiro-admin.spec.ts`
- Reservas: `tests/e2e/reservas-aulas.spec.ts`
- CRM: `tests/e2e/crm-operacional.spec.ts`
- RBAC: `tests/e2e/rbac.spec.ts`
- BI operacional: `tests/e2e/bi-operacional.spec.ts`

## Governanca Do Lote

- O smoke pack de coverage deve permanecer hermetico: mocks completos, dados deterministas e sem dependencia de backend externo.
- Suites que ainda dependem de health check real, dados nao deterministas ou infraestrutura externa ficam fora do lote de coverage ate estabilizacao.
- Quando uma suite sair temporariamente do smoke pack, a documentacao precisa ser atualizada no mesmo change set do script.
- O perfil `core` segue sendo a referencia de gate para merge; o perfil `full` serve para acompanhar tendencia global e mapear gaps fora de `src/lib`.

## Comandos Locais

- Baseline core completo: `npm run coverage:baseline`
- Baseline full historico: `npm run coverage:baseline:full`
- Report apenas com suites ja coletadas: `npm run coverage:report`
- Report full apenas com suites ja coletadas: `npm run coverage:report:full`
- Gate local: `npm run coverage:gate`
- Ambiente restrito sem bind de porta:
  - `npm run coverage:unit`
  - `npm run coverage:report -- --suites=unit`
  - Esse modo serve para evolucao local do core, mas nao substitui o smoke E2E no CI.
- Se o smoke pack estiver instavel localmente por fatores externos ao change set, o minimo aceitavel para evolucao dirigida e:
  - manter `coverage:unit` verde
  - regenerar `coverage:report` com suites disponiveis
  - registrar a limitacao na documentacao ou no resumo do change set

## Artefatos Publicados

- `coverage/summary.json`
- `coverage/summary.core.json`
- `coverage/lcov.info`
- `coverage/lcov.core.info`
- `coverage/index.html`
- `coverage/index.core.html`
- `docs/TEST_COVERAGE_CORE.json`
- `docs/TEST_COVERAGE_CORE.md`
- `docs/TEST_COVERAGE_HISTORY_CORE.json`

## Excecoes E Manutencao

- Se um arquivo core alterado ficar abaixo de `40%`, a expectativa e adicionar teste no mesmo change set.
- Excecao temporaria so deve ser aceita quando a mudanca for puramente estrutural e o follow-up de testes estiver explicitamente rastreado.
- Quando o bundle client-side passar a ser instrumentado com confiabilidade, o proximo passo e criar um segundo gate dedicado para `src/app` e `src/components`, sem relaxar o gate core.
- O historico do perfil `core` deve manter apenas snapshots numericos validos para evitar linhas `NaN` nos relatórios publicados.
