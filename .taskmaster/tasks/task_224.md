# Task ID: 224

**Title:** Adicionar HEALTHCHECK no Dockerfile e endpoint /api/health

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Criar rota /api/health que retorna 200 com timestamp e versão. Adicionar HEALTHCHECK no Dockerfile.

**Details:**

Criar src/app/api/health/route.ts como Route Handler que retorna { status: "ok", timestamp, version: process.env.npm_package_version }. Adicionar HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8080/api/health || exit 1 no Dockerfile. Configurar Cloud Run startup probe.

**Test Strategy:**

GET /api/health retorna 200. Cloud Run só roteia tráfego após health check.
