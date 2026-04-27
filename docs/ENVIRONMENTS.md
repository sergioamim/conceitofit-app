# Ambientes de Deploy

## Visao Geral

O unico ambiente operacional em uso hoje e a VPS do Conceito Fit.

| Ambiente | Runtime | URL | Deploy |
| --- | --- | --- | --- |
| Sandbox/Prod | Docker Compose na VPS | `https://app.conceito.fit` | GHCR + SSH + `docker compose` |

Os fluxos antigos de Vercel e Cloud Run foram removidos do repositorio. Nao
configure `VERCEL_*` ou `GCP_*` para deploy deste app.

## Como a VPS roda o frontend

O frontend roda como container Docker no compose de producao mantido no repo
backend:

- `academia-java/deploy/docker-compose.prod.yml`
- servico `frontend`
- imagem `ghcr.io/sergioamim/conceito-frontend:${FRONTEND_TAG}`

O backend ativo e exposto para o frontend pelo alias Docker `backend`, mantido
pelos scripts de deploy do backend para respeitar o blue/green.

## Variaveis principais

| Variavel | Onde vive | Uso |
| --- | --- | --- |
| `FRONTEND_TAG` | `/opt/conceito-fit/.env.prod` na VPS | Tag da imagem do frontend |
| `NEXT_PUBLIC_API_BASE_URL` | `/opt/conceito-fit/.env.prod` na VPS | URL publica da API |
| `BACKEND_PROXY_TARGET` | compose de producao | Alias interno do backend ativo |
| `NEXT_PUBLIC_SENTRY_DSN` | `/opt/conceito-fit/.env.prod` na VPS | Sentry do frontend, opcional |

## Deploy

O deploy da stack VPS deve ser orquestrado pelo pipeline/scripts do backend,
porque o compose de producao, Caddy e blue/green ficam em `academia-java`.

Fluxo esperado:

```bash
cd ../academia-java
./deploy/deploy-bluegreen.sh conceito-fit status
```

Para atualizar somente o frontend, publique a imagem
`ghcr.io/sergioamim/conceito-frontend:<tag>`, atualize `FRONTEND_TAG` na VPS e
recrie o servico `frontend` pelo compose de producao.
