# Task 453: Renomear o route group (app) para (portal) sem alterar URLs operacionais

## Status: pending
## Priority: medium
## Dependencies: 452

## Description
Mover a area operacional da academia para um route group `(portal)`, preservando caminhos finais, shell e guardas de sessao.

## Details
Migrar `src/app/(app)/*` para `src/app/(portal)/*`, mantendo o layout, a shell operacional, os guards de autenticacao e os contextos de sessao. Revisar referencias em documentacao, testes, scripts e comentarios que citam o route group antigo. Confirmar que o rename nao conflita mais com a rota legada `/app/*` apos a canonicalizacao do acesso por rede.

## Test Strategy
Smoke manual: abrir `/dashboard`, `/vendas`, `/crm`, `/administrativo` e `/conta` apos o rename e confirmar que as URLs finais nao mudaram.
