# KNOWN_GAPS

## 1. Documentação de ambiente desatualizada em relação ao runtime real

- Fato observado:
  - `docs/ENVIRONMENTS.md` usa nomes como `NEXT_PUBLIC_API_URL`
  - o schema real em `src/lib/env.ts` usa `NEXT_PUBLIC_API_BASE_URL`
- Impacto:
  - fácil configurar ambiente errado

## 2. `.env.example` não cobre o conjunto real de variáveis usadas

- Fato observado:
  - `.env.example` contém basicamente `BACKEND_PROXY_TARGET`
  - o código lê também flags de bootstrap, auth contextual, storefront dev, catraca path e debug flags
- Impacto:
  - onboarding técnico fica mais lento e sujeito a “tentativa e erro”

## 3. Auditorias indicam divergências relevantes entre frontend e backend

- Fato observado no repositório documental:
  - `docs/API_AUDIT_BACKEND_VS_FRONTEND.md` reporta muitos endpoints frontend sem correspondência no backend
  - o mesmo documento reporta incompatibilidades de schema, especialmente em storefront theme
- Impacto:
  - uma task que só “segue o cliente atual” pode preservar chamadas que já são suspeitas em runtime real

## 4. Guia de integração parece refletir uma fase anterior do frontend

- Fato observado:
  - `docs/FRONTEND_INTEGRATION_GUIDE.json` ainda descreve fortemente `/api/v1/academia/*`
  - o código atual usa módulos como `comercial`, `crm`, `administrativo`, `backoffice`, `publico/storefront`
- Impacto:
  - bom como referência histórica/semântica, fraco como contrato único de implementação

## 5. Documento antigo de integração real aponta uso de mocks que não representa mais o código atual

- Fato observado:
  - `docs/BACKEND_REAL_INTEGRATION_VALIDATION.md` menciona imports diretos de `@/lib/mock/services`
  - o código atual relevante já usa `src/lib/api/*` e `src/lib/public/*`
- Impacto:
  - a doc é útil como histórico de risco, mas não como descrição fiel do estado atual

## 6. Cobertura forte em `src/lib`, cobertura mais fraca nas áreas grandes de UI

- Fato observado:
  - a governança de coverage declara `src/lib` como gate principal
  - páginas extensas de `src/app` e componentes maiores ainda aparecem com lacunas relevantes
- Fonte:
  - `docs/TEST_COVERAGE_CORE.md`
  - `docs/TEST_COVERAGE_BASELINE.md`
- Impacto:
  - mudanças grandes de UI precisam de validação manual/Playwright, não só de unit test

## 7. Relação entre “academia”, “rede” e “grupo” ainda não está completamente estabilizada no frontend

- Fato observado:
  - PRDs recentes defendem `Rede` como identidade canônica
  - tipos e APIs do frontend ainda usam bastante `Academia` e `groupId`
- Fontes:
  - `docs/USUARIOS_IDENTIDADE_ACESSO_PRD.md`
  - `src/lib/shared/types/tenant.ts`
- Impacto:
  - risco de misturar escopo de identidade, branding e operação

## 8. Storefront ainda combina múltiplos modos de entrada

- Fato observado:
  - existe rota por headers/subdomínio em `src/app/(public)/storefront/page.tsx`
  - existe rota canônica por slug em `src/app/(public)/storefront/[academiaSlug]/page.tsx`
  - existe proxy por subdomínio em `src/proxy.ts`
- Impacto:
  - fácil alterar uma superfície e esquecer a outra, especialmente em metadata, SEO e fallback de headers

## 9. Observabilidade ainda não separa automaticamente tráfego público e operacional

- Fato observado:
  - existe página pública de status em `src/app/status/page.tsx`
  - existe monitor operacional em `src/app/monitor/boas-vindas/page.tsx`
  - `src/app/global-error.tsx` captura exceções via Sentry quando configurado
  - `next.config.ts` expõe `tunnelRoute: "/monitoring"` quando `NEXT_PUBLIC_SENTRY_DSN` está habilitado
- Impacto:
  - a separação por superfície existe na taxonomia de rotas, mas não há tagging/documentação de analytics por superfície no código atual

## 10. Parte do comportamento é controlada por documentação operacional, não por convenção automática

- Fato observado:
  - smoke pack, coverage gate e diagnóstico de backend residual vivem em `docs/*.md`
- Impacto:
  - IAs e devs novos precisam ler docs além do código para não inferir um fluxo simplificado demais

## 11. Lacunas que não podem ser fechadas só neste repositório

- Lacuna conhecida:
  - compatibilidade real com backend Java atual
  - disponibilidade dos endpoints auditados como “fantasma”
  - semântica exata de alguns DTOs públicos e de backoffice
- Como tratar:
  - documentar como risco
  - consultar backend/OpenAPI real antes de mexer em contratos sensíveis
