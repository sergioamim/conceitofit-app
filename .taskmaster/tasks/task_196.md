# Task ID: 196

**Title:** Migrar storefront para endpoints com academiaSlug no path

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** O backend tem 9 endpoints em /publico/storefront/{academiaSlug}/* que o frontend não usa. Frontend usa paths sem slug.

**Details:**

Backend oferece: GET /publico/storefront/{slug} (dados gerais), GET /{slug}/atividades, /{slug}/planos, /{slug}/seo, /{slug}/sitemap, /{slug}/theme, /{slug}/unidades/{id}, /{slug}/unidades/{id}/horarios-disponiveis, POST /{slug}/experimental. Atualizar src/lib/public/server-services.ts e o middleware (proxy.ts) para usar esses endpoints com o slug resolvido. Atualizar src/app/storefront/ pages para consumir. Pode eliminar necessidade de X-Context-Id header nos requests públicos.

**Test Strategy:**

Storefront renderiza com dados do backend. Planos, unidades, horários e tema carregam via slug.
