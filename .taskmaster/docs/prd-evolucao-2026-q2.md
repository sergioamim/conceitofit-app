# PRD — Evolução Q2 2026: Estabilização, Qualidade e Produto

## Contexto

Análise completa do projeto realizada em 29/03/2026 identificou que o sistema tem base técnica sólida (7/10 saúde geral), mas apresenta gaps críticos em 3 frentes:

1. **Operações**: sem observabilidade (Sentry/APM), sem deployment pipeline (CI sem CD), sem health checks
2. **Qualidade técnica**: componentes monolíticos, tokens em localStorage, TanStack Query subutilizado, testes de componentes limitados
3. **Produto**: sem portal do aluno, sem billing recorrente automatizado, sem integração real com canais de comunicação

Este PRD organiza as ações em 3 fases de 30 dias cada (Q2 2026).

## Stack atual

- Next.js 16.1.6, React 19, TypeScript strict, TailwindCSS 4, Shadcn/ui
- Backend: Java (Spring) em Cloud Run
- CI: GitHub Actions (E2E, coverage gate, Lighthouse)
- Deploy: Docker standalone → Cloud Run (manual)
- Testes: Vitest + Playwright (119 test files, coverage gate 60%)

---

## FASE 1 — Estabilização Operacional (0–30 dias)

### Épico 1.1: Observabilidade e Error Tracking

**Objetivo**: Ter visibilidade total de erros em produção para diagnosticar incidentes sem depender de reclamação de cliente.

**Tasks**:

1. **Integrar Sentry no frontend**
   - Instalar `@sentry/nextjs`
   - Configurar `sentry.client.config.ts` e `sentry.server.config.ts`
   - Configurar `instrumentation.ts` para inicializar Sentry no server
   - Adicionar `Sentry.captureException` nos pontos de erro existentes: `http.ts` (API errors), `api-error.ts` (normalized errors), `create-tenant-loader.tsx` (SSR errors)
   - Configurar source maps upload no build
   - Adicionar tags de contexto: tenantId, userId, networkId, route
   - Configurar alertas por email para erros novos
   - Ambiente: variável `NEXT_PUBLIC_SENTRY_DSN` e `SENTRY_AUTH_TOKEN`
   - **Critério de aceite**: erros de API e rendering aparecem no dashboard Sentry com contexto de tenant

2. **Adicionar request correlation (X-Request-Id)**
   - Gerar UUID por request no `http.ts` (já usa `crypto.randomUUID()` para context-id)
   - Passar `X-Request-Id` header em todas as chamadas API
   - Incluir request-id nos logs do Sentry e do logger.ts
   - **Critério de aceite**: é possível correlacionar um erro frontend com o log do backend Java pelo mesmo request-id

### Épico 1.2: Security Fixes

**Objetivo**: Corrigir os 2 riscos de segurança mais graves identificados na análise.

**Tasks**:

3. **Corrigir build error em seguranca/acesso-unidade/page.tsx**
   - O zodResolver tem type mismatch com CreateUserFormValues
   - Investigar se é incompatibilidade de Zod 4 com @hookform/resolvers
   - Corrigir tipagem para que `npm run build` passe sem erros
   - **Critério de aceite**: `npm run build` completa com sucesso sem type errors

4. **Remover unsafe-eval do CSP**
   - Investigar quais dependências exigem `unsafe-eval` (TipTap? Next.js dev?)
   - Se for apenas dev, condicionar por NODE_ENV
   - Se TipTap exige, avaliar nonce-based CSP ou CSP report-only para essa diretiva
   - Manter `unsafe-inline` por enquanto (Tailwind/Shadcn precisam)
   - **Critério de aceite**: produção não tem `unsafe-eval` no CSP, dev funciona normalmente

5. **Adicionar testes para sanitize.ts**
   - Testar: tags permitidas renderizam, tags proibidas (script, iframe, onclick) são removidas
   - Testar: atributos maliciosos (onerror, onload, javascript:) são removidos
   - Testar: edge cases (string vazia, null, HTML malformado)
   - **Critério de aceite**: 100% coverage no sanitize.ts, testes passam no CI

