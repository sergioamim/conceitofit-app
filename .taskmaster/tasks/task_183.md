# Task ID: 183

**Title:** Migrar tags img nativas para next/image

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** 5 arquivos usam <img> nativo sem otimização automática (WebP, lazy loading, responsive).

**Details:**

Arquivos: storefront/layout.tsx, novo-cliente-wizard.tsx, voucher-codigos-modal.tsx, cliente-header.tsx, cliente-thumbnail.tsx. Substituir <img> por <Image> de next/image. Configurar width/height ou fill. Para imagens dinâmicas (foto de aluno), usar loader customizado ou unoptimized se vierem de API externa. Adicionar alt text acessível.

**Test Strategy:**

grep '<img ' src/ retorna zero resultados. Imagens renderizam corretamente. Lighthouse Images audit sem warnings.
