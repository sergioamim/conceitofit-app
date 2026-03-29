# Task ID: 243

**Title:** Configurar PWA (manifest + service worker)

**Status:** pending

**Dependencies:** 239

**Priority:** low

**Description:** Criar manifest.json, service worker para cache offline básico, prompt de instalação.

**Details:**

Criar public/manifest.json com name, short_name, icons (192/512), theme_color, background_color, display: standalone. Configurar next-pwa ou serwist para service worker. Cache: shell + assets estáticos. Prompt "Adicionar à tela inicial" em mobile. Ícone da academia via tenant theme.

**Test Strategy:**

App instalável no mobile. Funciona offline com shell cacheado. Lighthouse PWA score > 80.
