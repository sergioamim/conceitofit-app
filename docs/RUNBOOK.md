# Runbook de Operacao e Incidentes

Guia para verificar saude do sistema, investigar problemas, fazer rollback e escalar incidentes.

---

## 1. Verificar saude do sistema

### Frontend (Next.js — Cloud Run)

```bash
# Health check basico (deve retornar 200)
curl -s -o /dev/null -w "%{http_code}" https://<FRONTEND_URL>/

# Verificar revisao ativa no Cloud Run
gcloud run services describe academia-frontend \
  --region=southamerica-east1 \
  --format="value(status.traffic)"
```

### Backend (Spring Boot)

```bash
# Liveness — processo vivo e aceitando requests
curl -s http://localhost:8080/actuator/health/liveness
# Esperado: {"status":"UP"}

# Readiness — dependencias prontas (DB, etc)
curl -s http://localhost:8080/actuator/health/readiness

# Health completo — mostra status de cada componente
curl -s http://localhost:8080/actuator/health | jq .
```

**Nota:** O frontend usa `/backend/actuator/health/liveness` para o banner de status. Se retornar != 200, o banner "Servidor indisponivel" aparece.

### Banco de dados

```bash
# Verificar conexao do PostgreSQL
psql -h localhost -U user_academia -d academia_db -c "SELECT 1;"

# Verificar tamanho do banco
psql -h localhost -U user_academia -d academia_db -c "SELECT pg_size_pretty(pg_database_size('academia_db'));"
```

### Monitoring

- **Sentry:** https://sentry.io — buscar erros recentes por projeto `academia-frontend`
- **Sentry DSN:** configurado via `NEXT_PUBLIC_SENTRY_DSN` no ambiente
- **Tunnel route:** erros sao enviados via `/monitoring` (contorna bloqueio de adblock)

---

## 2. Investigar erros

### No Sentry

1. Acessar o projeto no Sentry
2. Filtrar por **"Unresolved"** e ordenar por **"Last Seen"**
3. Cada erro mostra:
   - Stack trace completo
   - Request ID (`X-Request-Id` no header)
   - Tenant ID e User ID (via `SentryContextSync`)
   - Browser/OS do usuario
4. Para correlacionar com o backend, buscar o `X-Request-Id` nos logs do backend

### No browser do usuario

1. Abrir DevTools > Console — erros de JS
2. DevTools > Network — requests falhando (4xx, 5xx, timeout)
3. Verificar se o banner "Servidor indisponivel" esta visivel
4. Verificar localStorage:
   - `academia-auth-token` — existe? Expirado?
   - `academia-auth-active-tenant-id` — correto?

### No Cloud Run (logs do frontend)

```bash
gcloud run services logs read academia-frontend \
  --region=southamerica-east1 \
  --limit=50
```

### No backend (logs do Spring)

```bash
# Se rodando localmente
tail -f ~/dev/pessoal/academia-java/modulo-app/target/*.log

# Se rodando via docker-compose
docker compose logs -f backend --tail=100
```

---

## 3. Deploy e rollback

### Deploy automatico

O deploy acontece automaticamente via GitHub Actions ao fazer push/merge na `main`:

1. Build Docker image
2. Push para Artifact Registry
3. Deploy no Cloud Run com `--no-traffic`
4. Health check (10 tentativas, 5s intervalo)
5. Se OK: roteia 100% do trafego para nova revisao
6. Se falhar: revisao anterior mantem o trafego

**Workflow:** `.github/workflows/deploy-cloud-run.yml`

### Rollback manual

Se uma revisao ruim passou pelo health check:

```bash
# Listar revisoes recentes
gcloud run revisions list \
  --service=academia-frontend \
  --region=southamerica-east1 \
  --limit=5

# Rotear trafego para revisao anterior
gcloud run services update-traffic academia-frontend \
  --region=southamerica-east1 \
  --to-revisions=<REVISAO_ANTERIOR>=100

# Verificar que o rollback funcionou
curl -s -o /dev/null -w "%{http_code}" https://<FRONTEND_URL>/
```

### Rollback via git

Se precisar reverter o codigo:

```bash
# Identificar o commit problematico
git log --oneline -10

# Reverter o merge
git revert -m 1 <COMMIT_HASH_DO_MERGE>

# Push (dispara deploy automatico com o revert)
git push origin main
```

---

## 4. Problemas comuns

