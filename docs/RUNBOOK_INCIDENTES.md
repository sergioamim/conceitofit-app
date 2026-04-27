# Runbook de Incidentes — Academia Frontend

> Task 474 | Última atualização: 2026-04-06

## 1. Erro 500 em produção

### Sintoma
Usuários relatam tela de erro ou funcionalidade quebrada.

### Diagnóstico
1. Acesse [Sentry](https://sentry.io) → Errors → Filtre por `environment: production`
2. Ordene por "Last Seen" para ver os erros mais recentes
3. Verifique o `correlationId` no contexto do erro para rastrear no backend
4. Identifique: página afetada, tenant, usuário, stack trace

### Ação
- **1-10 erros/hora**: Monitore. Pode ser edge case.
- **>10 erros/hora**: Issue crítico. Faça rollback do último deploy se recente.
- **Erro em página específica**: Desabilite feature flag se disponível.

### Escalation
- Tech Lead → Se >50 erros/hora ou afeta >10% dos tenants
- On-call → Se página crítica (login, dashboard, pagamentos)

---

## 2. Backend indisponível

### Sintoma
Todos os requests API falham com 500/502/503. Página de pagamentos mostra loading infinito.

### Diagnóstico
1. Acesse `/api/health` — verifique `backend.status`
2. Se `unreachable`: backend está down ou rede bloqueada
3. Se `unhealthy`: backend está up mas com erro interno
4. Verifique a VPS e os containers Docker do backend Java

### Ação
1. Verifique se o backend está respondendo: `curl -v https://api.conceito.fit/actuator/health/liveness`
2. Se down, confira o slot ativo e reinicie/rollback via `academia-java/deploy/deploy-bluegreen.sh`
3. Verifique logs do backend para causa raiz
4. Comunique aos usuários via status page se disponível

### Escalation
- Imediato: Backend é dependency crítica. Escalar para equipe backend.

---

## 3. Sessão inválida em massa

### Sintoma
Múltiplos usuários são deslogados simultaneamente.

### Diagnóstico
1. Verifique Sentry por erros de `401` em massa
2. Verifique se houve deploy recente do backend (mudança de secret JWT)
3. Verifique se cookies HttpOnly estão sendo definidos corretamente
4. Console do browser: verifique se `fc_access_token` cookie existe

### Ação
1. Se deploy recente do backend: verificar compatibilidade de tokens
2. Se problema de cookies: verificar Secure flag (HTTP vs HTTPS)
3. Limpar cache do browser em ambientes afetados
4. Se necessário: forçar re-login global

### Escalation
- Se afeta >50% dos usuários simultaneamente: rollback imediato do backend

---

## 4. Tenant data leak (suspeita)

### Sintoma
Usuário vê dados de outro tenant.

### Diagnóstico
1. Verifique o `X-Context-Id` nos requests
2. No Sentry, filtre por `tenantId` e verifique se há cross-tenant access
3. Verifique logs do backend para queries sem tenant filter

### Ação — EMERGÊNCIA
1. **Isole o tenant afetado** — desabilite acesso temporariamente
2. **Colete evidências** — screenshots, correlation IDs, timestamps
3. **Notifique** — Tech Lead + Security + Compliance (LGPD)
4. **Audite** — verifique escopo do vazamento (quantos tenants, quais dados)
5. **Documente** — registre tudo para relatório de incidente

### Escalation
- **IMEDIATO** — Incidente de segurança. Acionar resposta a incidentes.

---

## 5. Degradação de performance

### Sintoma
Páginas carregam lentamente (>4s LCP).

### Diagnóstico
1. Sentry → Performance → Verifique P75/P95 de duração por página
2. Lighthouse CI → Verifique se há regressão de bundle size
3. Network tab do browser: verifique se API calls estão lentas
4. Verifique métricas de API: `recordSentryApiMetric` mostra duração por endpoint

### Ação
1. Se API lenta: escalar para equipe backend
2. Se bundle grande: verificar último deploy por mudanças de bundle
3. Se cliente-side: verificar TanStack Query caching (staleTime muito baixo)
4. Se necessário: ativar CDN para assets estáticos

### Alertas configurados no Sentry
| Métrica | Threshold | Ação |
|---------|-----------|------|
| Errors por página | >10/hora | Investigar |
| Error rate por endpoint | >50% | Escalar |
| LCP | >4s | Otimizar |
| JS crash rate | >5% sessions | Rollback |

---

## Contatos de Emergência

| Papel | Contato |
|-------|---------|
| Tech Lead | @tech-lead |
| On-call backend | #backend-oncall |
| Security | #security-incidents |
| Compliance (LGPD) | compliance@conceito.fit |