6. **Adicionar testes para feature-flags.ts**
   - Testar cada flag individualmente com env vars mockadas
   - Testar defaults quando env var não existe
   - **Critério de aceite**: todas as flags testadas com true/false/undefined

### Épico 1.3: Deployment Pipeline

**Objetivo**: Automatizar deploy para Cloud Run, eliminando deploy manual.

**Tasks**:

7. **Criar workflow GitHub Actions para deploy em Cloud Run**
   - Trigger: push na branch main (após merge de PR)
   - Steps: build Docker image → push para Artifact Registry → deploy Cloud Run
   - Usar Workload Identity Federation (sem chaves de serviço)
   - Variáveis de ambiente via Cloud Run secrets
   - Rollback automático se health check falhar
   - **Critério de aceite**: merge na main deploya automaticamente, rollback funciona

8. **Adicionar HEALTHCHECK no Dockerfile e endpoint /api/health**
   - Criar rota `/api/health` que retorna 200 com timestamp e versão
   - Adicionar HEALTHCHECK no Dockerfile apontando para essa rota
   - Configurar Cloud Run para usar health check na startup
   - **Critério de aceite**: Cloud Run só roteia tráfego após health check passar

---

## FASE 2 — Qualidade e Performance (31–60 dias)

### Épico 2.1: Data Fetching com TanStack Query

**Objetivo**: Substituir useState+useEffect manual por TanStack Query em páginas client, ganhando cache, dedup, retry automático e loading states grátis.

**Tasks**:

9. **Configurar TanStack Query provider e devtools**
   - Criar `src/lib/query/query-client.ts` com defaults (staleTime: 5min, retry: 2)
   - Adicionar `QueryClientProvider` no layout `(app)/layout.tsx`
   - Adicionar `ReactQueryDevtools` em modo dev
   - **Critério de aceite**: provider funciona, devtools visível em dev

10. **Migrar página /clientes para TanStack Query**
    - Criar `useClientes()` hook com `useQuery` e `useMutation`
    - Substituir os 12 useState em `clientes-client.tsx` por query state
    - Manter service layer existente como fetcher functions
    - Invalidar cache em mutations (criar, editar, suspender, migrar)
    - **Critério de aceite**: listagem funciona com cache, navegar e voltar não refetch, mutations invalidam corretamente

11. **Migrar página /pagamentos para TanStack Query**
    - Criar `usePagamentos()` hook
    - Substituir loading/error manual por query states
    - **Critério de aceite**: mesma funcionalidade com cache e retry automático

12. **Migrar página /dashboard para TanStack Query**
    - Criar `useDashboard()` hook
    - Configurar refetch interval (60s) para KPIs atualizados
    - **Critério de aceite**: dashboard com auto-refresh sem flicker

13. **Migrar página /matriculas para TanStack Query**
    - Criar `useMatriculas()` hook
    - Substituir retry manual de tenant context por query retry config
    - **Critério de aceite**: retry de context error funciona via TanStack Query

### Épico 2.2: Component Splits

**Objetivo**: Quebrar componentes >500 LOC em sub-componentes para manutenibilidade e testabilidade.

**Tasks**:

14. **Splitar novo-cliente-wizard.tsx (924 LOC)**
    - Extrair: `WizardStepDadosPessoais`, `WizardStepEndereco`, `WizardStepPlano`
    - Extrair: `useClienteWizardState()` hook para gerenciar estado do wizard
    - Manter `NovoClienteWizard` como orquestrador dos steps
    - **Critério de aceite**: cada sub-componente < 200 LOC, funcionalidade inalterada, testes existentes passam

15. **Splitar clientes-client.tsx (578 LOC, 12 useState)**
    - Extrair: `useClientesWorkspace()` hook consolidando os 12 useState
    - Extrair: `ClientesFilterBar` componente de filtros
    - Extrair: `ClientesTable` componente de listagem
    - **Critério de aceite**: cada arquivo < 250 LOC, testes passam

