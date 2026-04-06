# Auditoria de Segurança — CSP, Headers e Configurações

> Data: 2026-04-06 | Task: 460 | Status: **PARCIALMENTE CONCLUÍDA**

## Resumo

Esta auditoria avalia os headers de segurança do Next.js e identifica o que pode ser melhorado.

## Headers atuais (next.config.ts)

| Header | Valor | Avaliação |
|--------|-------|-----------|
| `Content-Security-Policy` | Script: `'self' 'unsafe-inline'` | ⚠️ `unsafe-inline` necessário por Next.js |
| `Content-Security-Policy` | Style: `'self' 'unsafe-inline'` | ⚠️ Necessário por Tailwind CSS runtime |
| `Content-Security-Policy` | Connect: `'self' + Sentry + backend | ✅ Bem configurado |
| `Content-Security-Policy` | Frame-ancestors: `'none'` | ✅ Protege contra clickjacking |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | ✅ Forte |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `X-Frame-Options` | `DENY` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | ⚠️ Câmera é necessária |

## 'unsafe-inline' no CSP

### Por que não podemos remover agora

1. **Next.js 16.1.6** pode gerar scripts inline durante o build (hydration scripts, error boundaries)
2. **Tailwind CSS v4** com PostCSS pode injetar estilos inline
3. **TipTap** (editor rich text) usa `contentEditable` que pode exigir inline styles
4. **Framer Motion** pode usar inline styles para animações

### O que já foi feito para mitigar XSS

| Medida | Status |
|--------|--------|
| Tokens em localStorage → HttpOnly cookies | ✅ Task 458 |
| CSRF token (Double Submit Cookie) | ✅ Task 459 |
| DOMPurify para sanitização HTML | ✅ Já existente |
| SameSite=Lax em todos os cookies | ✅ Já existente no backend |
| Frame-ancestors: 'none' | ✅ Já existente |
| X-Frame-Options: DENY | ✅ Já existente |

### Recomendação para remoção futura

Para remover `'unsafe-inline'` do `script-src`, seria necessário:

1. **Nonce-based CSP**: Next.js precisa ser configurado para gerar nonce por request
2. **Hash-based CSP**: Usar hashes de scripts inline conhecidos
3. Ambas as abordagens são complexas com App Router e SSR

**Conclusão:** `'unsafe-inline'` é aceitável neste momento porque:
- A superfície XSS principal (tokens em localStorage) foi eliminada (Task 458)
- CSRF protection está ativa (Task 459)
- Cookies são HttpOnly + SameSite=Lax
- O risco residual é baixo

## Permissions-Policy: Câmera bloqueada

A app usa câmera para:
- Foto de cliente (`novo-cliente-wizard`)
- Leitor de código de barras (`vendas/nova`)

O `Permissions-Policy: camera=()` é advisory — browsers modernos podem ignorar. Mas é inconsistente com a funcionalidade real.

**Recomendação:** Remover `camera=()` do Permissions-Policy ou condicionar às rotas que usam câmera.

## Score de segurança atual

| Área | Antes | Depois |
|------|-------|--------|
| Tokens em localStorage | 🔴 CRÍTICO | ✅ HttpOnly cookies |
| CSRF | ⚠️ Sem proteção | ✅ Double Submit Cookie |
| CSP unsafe-inline | ⚠️ Presente | ⚠️ Presente (aceitável) |
| CSP unsafe-eval | 🔴 Presente | ⚠️ Presente (somente em dev) |
| HSTS | ✅ Forte | ✅ Forte |
| Frame protection | ✅ DENY | ✅ DENY |
| Cookie SameSite | ✅ Lax | ✅ Lax |

**Risco geral: BAIXO** (reduzido de CRÍTICO para BAIXO após Tasks 458-459)
