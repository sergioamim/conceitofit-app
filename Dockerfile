# Etapa 1: Instalação de dependências
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package.json package-lock.json* ./
RUN npm ci

# Etapa 2: Build da aplicação
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build injetadas via docker-compose args
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

# BACKEND_PROXY_TARGET e obrigatorio pelo env.ts no build-time
# O valor correto e o alias estavel "backend"; o deploy aponta esse alias
# para o slot ativo via rede compat e evita rebuild por switch blue/green.
ARG BACKEND_PROXY_TARGET="http://backend:8080"
ENV BACKEND_PROXY_TARGET=${BACKEND_PROXY_TARGET}

RUN npm run build

# Etapa 3: Runner (Produção)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# A VPS usa porta 3000 para o container do frontend no compose de producao.
# O script de inicialização do standalone respeita a variável PORT.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Otimização do Next.js standalone
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# Usa 127.0.0.1 (IPv4) em vez de localhost para evitar resolucao IPv6 ([::1])
# que falha com "Connection refused" porque Next.js standalone bind apenas IPv4.
# Porta 3000 alinhada com PORT env var padrao do Next.js.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

# O standalone server do Next.js é iniciado via node server.js
CMD ["node", "server.js"]