16. **Splitar admin/seguranca/usuarios/page.tsx (942 LOC)**
    - Extrair: `UsuariosFilters`, `UsuariosTable`, `UsuarioFormModal`
    - **Critério de aceite**: cada arquivo < 300 LOC

17. **Splitar nova-conta-pagar-modal.tsx (704 LOC)**
    - Extrair: `ContaPagarForm`, `ContaPagarRecorrenciaConfig`
    - **Critério de aceite**: cada arquivo < 300 LOC

18. **Splitar runtime.ts (~1500 LOC) por domínio**
    - Criar: `clients-runtime.ts`, `enrollments-runtime.ts`, `payments-runtime.ts`
    - Manter `runtime.ts` como barrel re-export para compatibilidade
    - **Critério de aceite**: imports existentes continuam funcionando, nenhum arquivo > 500 LOC

### Épico 2.3: Testes de Componentes

**Objetivo**: Aumentar cobertura de componentes de 14% para 40%.

**Tasks**:

19. **Testes para novo-cliente-wizard (após split)**
    - Testar: navegação entre steps, validação por step, draft persistence, submit final
    - **Critério de aceite**: happy path + error path cobertos

20. **Testes para plano-form.tsx**
    - Testar: validação de campos, preview, atividades associadas
    - **Critério de aceite**: formulário testado com dados válidos e inválidos

21. **Testes para receber-pagamento-modal.tsx**
    - Testar: seleção de forma de pagamento, data, validação, submit
    - **Critério de aceite**: modal abre, valida, submete corretamente

22. **Testes para nova-matricula-modal.tsx**
    - Testar: seleção de plano, cálculo de valores, confirmação
    - **Critério de aceite**: fluxo completo testado

23. **Testes para business-date.ts**
    - Testar: getBusinessTodayIso, getBusinessDateParts, addDaysToIsoDate, parseIsoDateAtNoon
    - Testar com diferentes timezones e datas edge (31/12, 29/02)
    - **Critério de aceite**: 100% coverage, edge cases cobertos

---

## FASE 3 — Produto e Mercado (61–90 dias)

### Épico 3.1: Portal do Aluno (PWA)

**Objetivo**: Entregar experiência digital para o aluno final — feature obrigatória para competir no mercado.

**Tasks**:

24. **Criar estrutura de rotas do portal do aluno**
    - Rota group `(aluno)` com layout próprio (bottom nav mobile-first)
    - Autenticação do aluno via rede/academia (reusar flow de /acesso/[redeSlug])
    - Rotas: `/meu-perfil`, `/meus-treinos`, `/minhas-aulas`, `/meus-pagamentos`, `/check-in`
    - **Critério de aceite**: rotas acessíveis, layout mobile responsivo, auth funciona

25. **Página "Meus Treinos" no portal do aluno**
    - Listar treinos atribuídos ao aluno logado
    - Exibir: divisão, exercícios, séries, carga, aderência %
    - Marcar execução (CONCLUIDA, PARCIAL, PULADA) via API existente
    - **Critério de aceite**: aluno vê treinos e registra execução

26. **Página "Minhas Aulas" com reserva online**
    - Listar aulas disponíveis na grade semanal
    - Reservar vaga (usar API existente de reservas)
    - Exibir status (confirmada, lista de espera)
    - Cancelar reserva
    - **Critério de aceite**: aluno reserva aula pelo portal, vaga atualiza na listagem admin

27. **Página "Check-in" digital**
    - QR Code gerado para o aluno
    - Auto-check-in via geolocalização (se dentro de raio configurado)
    - Histórico de presenças
    - **Critério de aceite**: check-in registra presença no backend

28. **Configurar PWA (manifest + service worker)**
    - Criar `manifest.json` com ícones, cores, nome
    - Service worker para cache offline básico (shell + assets)
    - Prompt de instalação (Add to Home Screen)
    - **Critério de aceite**: app instalável no mobile, funciona offline com shell cacheado

