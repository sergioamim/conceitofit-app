# Consolidação das correções de frontend Playwright em 2026-04-02

## Objetivo

Registrar, de forma curta e auditável, quais frentes de frontend já ficaram revalidadas no Playwright após a rodada de correções desta trilha.

## Buckets revalidados verdes

Rerun executado na task 357:

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3106 \
PLAYWRIGHT_WEB_SERVER_COMMAND='node -e "setInterval(() => {}, 1 << 30)"' \
  npx playwright test \
    tests/e2e/app-multiunidade-contrato.spec.ts \
    tests/e2e/sessao-multiunidade.spec.ts \
    tests/e2e/auth-rede.spec.ts \
    tests/e2e/onboarding-fluxo-completo.spec.ts \
    tests/e2e/comercial-fluxo.spec.ts \
    tests/e2e/backoffice-seguranca.spec.ts \
    tests/e2e/bi-operacional.spec.ts \
    --project=chromium --reporter=line
```

Resultado:

- `17 passed (21.8s)`

## Leitura por frente

### Multiunidade e sessão

- `tests/e2e/app-multiunidade-contrato.spec.ts`
- `tests/e2e/sessao-multiunidade.spec.ts`

Status:

- verde
- sem regressão visível de troca de unidade, deep link, recuperação de sessão ou bloqueio contratual

### Auth por rede

- `tests/e2e/auth-rede.spec.ts`

Status:

- verde
- sem retorno do loop de guard nem quebra no fluxo de primeiro acesso contextualizado por rede

### Onboarding e backoffice global

- `tests/e2e/onboarding-fluxo-completo.spec.ts`
- `tests/e2e/backoffice-seguranca.spec.ts`
- `tests/e2e/bi-operacional.spec.ts`

Status:

- verde
- shell global, segurança e visão operacional seguem navegáveis no runtime atual

### Comercial frontend

- `tests/e2e/comercial-fluxo.spec.ts`

Status:

- verde
- a seleção de plano materializa itens no carrinho e reabilita a finalização da venda no fluxo mockado

## Resíduo que não ficou no frontend

Rerun com backend real:

```bash
PLAYWRIGHT_REAL_BACKEND=1 \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3106 \
PLAYWRIGHT_WEB_SERVER_COMMAND='node -e "setInterval(() => {}, 1 << 30)"' \
  npx playwright test tests/e2e/comercial-smoke-real.spec.ts \
    --project=chromium --workers=1 --reporter=line
```

Resultado:

- falha reproduzível no pós-conversão
- erro: `Conversao concluida, mas aluno/matricula/pagamento nao ficaram legiveis...`

Classificação:

- resíduo real de backend
- fora do escopo de correção do frontend nesta rodada

## Conclusão

O frontend ficou revalidado nos buckets mais críticos desta trilha. O ponto que ainda impede uma leitura de “tudo concluído” não está mais no shell web nem nos contratos mockados do Playwright; ele permanece no backend real do fluxo comercial após a conversão do prospect.
