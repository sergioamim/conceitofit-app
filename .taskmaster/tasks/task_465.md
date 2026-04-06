# Task ID: 465

**Title:** Portal do aluno: PWA (manifest, service worker, install prompt)

**Status:** pending

**Dependencies:** 461, 462, 463, 464

**Priority:** medium

**Description:** Configurar PWA para o portal do aluno com manifest.json, service worker para cache offline e prompt de instalação.

**Details:**

Implementar: (1) manifest.json com nome, ícones, theme por academia (whitelabel), (2) Service worker com cache de rotas do aluno (check-in, treinos, aulas), (3) Install prompt usando componente existente em src/components/pwa/install-prompt.tsx, (4) Offline fallback: página básica com dados cacheados, (5) ícones PWA por tamanho (192x192, 512x512) usando branding da academia. Configurar next.config.ts para gerar manifest dinâmico por subdomínio.

**Test Strategy:**

Teste E2E: Lighthouse PWA audit passa (installable, service worker, manifest). Teste offline: page carrega com dados cacheados. Teste em device real ou emulador mobile.