### "Servidor indisponivel" no banner

**Causa:** Health check em `/backend/actuator/health/liveness` retornando != 200.

1. Verificar se o backend esta rodando: `curl http://localhost:8080/actuator/health/liveness`
2. Se 503 com componente DOWN: verificar qual componente falhou no `/actuator/health` completo
3. Se connection refused: backend nao esta rodando, verificar logs

### Tela branca / app nao carrega

1. Verificar console do browser por erros de JS
2. Verificar se a build do Next.js esta OK: `npm run build`
3. Verificar se variaveis de ambiente estao configuradas (`NEXT_PUBLIC_API_BASE_URL`)

### Login nao funciona

1. Verificar se o backend responde em `POST /api/v1/auth/login`
2. Verificar se o proxy reverso esta configurado (`/backend/*` -> `localhost:8080`)
3. Limpar localStorage do browser e tentar novamente

### Dados de tenant incorretos

1. Verificar `X-Context-Id` nos headers das requests (DevTools > Network)
2. Verificar `academia-auth-active-tenant-id` no localStorage
3. Se necessario, limpar o contexto:
   ```
   localStorage.removeItem("academia-api-context-id");
   localStorage.removeItem("academia-auth-active-tenant-id");
   ```
4. Recarregar a pagina

### Erro de CORS

1. Verificar que o backend aceita a origem do frontend
2. Em dev: frontend roda em `localhost:3000`, backend em `localhost:8080`
3. O proxy reverso (`/backend/*`) evita CORS — requests nao devem ir direto ao backend

---

## 5. Infraestrutura

### Stack de producao

| Componente | Servico | Porta |
|---|---|---|
| Frontend | Cloud Run (Node 22 Alpine) | 8080 |
| Backend | Spring Boot (Java) | 8080 |
| Banco de dados | PostgreSQL 16 | 5432 |
| Object Storage | MinIO (S3-compatible) | 9000/9001 |
| Monitoring | Sentry | — |

### Stack local (docker-compose)

```bash
# Stack completa
docker compose up --build

# Apenas frontend (backend rodando separado)
docker compose up frontend

# Com monitoring (Prometheus + Grafana)
docker compose --profile monitoring up
```

### Variaveis de ambiente criticas

| Variavel | Onde | Descricao |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Build-time | URL do backend (vazio em prod = usa proxy) |
| `NEXT_PUBLIC_SENTRY_DSN` | Runtime | DSN do Sentry para error tracking |
| `BACKEND_PROXY_TARGET` | Runtime | Target do proxy reverso (default: `http://localhost:8080`) |

### CI/CD Pipelines

| Workflow | Trigger | Funcao |
|---|---|---|
| `deploy-cloud-run.yml` | Push em main | Build + deploy + health check + traffic routing |
| `coverage-core.yml` | PR | Roda testes e valida cobertura |
| `e2e-headless.yml` | PR | Roda testes E2E Playwright |
| `lighthouse.yml` | PR | Auditoria de performance |
| `staging-deploy.yml` | Push em staging | Deploy para ambiente staging |
| `production-deploy.yml` | Manual/tag | Deploy para producao |

---

## 6. Contatos e escalacao

| Papel | Contato | Quando escalar |
|---|---|---|
| Engenheiro principal | (definir) | Qualquer incidente em producao |
| Infra/DevOps | (definir) | Problemas de Cloud Run, DNS, certificados |
| Backend | (definir) | Erros 500 persistentes, problemas de banco |

### Severidades

| Nivel | Descricao | Tempo de resposta |
|---|---|---|
| **P0 — Critico** | Sistema completamente fora do ar | Imediato |
| **P1 — Alto** | Feature core quebrada (login, vendas, pagamentos) | < 1 hora |
| **P2 — Medio** | Feature secundaria quebrada, workaround disponivel | < 4 horas |
| **P3 — Baixo** | Bug visual, inconveniencia menor | Proximo sprint |

---

## 7. Checklist pre-deploy

- [ ] Testes unitarios passando (`npm test`)
- [ ] Testes E2E passando (`npm run e2e`)
- [ ] Build sem erros (`npm run build`)
- [ ] TypeScript sem erros novos (`npx tsc --noEmit`)
- [ ] Lighthouse score aceitavel (`npm run lighthouse`)
- [ ] PR revisada e aprovada
- [ ] Changelog/commit message claro
