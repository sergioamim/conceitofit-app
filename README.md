# Conceito Fit Frontend

[![Cobertura de testes](https://github.com/sergioamim/conceitofit-app/actions/workflows/unit-coverage.yml/badge.svg)](https://github.com/sergioamim/conceitofit-app/actions/workflows/unit-coverage.yml)

Aplicação Next.js (App Router) para operação de academias multiunidade.

## Requisitos

- Node.js 20+
- npm 10+
- Backend Java disponível

## Modos de execução

### 1) Desenvolvimento com API real local

```bash
npm run dev:api
```

Isso ativa o proxy local `/backend/* -> http://localhost:8080/*`.

### 2) Produção local (build otimizado)

```bash
npm run prod:local
```

## Rodar DEV e PROD juntos no mesmo PC

Objetivo:
- `PROD` em `:3000`
- `DEV` em `:3001`

Terminais:
1. Produção local:
```bash
npm run prod:local
```
2. Desenvolvimento (API real):
```bash
npm run dev:3001:api
```

## Domínios locais sem porta na URL (`local.prod` e `local.dev`)

### 1) Mapear hosts
Adicione no `/etc/hosts`:

```txt
127.0.0.1 local.prod
127.0.0.1 local.dev
```

### 2) Rodar proxy local por hostname
Arquivo pronto:
- `/Users/sergioamim/dev/pessoal/academia-app/infra/local-domains/Caddyfile`

Com Caddy instalado:
```bash
caddy run --config ./infra/local-domains/Caddyfile
```

URLs finais:
- [http://local.prod](http://local.prod) -> porta `3000`
- [http://local.dev](http://local.dev) -> porta `3001`

## Variáveis de ambiente

Crie um `.env.local` baseado em `.env.example`.

Chaves principais:
- `NEXT_PUBLIC_API_BASE_URL`: base da API (quando não usar proxy `/backend`)
- `BACKEND_PROXY_TARGET`: alvo do rewrite de `/backend/*`
- `NEXT_PUBLIC_DEV_AUTO_LOGIN`: auto login em dev
- `NEXT_PUBLIC_DEV_AUTH_EMAIL`
- `NEXT_PUBLIC_DEV_AUTH_PASSWORD`

## Preview (Cloudflare)

Objetivo: publicar versão instável em `preview.conceito.fit`.

Configuração recomendada:
1. Build command: `npm run build:preview`
2. Start command: `npm run start`
3. Environment variables:
   - `BACKEND_PROXY_TARGET=https://SEU_BACKEND_PREVIEW`
   - `NEXT_PUBLIC_API_BASE_URL` (opcional, manter vazio se usar proxy `/backend`)

## Observações técnicas

- O frontend opera com backend real por padrão.
- O contexto de unidade ativa continua obrigatório e é propagado por header `X-Context-Id` quando aplicável.
