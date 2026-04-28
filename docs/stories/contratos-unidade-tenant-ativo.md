# Story: Contratos da Unidade no Tenant Ativo

## Status

Done

## Contexto

A tela operacional de contratos da unidade e o caso comum do produto e deve usar apenas o `tenant/contexto ativo`.

A visao multi-tenant fica fora desta entrega e deve seguir fluxo separado, com permissao de `Acesso Global`, leitura cross-tenant explicita e auditoria propria.

## Acceptance Criteria

1. A rota [`src/app/(portal)/contratos/page.tsx`](../../src/app/(portal)/contratos/page.tsx) continua tenant-scoped e nao introduce filtros ou agregacoes multi-tenant no estado padrao.
2. A UI deixa explicito que o escopo da tela e a unidade ativa.
3. A tela de contratos ganha uma apresentacao alinhada ao design handoff da visao single-tenant, com cabecalho mais forte, KPIs, distribuicao da carteira e tabela operacional melhor organizada.
4. A implementacao usa apenas contratos e dados realmente disponiveis hoje no frontend/backend operacional; nao inventa serie ou agregacao cross-tenant sem contrato canonico.
5. Se o usuario tiver acesso ampliado, a UI pode sinalizar que a visao global e um fluxo separado, sem misturar escopos nem liberar acoes cross-tenant nesta tela.

## Repo Dono

- `academia-app`

## Repo Consumidor / Fonte de Verdade Revisada

- `academia-java`

## Riscos

- Misturar tenant ativo com comportamento multi-tenant na mesma tela.
- Inventar agregacoes de agregadores sem endpoint operacional canonico.
- Regressao visual na tabela e nas acoes de renovar/cancelar.

## Validacao Planejada

- `npm run lint`
- `npm run typecheck`

## Validacao Executada

- `npm run typecheck` OK
- `npm run lint` OK sem erros
- Avisos globais do repositorio permanecem; no arquivo alterado ficou apenas warning estrutural de `max-lines`

## Follow-up

- Abrir story separada para `Visao Global de Contratos` com `Acesso Global`, leitura cross-tenant somente leitura, auditoria e UX de escopo explicita.

## File List

- `src/app/(portal)/contratos/components/contratos-client.tsx`
- `docs/stories/contratos-unidade-tenant-ativo.md`
