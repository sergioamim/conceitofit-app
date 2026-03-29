# Task ID: 176

**Title:** Remover credenciais default hardcoded do http.ts

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Auto-login dev usa fallback hardcoded (admin@academia.local / 12345678) que seria ativado se NEXT_PUBLIC_DEV_AUTO_LOGIN estiver ligado em produção.

**Details:**

Em src/lib/api/http.ts linhas 708-709, remover os valores default '12345678' e 'admin@academia.local'. Exigir que as variáveis NEXT_PUBLIC_DEV_AUTH_EMAIL e NEXT_PUBLIC_DEV_AUTH_PASSWORD estejam definidas para o auto-login funcionar — se ausentes, desabilitar auto-login silenciosamente. Adicionar guard que só permite auto-login quando NODE_ENV === 'development'.

**Test Strategy:**

grep '12345678' src/ retorna zero. grep 'admin@academia.local' src/ retorna zero. Auto-login funciona em dev com .env configurado. Em production build, auto-login é inerte.
