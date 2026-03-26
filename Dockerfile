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

# Variáveis de build (se necessário)
# ENV NEXT_PUBLIC_API_URL=https://sua-api.com

RUN npm run build

# Etapa 3: Runner (Produção)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# A porta padrão do Cloud Run é 8080, mas o Next.js costuma usar 3000.
# O script de inicialização do standalone respeita a variável PORT.
ENV PORT=8080
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

EXPOSE 8080

# O standalone server do Next.js é iniciado via node server.js
CMD ["node", "server.js"]
