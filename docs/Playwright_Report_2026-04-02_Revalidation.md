# Revalidação do relatório Playwright de 2026-04-02

## Escopo

Task 348: revalidar o relatório manual de 2026-04-02, separar falhas obsoletas de falhas reais e consolidar uma baseline objetiva dos resíduos ainda reproduzíveis.

Dependências já concluídas consideradas nesta revalidação:

- Task 324: fluxo comercial smoke com backend real
- Task 333: jornada pública de adesão estabilizada no runtime atual

## Limitação do insumo original

O repositório não contém um artefato versionado do relatório de 2026-04-02 nem evidências persistidas para o host `localhost:9323`.

Na prática, `localhost:9323` indica o servidor HTML do `playwright show-report`, então referências a esse host, sem artefato reproduzível junto do repositório, foram tratadas como insumo operacional e não como defeito do produto por si só.

## Comandos executados

### Jornada pública de adesão

```bash
PLAYWRIGHT_WEB_SERVER_COMMAND='BACKEND_PROXY_TARGET=http://localhost:8080 npm run dev:mock' \
  npx playwright test tests/e2e/adesao-publica.spec.ts --project=chromium --workers=1 --reporter=line
```

Primeiro resultado observado:

- falha ambiental por `EADDRINUSE` na porta `3000`

Rerun controlado:

```bash
rm -f .next/dev/lock
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3104 \
PLAYWRIGHT_WEB_SERVER_COMMAND='BACKEND_PROXY_TARGET=http://localhost:8080 next dev --webpack -p 3104 -H 127.0.0.1' \
  npx playwright test tests/e2e/adesao-publica.spec.ts --project=chromium --workers=1 --reporter=line
```

Segundo resultado observado:

- o ruído de porta/lock foi eliminado
- a execução passou a falhar antes do fluxo E2E por erro real de build em `src/lib/api/session.ts`

### Fluxo comercial mockado

```bash
PLAYWRIGHT_WEB_SERVER_COMMAND='BACKEND_PROXY_TARGET=http://localhost:8080 npm run dev:mock' \
  npx playwright test tests/e2e/comercial-fluxo.spec.ts --project=chromium --workers=1 --reporter=line
```

Resultado observado:

- falha reproduzível de build em `src/lib/api/session.ts`

### Fluxo comercial com backend real

```bash
PLAYWRIGHT_REAL_BACKEND=1 \
  npx playwright test tests/e2e/comercial-smoke-real.spec.ts --project=chromium --workers=1 --reporter=line
```

Resultado observado:

- login e conversão do prospect avançam
- a execução falha no pós-conversão porque os artefatos esperados não ficam legíveis de forma consistente

## Classificação consolidada

| Item revalidado | Resultado atual | Classificação | Evidência |
| --- | --- | --- | --- |
| Referências ao host `localhost:9323` | Não há artefato versionado no repositório para reabrir esse relatório; o host aponta para servidor local do Playwright report | Obsoleto/operacional | Sem evidência persistida no repo; revalidação passou a depender de rerun local |
| `tests/e2e/adesao-publica.spec.ts` | O primeiro erro foi ambiental (`EADDRINUSE`), mas o rerun isolado removeu esse ruído e expôs falha real de build | Resíduo real | `Module parse failed: Identifier 'ACCESS_TOKEN_COOKIE_KEY' has already been declared (25:6)` em `src/lib/api/session.ts` |
| `tests/e2e/comercial-fluxo.spec.ts` | Falha antes de executar a jornada por erro de compilação do app | Resíduo real | Mesmo erro de build em `src/lib/api/session.ts` |
| `tests/e2e/comercial-smoke-real.spec.ts` | A conversão é aceita, mas os dados de aluno/matrícula/pagamento não ficam legíveis após o backend concluir a operação | Resíduo real | `Error: Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis para 100.671.838-91.` em `tests/e2e/comercial-smoke-real.spec.ts:341` |

## Evidências textuais relevantes

### Resíduo real 1: build quebrado em `src/lib/api/session.ts`

Trecho reproduzido nos reruns de `adesao-publica.spec.ts` e `comercial-fluxo.spec.ts`:

```text
Module parse failed: Identifier 'ACCESS_TOKEN_COOKIE_KEY' has already been declared (25:6)
Import trace for requested module:
./src/lib/api/session.ts
./src/lib/api/http.ts
./src/lib/shared/utils/api-error.ts
./src/lib/utils/api-error.ts
./src/components/shared/error-state.tsx
./src/app/error.tsx
```

Diagnóstico objetivo:

- existe dupla declaração de `ACCESS_TOKEN_COOKIE_KEY` em `src/lib/api/session.ts`
- enquanto esse erro existir, os specs que inicializam o app web não conseguem revalidar o comportamento funcional

### Resíduo real 2: fluxo comercial real não estabilizado no pós-conversão

Trecho reproduzido no rerun de `tests/e2e/comercial-smoke-real.spec.ts`:

```text
Error: Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis para 100.671.838-91.
```

Diagnóstico objetivo:

- o backend aceita a conversão do prospect
- a leitura consistente dos artefatos gerados pela conversão ainda não está estável para o smoke real

## Baseline residual após a revalidação

Situação final desta task:

1. Não encontrei evidência versionada suficiente para tratar `localhost:9323` como bug de produto; isso ficou classificado como referência operacional obsoleta do relatório antigo.
2. O principal bloqueador atual do pack web é um erro real de compilação em `src/lib/api/session.ts`.
3. Mesmo ignorando esse bloqueador do frontend, o smoke real do comercial ainda conserva um resíduo funcional no pós-conversão.

## Próximos passos sugeridos

1. Corrigir a dupla declaração de `ACCESS_TOKEN_COOKIE_KEY` em `src/lib/api/session.ts`.
2. Reexecutar `tests/e2e/adesao-publica.spec.ts` e `tests/e2e/comercial-fluxo.spec.ts` após o build voltar a compilar.
3. Investigar o pós-conversão do `tests/e2e/comercial-smoke-real.spec.ts`, focando na disponibilidade/legibilidade de aluno, matrícula e pagamento após a resposta de sucesso do backend.
