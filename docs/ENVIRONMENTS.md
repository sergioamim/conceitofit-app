# Ambientes de Deploy

## Visao Geral

O projeto utiliza dois ambientes no Vercel, controlados via GitHub Actions:

| Ambiente   | Branch/Trigger          | URL                         | Approval |
|-----------|------------------------|-----------------------------|----------|
| Staging   | Push na `main`         | Preview URL (Vercel)        | Nao      |
| Production| Manual dispatch ou tag | URL de producao (Vercel)    | Sim      |

## Variaveis de Ambiente

As variaveis sao configuradas no dashboard da Vercel com escopos separados:

| Variavel                  | Preview (Staging)              | Production                    |
|--------------------------|-------------------------------|-------------------------------|
| `NEXT_PUBLIC_APP_ENV`    | `staging`                     | `production`                  |
| `NEXT_PUBLIC_API_URL`    | URL do backend staging        | URL do backend producao       |
| `DATABASE_URL`           | String conexao DB staging     | String conexao DB producao    |
| `BACKEND_PROXY_TARGET`   | URL backend staging           | URL backend producao          |

## GitHub Secrets Necessarios

Configurar no repositorio GitHub (Settings > Secrets and variables > Actions):

- `VERCEL_TOKEN` — Token de acesso da Vercel (Account Settings > Tokens)
- `VERCEL_ORG_ID` — ID da organizacao Vercel (Project Settings > General)
- `VERCEL_PROJECT_ID` — ID do projeto Vercel (Project Settings > General)

## Fluxo de Deploy

```
Push main -> GitHub Actions (staging-deploy.yml)
                 |
                 v
         Vercel Preview Deploy (staging)
                 |
                 v
        Validacao manual em staging
                 |
                 v
  workflow_dispatch ou tag v* -> GitHub Actions (production-deploy.yml)
                 |
                 v
        Aprovacao manual (environment: production)
                 |
                 v
         Vercel Production Deploy
```

## Como fazer deploy em producao

1. Valide as mudancas no ambiente de staging
2. Va em Actions > "Deploy Production" > "Run workflow" e selecione a branch `main`
   - OU crie uma tag: `git tag v1.0.0 && git push origin v1.0.0`
3. Aprove o deploy no GitHub Actions quando solicitado
