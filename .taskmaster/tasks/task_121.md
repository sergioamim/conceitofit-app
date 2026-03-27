# Task ID: 121

**Title:** Adicionar PWA manifest e meta tags

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Configurar o app como Progressive Web App com manifest.json, ícones, meta tags de tema e service worker básico para cache do shell, permitindo instalação na tela inicial de dispositivos móveis.

**Details:**

Criar public/manifest.json com nome, short_name, ícones (192x192 e 512x512), start_url, display standalone, theme_color e background_color alinhados ao design system (dark theme, gym-accent). Adicionar meta tags no root layout (theme-color, apple-mobile-web-app-capable, apple-mobile-web-app-status-bar-style). Gerar ícones PNG a partir do logo existente. Opcionalmente configurar next-pwa ou service worker manual para cache do app shell (HTML/CSS/JS estáticos). Não cachear dados de API.

**Test Strategy:**

Abrir o app no Chrome mobile e verificar que o banner "Adicionar à tela inicial" aparece. Instalar e abrir como standalone. Verificar ícone e splash screen. No desktop, verificar ícone de instalação na barra de endereço do Chrome.

## Subtasks

### 121.1. Criar manifest.json e gerar ícones PWA

**Status:** done  
**Dependencies:** None  

Criar public/manifest.json com nome, ícones 192/512, start_url, display standalone, theme_color alinhado ao gym-accent. Gerar PNGs.

### 121.2. Adicionar meta tags e service worker básico

**Status:** done  
**Dependencies:** 121.1  

Adicionar meta tags PWA no root layout (theme-color, apple-mobile-web-app). Configurar service worker para cache do app shell (sem cachear APIs).
