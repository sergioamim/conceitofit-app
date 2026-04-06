# Task ID: 483

**Title:** Configurar Cloud CDN para assets estáticos no GCP

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Configurar Cloud CDN do GCP na frente do Cloud Run para cache de assets estáticos (JS, CSS, imagens, fontes).

**Details:**

Implementar: (1) Criar Cloud Storage bucket para assets estáticos do Next.js, (2) Configurar next.config.ts assetPrefix para apontar para CDN, (3) Configurar Cloud CDN no GCP com cache de 1 ano para assets versionados (/_next/static/*), (4) Invalidação automática no deploy via CDN invalidation, (5) Headers de cache corret: immutable para assets versionados, no-cache para HTML. Atualizar Dockerfile para copiar assets para GCS no build.

**Test Strategy:**

Teste: assets são servidos via CDN com headers corret. Lighthouse coleta com CDN ativa e verifica performance score. Teste de invalidação após deploy.
