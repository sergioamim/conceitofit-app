# Task ID: 460

**Title:** Remover 'unsafe-inline' do CSP se possível e auditar segurança

**Status:** pending

**Dependencies:** 458

**Priority:** high

**Description:** Avaliar se Next.js 16.1.6 ainda requer 'unsafe-inline' no script-src e, se possível, remover. Auditoria geral de segurança.

**Details:**

Verificar se Next.js 16 com App Router e output standalone ainda precisa de 'unsafe-inline'. Testar com script-src 'self' apenas e validar que tudo funciona. Se não for possível, implementar nonce-based CSP. Auditoria completa: Permissions-Policy (câmera é necessária para foto de cliente e código de barras), CORS config, headers de segurança, validação de input em formulários, sanitização com DOMPurify.

**Test Strategy:**

Lighthouse CI com CSP restrito passa. Teste E2E: todas as páginas funcionam sem 'unsafe-inline'. Auditoria de security headers com Mozilla Observatory ou similar.
