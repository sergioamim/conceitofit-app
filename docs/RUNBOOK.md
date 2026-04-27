# Runbook de Operacao e Incidentes

Guia para verificar saude do frontend na VPS, investigar problemas, fazer
rollback e escalar incidentes.

## 1. Verificar saude

### URLs publicas

```bash
curl -sk -I https://app.conceito.fit/login
curl -sk -I https://api.conceito.fit/actuator/health
curl -sk -I https://grafana.conceito.fit/api/health
```

Esperado:

- frontend: `HTTP 200`
- backend: `HTTP 200`
- Grafana: `HTTP 200`
- header `x-deploy-color` na API indicando o slot ativo

### Containers na VPS

```bash
ssh conceito-fit
cd /opt/conceito-fit
docker compose -f docker-compose.prod.yml --env-file .env.prod ps
```

Containers principais:

- `conceito-frontend`
- `conceito-backend-blue` ou `conceito-backend-green`
- `conceito-caddy`
- `conceito-db`
- `conceito-minio`
- `conceito-grafana`
- `conceito-prometheus`
- `conceito-loki`
- `conceito-tempo`

### Blue/green do backend

```bash
cd ../academia-java
./deploy/deploy-bluegreen.sh conceito-fit status
```

O frontend fala com o backend pelo alias Docker interno `backend`. Os scripts de
deploy do backend mantem esse alias apontando para o slot ativo.

## 2. Investigar erros

### Logs do frontend

```bash
ssh conceito-fit
cd /opt/conceito-fit
docker compose -f docker-compose.prod.yml --env-file .env.prod logs -f --tail=100 frontend
```

### Logs do backend

```bash
ssh conceito-fit
docker logs conceito-backend-green --tail=100
docker logs conceito-backend-blue --tail=100
```

Use o slot indicado por `ACTIVE_COLOR` ou pelo header `x-deploy-color`.

### Health interno do frontend

```bash
ssh conceito-fit
docker exec conceito-frontend wget -qO- http://127.0.0.1:3000/api/health
```

### Diagnostico no browser do usuario

1. Abra DevTools > Console e procure erros JavaScript.
2. Abra DevTools > Network e procure requests `4xx`, `5xx` ou timeout.
3. Verifique se o banner "Servidor indisponivel" esta visivel.
4. Confira cookies/tokens de sessao e o tenant/contexto ativo.

## 3. Deploy

O deploy da VPS e orquestrado a partir do repo backend, porque la ficam o
compose de producao, Caddyfile, scripts blue/green e observabilidade.

Fluxo backend:

```bash
cd ../academia-java
./deploy/deploy-bluegreen.sh conceito-fit <tag>
```

Fluxo frontend:

1. Publicar a imagem `ghcr.io/sergioamim/conceito-frontend:<tag>`.
2. Atualizar `FRONTEND_TAG=<tag>` em `/opt/conceito-fit/.env.prod`.
3. Recriar o servico `frontend`.

```bash
ssh conceito-fit
cd /opt/conceito-fit
docker compose -f docker-compose.prod.yml --env-file .env.prod pull frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps --force-recreate frontend
docker exec conceito-caddy caddy reload --config /etc/caddy/Caddyfile
```

## 4. Rollback

### Backend

```bash
cd ../academia-java
./deploy/deploy-bluegreen.sh conceito-fit latest --rollback
```

### Frontend

Volte `FRONTEND_TAG` para a tag anterior e recrie o container:

```bash
ssh conceito-fit
cd /opt/conceito-fit
sed -i 's|^FRONTEND_TAG=.*|FRONTEND_TAG=<tag-anterior>|' .env.prod
docker compose -f docker-compose.prod.yml --env-file .env.prod pull frontend
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --no-deps --force-recreate frontend
```

## 5. Banco e storage

### PostgreSQL

```bash
ssh conceito-fit
docker exec conceito-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;"
```

Se estiver dentro de `/opt/conceito-fit`, carregue os valores de `.env.prod`:

```bash
set -a
. ./.env.prod
set +a
docker exec conceito-db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT pg_size_pretty(pg_database_size('$POSTGRES_DB'));"
```

### MinIO

```bash
ssh conceito-fit
docker logs conceito-minio --tail=100
```

## 6. Observabilidade

- Grafana: `https://grafana.conceito.fit`
- Backend health: `https://api.conceito.fit/actuator/health`
- Frontend health: `https://app.conceito.fit/api/health`
- Logs agregados: consultar Loki/Grafana quando disponivel
- Erros frontend: consultar Sentry se `NEXT_PUBLIC_SENTRY_DSN` estiver configurado

## 7. Checklist pre-deploy

- [ ] `npm test`
- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Smoke de frontend em `https://app.conceito.fit/login`
- [ ] Smoke de backend em `https://api.conceito.fit/actuator/health`
