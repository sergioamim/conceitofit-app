# Recomendações de Segurança — Backend

## 1. Desabilitar HS256 por padrão

O algoritmo HS256 (HMAC-SHA256) usa chave simétrica compartilhada entre emissor e verificador do token JWT. Isso significa que qualquer serviço que verifica tokens também pode emitir tokens, o que é um risco de segurança em arquiteturas multi-serviço.

### Configuração recomendada (`application.yml`)

```yaml
# ============================================================
# JWT / Segurança de tokens
# ============================================================
security:
  jwt:
    # Desabilitar HS256 — usar RS256 ou ES256 por padrão
    legacy-hs256-enabled: false
    
    # Algoritmo padrão para novos tokens
    algorithm: RS256
    
    # Chaves RSA (RS256)
    rsa:
      public-key: classpath:keys/jwt-public.pem
      private-key: classpath:keys/jwt-private.pem
    
    # TTL dos tokens
    access-token-ttl: 15m
    refresh-token-ttl: 7d
    
    # Cookies HttpOnly (já implementado — Task 458)
    cookie:
      secure: true
      same-site: lax
      http-only: true
```

### Por que desabilitar HS256?

| Aspecto | HS256 (simétrico) | RS256 (assimétrico) |
|---------|-------------------|---------------------|
| Chave | Única, compartilhada | Par público/privado |
| Emissão | Qualquer serviço com a chave | Apenas quem tem a chave privada |
| Verificação | Qualquer serviço com a chave | Qualquer serviço com a chave pública |
| Rotação | Requer distribuir nova chave a todos | Só precisa atualizar a privada |
| Risco | Vazamento compromete tudo | Vazamento da pública é inofensivo |

### Migração

1. Gerar par RSA: `openssl genpkey -algorithm RSA -out jwt-private.pem -pkeyopt rsa_keygen_bits:2048`
2. Extrair pública: `openssl rsa -pubout -in jwt-private.pem -out jwt-public.pem`
3. Colocar em `src/main/resources/keys/`
4. Setar `legacy-hs256-enabled: false` no `application.yml`
5. Tokens HS256 existentes continuam válidos até expirar (graceful migration)

## 2. Validação de compatibilidade Zod v4 + @hookform/resolvers

**Status: Validado e funcional.**

```
zod: ^4.3.6
@hookform/resolvers: ^3.10.0
```

Teste executado com sucesso: `zodResolver(z.object({ name: z.string().min(1) }))` — sem erros.

Nenhuma ação necessária. Se uma versão futura quebrar, pin `zod` para `3.x`:
```bash
npm install zod@3 --save-exact
```