### Épico 3.2: Billing Recorrente

**Objetivo**: Automatizar cobrança de mensalidades via gateway, eliminando operação manual.

**Tasks**:

29. **Criar API client para billing recorrente (Pagar.me ou Asaas)**
    - Criar `src/lib/api/billing.ts` com: criar assinatura, cancelar, listar, webhooks
    - Tipos: `Assinatura`, `CobrancaRecorrente`, `WebhookEvent`
    - **Critério de aceite**: client tipado com endpoints do gateway escolhido

30. **Página de configuração de billing por academia**
    - Em `/administrativo/integracoes` ou nova rota
    - Configurar: gateway ativo, chave API, webhook URL
    - Testar conexão com gateway
    - **Critério de aceite**: academia configura gateway e valida conexão

31. **Vincular matrícula a assinatura recorrente**
    - No fluxo de criação de matrícula, se plano é recorrente → criar assinatura no gateway
    - Exibir status da assinatura na tela de matrículas
    - Cancelamento de matrícula cancela assinatura
    - **Critério de aceite**: matrícula recorrente cria assinatura, cancelamento propaga

32. **Dashboard de cobranças recorrentes**
    - Listar assinaturas ativas, pendentes, inadimplentes
    - Métricas: MRR, churn, inadimplência
    - Ações: retry, cancelar, suspender
    - **Critério de aceite**: operador visualiza e gerencia cobranças recorrentes

### Épico 3.3: Server Components Migration

**Objetivo**: Reduzir bundle JS migrando páginas admin simples de "use client" para Server Components.

**Tasks**:

33. **Auditar e classificar 119 páginas "use client"**
    - Classificar em: (A) pode ser 100% server, (B) hybrid, (C) precisa ser client
    - Listar as 15-20 candidatas mais simples para migração
    - **Critério de aceite**: lista classificada com justificativa

34. **Migrar 10 páginas administrativas simples para RSC**
    - Usar `createTenantLoader()` onde aplicável
    - Priorizar: páginas read-only ou com interação mínima
    - Verificar bundle size antes/depois (ANALYZE=true)
    - **Critério de aceite**: páginas migradas renderizam corretamente, bundle menor

35. **Migrar páginas de /conta para RSC onde possível**
    - Perfil, notificações, preferências — algumas podem ser server
    - **Critério de aceite**: bundle do route group /conta reduzido

---

## Métricas de sucesso

| Fase | Métrica | Target |
|------|---------|--------|
| Fase 1 | Erros em produção visíveis no Sentry | 100% capturados |
| Fase 1 | Build sem errors | 0 TS errors |
| Fase 1 | Deploy automatizado | merge → produção em < 10min |
| Fase 2 | Componentes > 500 LOC | 0 (todos splitados) |
| Fase 2 | Cobertura de componentes | > 40% (de 14%) |
| Fase 2 | Páginas com TanStack Query | 4+ páginas migradas |
| Fase 3 | Portal do aluno funcional | check-in + treinos + reservas |
| Fase 3 | Billing recorrente | matrículas com cobrança automática |
| Fase 3 | Bundle JS | -15% via RSC migration |

## Dependências externas

- **Sentry**: conta e DSN (gratuito para < 5K events/mês)
- **Cloud Run**: acesso ao GCP para configurar CD
- **Gateway de pagamento**: contrato com Pagar.me ou Asaas
- **Backend Java**: endpoints de billing recorrente (criar assinatura, webhook)
- **Backend Java**: endpoint /api/health (se não existir)

## Riscos do PRD

| Risco | Mitigação |
|-------|-----------|
| Backend não tem endpoints de billing | Priorizar gateway com API self-service (Asaas) |
| TanStack Query introduz bugs de cache | Migrar 1 página primeiro, validar padrão, depois expandir |
| Portal do aluno requer auth separada | Reusar auth flow de /acesso/[redeSlug] que já existe |
| RSC migration quebra interatividade | Classificar rigorosamente antes de migrar |
