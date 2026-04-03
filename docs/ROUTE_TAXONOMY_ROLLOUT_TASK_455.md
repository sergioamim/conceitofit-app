# Task 455 — Rollout e rollback da nova taxonomia de rotas

## Objetivo

Registrar o checklist operacional da reorganização de rotas concluída nas tasks `449` a `454`, com foco em verificação rápida, rollback e separação entre superfícies públicas, portal operacional e backoffice.

## Fontes de verdade usadas

- `src/app/(public)/page.tsx`
- `src/app/login/page.tsx`
- `src/app/(public)/acesso/[redeSlug]/*`
- `src/app/app/[networkSubdomain]/*`
- `src/app/(portal)/layout.tsx`
- `src/app/(backoffice)/admin/layout.tsx`
- `src/app/(public)/storefront/*`
- `src/app/(public)/storefront-not-found/page.tsx`
- `src/proxy.ts`
- `src/app/status/page.tsx`
- `src/app/monitor/boas-vindas/page.tsx`
- `src/app/global-error.tsx`
- `next.config.ts`
- `tests/e2e/route-taxonomy-smoke.spec.ts`

## Superfícies canônicas após o rollout

| Superfície | URL canônica | Papel |
| --- | --- | --- |
| Landing institucional | `/` | entrada pública SaaS; redireciona para `/dashboard` apenas com sessão ativa |
| Comercial B2B | `/b2b`, `/b2b/demo` | aquisição institucional e demo |
| Jornada pública | `/adesao/*` | trial, cadastro, checkout e pendências |
| Auth por rede | `/acesso/[redeSlug]/*` | autenticação contextual, primeiro acesso e recuperação |
| Login resolvedor | `/login` | fallback legado e resolução por rede no host/query |
| Portal operacional | `/dashboard` e demais rotas do grupo `(portal)` | operação autenticada por unidade/rede |
| Backoffice global | `/admin/*` | administração SaaS global |
| Storefront | `/storefront/*` e subdomínios válidos | descoberta pública por slug ou rewrite de subdomínio |
| Storefront inválida | `/storefront-not-found` | fallback público para subdomínio desconhecido |

## Matriz de smoke da taxonomia

| Cenário | Evidência automatizada |
| --- | --- |
| `/` público carrega landing | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/` com sessão ativa redireciona para `/dashboard` | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/b2b` continua pública | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/adesao` continua pública e usa mocks herméticos | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/login` sem rede mostra fluxo legado | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/login?redeIdentifier=...` mostra auth por rede | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/admin` continua no shell global | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| `/storefront/[academiaSlug]` continua funcional | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| subdomínio válido reescreve para storefront | `tests/e2e/route-taxonomy-smoke.spec.ts` |
| subdomínio inválido cai em `/storefront-not-found` | `tests/e2e/route-taxonomy-smoke.spec.ts` |

## Monitoramento e logs por superfície

### Fatos observados

- `/status` é uma página pública de health em `src/app/status/page.tsx`.
- `/monitor/boas-vindas` é uma superfície operacional voltada ao monitor/catraca em `src/app/monitor/boas-vindas/page.tsx`.
- `src/app/global-error.tsx` usa Sentry quando disponível, sem segmentação explícita por superfície no arquivo atual.
- `next.config.ts` define `tunnelRoute: "/monitoring"` quando `NEXT_PUBLIC_SENTRY_DSN` está configurado.

### Inferência operacional

- A separação por superfície hoje existe por rota e por shell.
- Não há evidência de tagging automática de analytics/logs que diferencie tráfego público, portal e backoffice no código atual.
- Se essa segmentação virar requisito forte, ela precisa entrar como tarefa própria em `src/app/layout.tsx`, `src/app/global-error.tsx` e na camada de analytics compartilhada.

## Checklist de rollout

1. Validar build global do frontend.
2. Rodar a spec `tests/e2e/route-taxonomy-smoke.spec.ts`.
3. Confirmar manualmente, se necessário, que `/`, `/b2b`, `/adesao`, `/login`, `/dashboard`, `/admin` e `/storefront` respondem na URL final esperada.
4. Confirmar subdomínio válido e subdomínio inválido do storefront.
5. Revisar redirecionamentos legados:
   - `/app/[networkSubdomain]/* -> /acesso/[redeSlug]/*`
   - `/storefront/adesao/* -> /adesao/*`
6. Confirmar que `/status` continua pública e que `/monitor/boas-vindas` permanece fora da trilha institucional.

## Checklist de rollback

1. Reverter os commits das tasks `449` a `454` em ordem inversa se a falha estiver na taxonomia, não apenas na documentação/testes.
2. Se o problema estiver só em links/documentação, reverter apenas a task `455`.
3. Revalidar:
   - `/login`
   - `/dashboard`
   - `/admin`
   - `/storefront`
   - subdomínio válido/inválido
4. Se o rollback tocar auth por rede, revalidar também `/acesso/[redeSlug]/*` e `/app/[networkSubdomain]/*`.

## Lacunas conhecidas

- A task não adiciona segmentação nova de analytics por superfície; apenas registra o estado atual.
- A validação de rewrite por subdomínio no smoke usa backend mock local controlado pelo teste, não backend real.
- `docs/TEST_COVERAGE_GOVERNANCE.md` continua sem incluir esta spec no smoke pack obrigatório de coverage; ela foi criada como smoke funcional dedicado da taxonomia.
