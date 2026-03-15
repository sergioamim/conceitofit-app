# Politica De Coverage Core

## Escopo Ativo

- O gate das tasks 26 e 27 mede o runtime compartilhado em `src/lib/**/*.{ts,tsx}`.
- O racional e tecnico: a baseline atual usa `NODE_V8_COVERAGE` em processos Node, entao `src/app` e `src/components` client-only ainda nao recebem instrumentacao confiavel no bundle do navegador.
- O comportamento de UI continua protegido pela suite smoke E2E, nao pelo percentual core.

## Thresholds

- Gate global obrigatorio:
  - Lines: `60%`
  - Statements: `60%`
  - Functions: `60%`
  - Branches: `60%`
- Gate inicial por arquivo alterado dentro de `src/lib`:
  - Lines: `40%`
- O gate por arquivo alterado existe para impedir que regressao local seja escondida pelo agregado historico.

## Smoke Pack Obrigatorio

- Autenticacao/contexto: `tests/e2e/sessao-multiunidade.spec.ts`
- Comercial: `tests/e2e/clientes-cadastro.spec.ts`
- Comercial vendas: `tests/e2e/comercial-fluxo.spec.ts`
- Financeiro: `tests/e2e/admin-financeiro-integracoes.spec.ts`
- Backoffice: `tests/e2e/backoffice-global.spec.ts`
- Jornada publica: `tests/e2e/adesao-publica.spec.ts`
- Treinos: `tests/e2e/treinos-template-list.spec.ts`
- Treinos editor: `tests/e2e/treinos-v2-editor.spec.ts`

## Comandos Locais

- Baseline core completo: `npm run coverage:baseline`
- Baseline full historico: `npm run coverage:baseline:full`
- Report apenas com suites ja coletadas: `npm run coverage:report`
- Gate local: `npm run coverage:gate`
- Ambiente restrito sem bind de porta:
  - `npm run coverage:unit`
  - `npm run coverage:report -- --suites=unit`
  - Esse modo serve para evolucao local do core, mas nao substitui o smoke E2E no CI.

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
