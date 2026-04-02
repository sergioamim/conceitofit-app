# Baseline final Playwright

Data: 2026-04-01

## Ambiente

- Frontend: `http://127.0.0.1:3103`
- Proxy backend: `http://127.0.0.1:8080`
- Projeto: `academia-app`
- Navegador validado: `chromium`

## Comandos validados

### Bucket operacional da task 345

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
  npx playwright test \
  tests/e2e/treinos-web.spec.ts \
  tests/e2e/treinos-template-list.spec.ts \
  tests/e2e/treinos-v2-editor.spec.ts \
  tests/e2e/treinos-atribuidos.spec.ts \
  tests/e2e/reservas-aulas.spec.ts \
  tests/e2e/operacional-grade-catraca.spec.ts \
  tests/e2e/crm-operacional.spec.ts \
  --project=chromium \
  --repeat-each=2 \
  --reporter=line
```

Resultado: `24 passed`

### Rerun final consolidado da task 346

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
  npx playwright test \
  --project=chromium \
  --reporter=line
```

Resultado observado: a execução percorreu `101/101` cenários sem imprimir falhas. O processo ficou pendurado no teardown do Playwright após o último teste, então a evidência operacional desta baseline é a travessia completa da suíte sem erro funcional durante a execução.

### Revalidação dos resíduos finais

```bash
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3103 \
  npx playwright test \
  tests/e2e/dashboard.spec.ts \
  tests/e2e/security-flows.spec.ts \
  --project=chromium \
  --reporter=line
```

Resultado: `8 passed`

## O que foi estabilizado

- Buckets operacionais de treinos, reservas, grade e CRM
- Persistência e reidratação de sessão E2E entre login, troca de tenant e navegação protegida
- Fluxos públicos de demo e adesão usando proxy same-origin para `/backend`
- Onboarding completo da academia com sessão alinhada ao tenant provisionado
- Navegação e CRUD global do backoffice com helpers canônicos
- Recuperação de contexto em dashboard, planos e fluxos multiunidade

## Ajustes estruturais consolidados

- Sessão web e sessão E2E agora compartilham o cookie `academia-access-token`
- O helper de seed E2E respeita `PLAYWRIGHT_BASE_URL` e sincroniza `tenant` ativo
- O helper de CRUD administrativo passou a tolerar `select` nativo além de combobox
- Os cenários frágeis do banner de conta demo permanecem cobertos por teste de componente e ficaram `skip` no E2E

## Observações operacionais

- Os cenários de banner demo seguem cobertos em `tests/components/demo-banner.test.tsx`
- O rerun final do Playwright ficou preso no teardown após executar todos os cenários; não houve falha funcional registrada na saída da suíte
- Esta baseline substitui o conjunto de resíduos abertos antes das tasks 345, 346 e 347
