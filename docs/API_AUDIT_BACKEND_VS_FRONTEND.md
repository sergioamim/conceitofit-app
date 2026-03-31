# Auditoria de API: Backend vs Frontend

**Data:** 2026-03-28
**Backend:** 755 endpoints (OpenAPI `/tmp/api-docs.json`)
**Frontend:** 55 arquivos em `src/lib/api/` + schemas em `src/lib/forms/` e `src/lib/shared/types/`

---

## Resumo Executivo

| Metrica | Valor |
|---------|-------|
| Total endpoints backend | 755 |
| Total paths consumidos pelo frontend | ~227 |
| Cobertura do backend | ~30% |
| Paths frontend sem correspondencia no backend (potenciais 404) | **61** |
| Endpoints backend nao consumidos | ~378 |
| Incompatibilidades de schema identificadas | **8** |
| Modulos backend 100% sem consumo frontend | **35+** |

---

## A. Paths do Frontend que NAO Existem no Backend (Potenciais 404)

Estes sao os endpoints chamados pelo frontend que **nao existem** no OpenAPI do backend. Representam risco de erro em runtime.

### P0 - Modulos inteiros fantasma (nenhum endpoint existe no backend)

| Path Frontend | Arquivo | Risco |
|---------------|---------|-------|
| `/api/v1/billing/config` | `billing.ts` | **P0** - Modulo `/billing/` inteiro nao existe no backend |
| `/api/v1/billing/config/test` | `billing.ts` | **P0** |
| `/api/v1/billing/assinaturas` | `billing.ts` | **P0** |
| `/api/v1/billing/assinaturas/{id}` | `billing.ts` | **P0** |
| `/api/v1/billing/assinaturas/{id}/cancelar` | `billing.ts` | **P0** |
| `/api/v1/financial/accounts` | `financial.ts` | **P0** - Modulo `/financial/` inteiro nao existe no backend |
| `/api/v1/financial/accounts/{id}` | `financial.ts` | **P0** |
| `/api/v1/financial/ledgers` | `financial.ts` | **P0** |
| `/api/v1/financial/ledgers/{id}` | `financial.ts` | **P0** |
| `/api/v1/financial/ledgers/{id}/close` | `financial.ts` | **P0** |
| `/api/v1/financial/ledgers/{id}/entries` | `financial.ts` | **P0** |
| `/api/v1/financial/transactions` | `financial.ts` | **P0** |
| `/api/v1/financial/transactions/{id}` | `financial.ts` | **P0** |
| `/api/v1/financial/transactions/{id}/confirm` | `financial.ts` | **P0** |
| `/api/v1/financial/transactions/{id}/reverse` | `financial.ts` | **P0** |
| `/api/v1/financial/transactions/{id}/cancel` | `financial.ts` | **P0** |
| `/api/v1/financial/reports/balanco` | `financial.ts` | **P0** |
| `/api/v1/financial/reports/fluxo-caixa` | `financial.ts` | **P0** |
| `/api/v1/financial/reports/extrato/{contaId}` | `financial.ts` | **P0** |
| `/api/v1/financial/monitoring/suspicious` | `financial.ts` | **P0** |
| `/api/v1/financial/monitoring/patterns` | `financial.ts` | **P0** |
| `/api/v1/financial/monitoring/high-frequency` | `financial.ts` | **P0** |
| `/api/v1/whatsapp/config` | `whatsapp.ts` | **P0** - Modulo `/whatsapp/` inteiro nao existe no backend |
| `/api/v1/whatsapp/config/test` | `whatsapp.ts` | **P0** |
| `/api/v1/whatsapp/templates` | `whatsapp.ts` | **P0** |
| `/api/v1/whatsapp/templates/{id}` | `whatsapp.ts` | **P0** |
| `/api/v1/whatsapp/logs` | `whatsapp.ts` | **P0** |
| `/api/v1/whatsapp/send` | `whatsapp.ts` | **P0** |
| `/api/v1/agenda/aulas/sessoes` | `reservas.ts` | **P0** - Modulo `/agenda/aulas/` inteiro nao existe no backend |
| `/api/v1/agenda/aulas/sessoes/{id}/ocupacao` | `reservas.ts` | **P0** |
| `/api/v1/agenda/aulas/sessoes/{id}/promover-waitlist` | `reservas.ts` | **P0** |
| `/api/v1/agenda/aulas/reservas` | `reservas.ts` | **P0** |
| `/api/v1/agenda/aulas/reservas/{id}/cancelar` | `reservas.ts` | **P0** |
| `/api/v1/agenda/aulas/reservas/{id}/checkin` | `reservas.ts` | **P0** |
| `/api/v1/crm/cadencias/execucoes` | `crm-cadencias.ts` | **P0** - Modulo `/crm/cadencias/` inteiro nao existe no backend |
| `/api/v1/crm/cadencias/execucoes/{id}` | `crm-cadencias.ts` | **P0** |
| `/api/v1/crm/cadencias/execucoes/{id}/cancelar` | `crm-cadencias.ts` | **P0** |
| `/api/v1/crm/cadencias/trigger` | `crm-cadencias.ts` | **P0** |
| `/api/v1/crm/cadencias/escalation-rules` | `crm-cadencias.ts` | **P0** |
| `/api/v1/crm/cadencias/escalation-rules/{id}` | `crm-cadencias.ts` | **P0** |
| `/api/v1/crm/cadencias/process-overdue` | `crm-cadencias.ts` | **P0** |

> **Impacto:** 7 modulos frontend inteiros (`billing`, `financial`, `whatsapp`, `agenda/aulas`, `crm/cadencias`, `crm/atividades`, `crm/pipeline-stages`) chamam endpoints que **nao existem** no backend. Qualquer tela que dependa deles retornara 404 ou erro de rede.

### P1 - Endpoints individuais fantasma

| Path Frontend | Arquivo | Nota |
|---------------|---------|------|
| `/api/v1/auth/first-access` | `auth.ts` | Endpoint nao existe no OpenAPI - funcionalidade de primeiro acesso |
| `/api/v1/auth/rede-contexto` | `auth.ts` | Endpoint nao existe no OpenAPI - contexto de rede para login |
| `/api/v1/crm/pipeline-stages` | `crm.ts` | Endpoint nao existe - pipeline do CRM |
| `/api/v1/crm/cadencias` | `crm.ts` | Endpoint nao existe (via `crm.ts`, alem de `crm-cadencias.ts`) |
| `/api/v1/crm/cadencias/{id}` | `crm.ts` | Endpoint nao existe |
| `/api/v1/crm/atividades` | `crm.ts` | Endpoint nao existe |
| `/api/v1/crm/tarefas/{id}` | `crm.ts` | GET/PUT por id nao existe (so tem GET lista e PATCH status) |
| `/api/v1/comercial/matriculas/{id}/contrato/assinar` | `matriculas.ts` | ~~Path incorreto~~ **CORRIGIDO** — alias adicionado no backend |
| `/api/v1/comercial/pagamentos/{id}/nfse` | `pagamentos.ts` | ~~Backend tem `emitir-nfse`~~ **CORRIGIDO** — alias adicionado |
| `/api/v1/comercial/pagamentos/nfse/lote` | `pagamentos.ts` | ~~Nao existe~~ **CORRIGIDO** — endpoint criado |
| `/api/v1/comercial/vendas/{id}` | `vendas.ts` | ~~GET nao existe~~ **CORRIGIDO** — endpoint criado |
| `/api/v1/comercial/vouchers/validar` | `beneficios.ts` | ~~Nao existe~~ **CORRIGIDO** — endpoint criado |
| `/api/v1/grupos-musculares/{id}/toggle` | `treinos.ts` | ~~Toggle nao existe~~ **CORRIGIDO** — PATCH toggle criado |
| `/api/v1/treinos/{id}/atribuir` | `treinos.ts` | ~~Path diferente~~ **CORRIGIDO** — alias adicionado |
| `/api/v1/administrativo/integracoes-operacionais` | `admin-financeiro.ts` | ~~Nao existe~~ **CORRIGIDO** — controller stub criado |
| `/api/v1/administrativo/integracoes-operacionais/{id}/reprocessar` | `admin-financeiro.ts` | ~~Nao existe~~ **CORRIGIDO** — endpoint stub criado |
| `/api/v1/gerencial/agregadores/transacoes` | `admin-financeiro.ts` | ~~Path diferente~~ **CORRIGIDO** — alias para visitas |
| `/api/v1/gerencial/agregadores/transacoes/{id}/reprocessar` | `admin-financeiro.ts` | ~~Nao existe~~ **CORRIGIDO** — endpoint stub criado |

### P1 - Mismatch de enum no Login

| Campo | Frontend envia | Backend aceita | Arquivo |
|-------|---------------|----------------|---------|
| `LoginRequestDTO.channel` | `"APP"`, `"BACKOFFICE"` | `"WEB"`, `"APP"` | `auth.ts` |

> **Impacto:** Quando o frontend envia `channel: "BACKOFFICE"`, o backend pode rejeitar ou ignorar o valor. O valor correto do backend para web e `"WEB"`.

---

## B. Endpoints do Backend NAO Consumidos pelo Frontend

Organizados por modulo. Total: ~378 endpoints nao consumidos (50% do backend).

### Modulos 100% nao consumidos (nenhum endpoint utilizado)

| Modulo/Tag | Endpoints | Prioridade |
|------------|-----------|------------|
| Adesao Publica | 11 | P2 - Fluxo publico de adesao online |
| App Cliente Mobile | 24 | P2 - API do app mobile |
| App Cliente Contratos | 6 | P2 |
| App Cliente Financeiro | 2 | P2 |
| App Cliente Campanhas | 2 | P2 |
| App Cliente Perfil | 2 | P2 |
| App Cliente Referral | 2 | P2 |
| App Cliente Rewards | 1 | P2 |
| App Cliente Device Token | 2 | P2 |
| App Cliente Avaliacao Fotos | 1 | P2 |
| Push Tokens | 3 | P2 |
| Totem | 5 | P2 - Self-service kiosk |
| Visitantes | 5 | P1 - Gestao de visitantes |
| Fidelizacao | 9 | P1 - Programa de fidelidade |
| Dunning | 7 | P1 - Cobranca automatizada |
| Dunning Templates | 2 | P1 |
| NFSe | 12 | P1 - Nota fiscal eletronica |
| Recepcao Aulas | 8 | P1 - Controle presencial de aulas |
| Retenção NPS | 7 | P1 |
| Relatorios Financeiros | 3 | P1 - DRE, aging, fluxo de caixa |
| Notificacoes | 4 | P1 |
| Exportacao | 2 | P1 - Exportacao de dados |
| Busca Global | 1 | P1 |
| Storefront Publica | 13 | P2 - Site publico da academia |
| Backoffice Importacao Unidade | 11 | P2 |
| Backoffice Onboarding Unidade | 4 | P2 |
| Compliance LGPD | 5 | P2 |
| Demo Account | 2 | P2 |
| Vindi | 4 | P2 - Gateway especifico |
| PIX Nativo | 5 | P2 - Integracoes PIX |
| Pagar.me | 3 | P2 |
| EFI (Gerencianet) | 1 | P2 |
| Mercado Pago | 1 | P2 |
| Tenants | 8 | P2 - Gestao de tenants |
| Matrícula Vencimento | 2 | P1 |

### Modulos parcialmente consumidos (com gaps significativos)

| Modulo/Tag | Consumidos | Total | Nao consumidos |
|------------|-----------|-------|----------------|
| Financeiro Gerencial | ~39 | 75 | 36 (categorias, convenios, descontos, naturezas, grupos DRE, recorrencia receber, visao completa, conciliacao arquivo) |
| Comercial | ~19 | 53 | 34 (clientes aliases, anamnese, suspensao, multi-unidade, assinar contrato, totais-status) |
| CRM | ~19 | 57 | 38 (aliases via `/prospects/`, `/campanhas/` sem prefixo, agendamentos legacy) |
| Treinos e Exercicios | ~23 | 45 | 22 (blocos, itens, prescricao, biblioteca, jobs, dashboard treino, aderencia) |
| BI | ~4 | 9 | 5 (dashboard gerencial, inadimplencia, receita, retencao, resumo unidade) |
| Auth / RBAC | ~15 | variados | DELETE user, GET user by id, reset-password, authorize/check, acessos-administrativos |
| Administrativo (Aulas) | 0 | 21 | 21 (elegibilidade, grupos atividade, sessoes admin, sessoes audit) |

---

## C. Incompatibilidades de Schema

### C1. StorefrontThemeRequest - **P0 CRITICO**

O frontend e o backend usam schemas **completamente diferentes** para o tema da storefront.

| Campo | Backend (StorefrontThemeRequest) | Frontend (storefrontThemeSchema) | Impacto |
|-------|--------------------------------|----------------------------------|---------|
| `corPrimaria` | Sim | Nao (usa `colors.primary`) | Backend ignora cores do frontend |
| `corSecundaria` | Sim | Nao (usa `colors.accent`) | Backend ignora |
| `corFundo` | Sim | Nao (usa `colors.background`) | Backend ignora |
| `corTexto` | Sim | Nao (usa `colors.foreground`) | Backend ignora |
| `titulo` | Sim | Nao (usa `heroTitle`) | Backend ignora |
| `subtitulo` | Sim | Nao (usa `heroSubtitle`) | Backend ignora |
| `descricao` | Sim | Nao | Backend ignora |
| `bannerUrl` | Sim | Nao (usa `heroImageUrl`) | Backend ignora |
| `galeriaUrls` | Sim (array) | Nao | Frontend nao suporta |
| `redesSociais` | Sim (map) | Nao (usa `instagram`, `facebook`, `whatsapp` separados) | Formato incompativel |
| `customCssVars` | Sim (map) | Nao | Frontend nao suporta |
| `ativo` | Sim | Nao | Frontend nao envia |
| `heroImageUrl` | Nao | Sim | Backend ignora |
| `heroTitle` | Nao | Sim | Backend ignora |
| `heroSubtitle` | Nao | Sim | Backend ignora |
| `themePreset` | Nao | Sim | Backend ignora |
| `useCustomColors` | Nao | Sim | Backend ignora |
| `colors` (object) | Nao | Sim | Backend ignora |
| `footerText` | Nao | Sim | Backend ignora |

> **Conclusao:** O formulario de storefront theme do frontend envia campos que o backend nao reconhece, e nao envia os campos que o backend espera. **Nenhum dado do formulario e efetivamente salvo no backend.**

### C2. LoginRequestDTO.channel - **P1**

| | Backend | Frontend |
|-|---------|----------|
| Valores aceitos | `"WEB"`, `"APP"` | `"APP"`, `"BACKOFFICE"` |

O frontend envia `channel: "BACKOFFICE"` para o login admin via `loginApi`, mas o backend aceita `"WEB"` ou `"APP"`. Pode causar rejeicao silenciosa ou fallback inesperado.

### C3. StorefrontTheme tipo frontend vs StorefrontThemeResponse - **P1**

O tipo `StorefrontTheme` em `src/lib/shared/types/tenant.ts` tem:
- `tenantId` (backend retorna `academiaId`, nao `tenantId`)
- `heroImageUrl`, `heroTitle`, `heroSubtitle` (backend retorna `bannerUrl`, `titulo`, `subtitulo`)
- `socialLinks.instagram/facebook/whatsapp` (backend retorna `redesSociais` como map generico)
- `colors` como objeto tipado (backend retorna cores como campos flat: `corPrimaria`, etc.)

### C4. Endpoint path mismatch - matriculas contrato assinar - **P1**

| | Frontend | Backend |
|-|----------|---------|
| Path | `/api/v1/comercial/matriculas/{id}/contrato/assinar` | `/api/v1/comercial/matriculas/{id}/assinar-contrato` |

### C5. Endpoint path mismatch - pagamentos NFSe - **P1**

| | Frontend | Backend |
|-|----------|---------|
| NFSe individual | `/api/v1/comercial/pagamentos/{id}/nfse` | `/api/v1/comercial/pagamentos/{id}/emitir-nfse` |
| NFSe lote | `/api/v1/comercial/pagamentos/nfse/lote` | Nao existe |

### C6. ForgotPasswordRequestDTO - **P2**

O frontend envia `channel` no forgot-password, mas o backend `ForgotPasswordRequestDTO` nao tem campo `channel`. Campo sera ignorado (sem erro, mas sem efeito).

### C7. Grupos Musculares Toggle - **P1**

Frontend chama `PATCH /api/v1/grupos-musculares/{id}/toggle` mas backend so expoe `PUT` e `DELETE` em `/api/v1/grupos-musculares/{id}`. Nao ha endpoint toggle.

### C8. Treino Atribuir path - **P1**

Frontend tenta `POST /api/v1/treinos/{id}/atribuir` como fallback, mas backend so tem `POST /api/v1/treinos/templates/{id}/atribuir`.

---

## D. Campos Ausentes em DTOs Chave

### D1. LoginRequestDTO

| Campo Backend | Usado pelo Frontend | Nota |
|---------------|-------------------|------|
| `email` | Sim | |
| `identifier` | Sim | |
| `password` | Sim | |
| `channel` | Sim, mas com valor errado (`BACKOFFICE` vs `WEB`) | |
| `redeId` (UUID) | Nao | Frontend usa header `X-Rede-Identifier` em vez de campo no body |
| `redeIdentifier` | Nao (via header) | Frontend envia no header, nao no body |
| `identifierProvided` | Nao | Campo interno do backend, nao precisa ser enviado |

### D2. StorefrontThemeRequest

Ver secao C1 acima. Os schemas sao **completamente divergentes**.

### D3. ForgotPasswordRequestDTO

| Campo Backend | Usado pelo Frontend | Nota |
|---------------|-------------------|------|
| `email` | Nao | Frontend usa `identifier` |
| `identifier` | Sim | |
| `redeId` | Nao | |
| `redeIdentifier` | Nao (via header) | |
| `identifierProvided` | Nao | Campo interno |

---

## Recomendacoes Acionaveis

### Prioridade P0 (Critico - Funcionalidade quebrada)

1. **Corrigir schema StorefrontTheme** - O formulario de storefront nao salva nada. Opcoes:
   - (a) Atualizar o frontend para usar os campos do backend (`corPrimaria`, `titulo`, `redesSociais` map, etc.)
   - (b) Atualizar o backend para aceitar o formato do frontend
   - (c) Criar camada de traducao no frontend antes de enviar

2. **Remover ou desabilitar modulos fantasma** - Os modulos `billing`, `financial`, `whatsapp`, `agenda/aulas`, `crm/cadencias` chamam endpoints que nao existem. Opcoes:
   - (a) Se planejados para o futuro: adicionar feature flags para esconder as telas ate o backend existir
   - (b) Se abandonados: remover o codigo frontend

### Prioridade P1 (Importante - Erros pontuais)

3. **Corrigir paths errados:**
   - `matriculas/{id}/contrato/assinar` -> `matriculas/{id}/assinar-contrato`
   - `pagamentos/{id}/nfse` -> `pagamentos/{id}/emitir-nfse`
   - `grupos-musculares/{id}/toggle` -> usar PUT/DELETE
   - `treinos/{id}/atribuir` -> `treinos/templates/{id}/atribuir`

4. **Corrigir enum `channel`** no login: substituir `"BACKOFFICE"` por `"WEB"`

5. **Verificar endpoints de auth:**
   - `/api/v1/auth/first-access` - nao existe no OpenAPI (pode ser endpoint nao documentado ou planejado)
   - `/api/v1/auth/rede-contexto` - nao existe no OpenAPI

### Prioridade P2 (Melhorias)

6. **Implementar modulos backend nao consumidos** que sao relevantes para o painel:
   - Visitantes, Fidelizacao, Dunning, NFSe, Recepcao Aulas, Relatorios, NPS
   - BI (dashboard gerencial, inadimplencia, receita)

7. **Consolidar aliases CRM** - O backend tem 3 prefixos para prospects (`/academia/prospects`, `/crm/prospects`, `/prospects`). O frontend usa corretamente `/academia/prospects` e `/crm/prospects`, mas considerar simplificar.

8. **Remover codigo morto** nos API clients frontend que chamam endpoints inexistentes:
   - `src/lib/api/billing.ts` (inteiro)
   - `src/lib/api/financial.ts` (inteiro)
   - `src/lib/api/whatsapp.ts` (inteiro)
   - `src/lib/api/crm-cadencias.ts` (inteiro)
   - `src/lib/api/reservas.ts` (inteiro - todos paths sao fantasma)

---

## Apendice: Arquivos Frontend Auditados

| Arquivo | Paths API | Status |
|---------|-----------|--------|
| `src/lib/api/auth.ts` | 6 | 2 fantasma (`first-access`, `rede-contexto`) + 1 enum errado |
| `src/lib/api/billing.ts` | 5 | **100% fantasma** |
| `src/lib/api/financial.ts` | 18 | **100% fantasma** |
| `src/lib/api/whatsapp.ts` | 6 | **100% fantasma** |
| `src/lib/api/reservas.ts` | 6 | **100% fantasma** |
| `src/lib/api/crm-cadencias.ts` | 7 | **100% fantasma** |
| `src/lib/api/crm.ts` | ~25 | 5 fantasma (`pipeline-stages`, `cadencias`, `atividades`, `tarefas/{id}`) |
| `src/lib/api/pagamentos.ts` | 4 | 2 fantasma (path NFSe errado + lote) |
| `src/lib/api/matriculas.ts` | 6 | 1 fantasma (`contrato/assinar` path errado) |
| `src/lib/api/treinos.ts` | ~18 | 2 fantasma (`grupos-musculares toggle`, `treinos/{id}/atribuir`) |
| `src/lib/api/vendas.ts` | 3 | 1 fantasma (GET by id) |
| `src/lib/api/beneficios.ts` | 7 | 1 fantasma (`vouchers/validar`) |
| `src/lib/api/admin-financeiro.ts` | 5 | 4 fantasma (integracoes-operacionais, agregadores/transacoes) |
| `src/lib/api/storefront-theme.ts` | 2 | OK paths, mas **schema totalmente divergente** |
| `src/lib/api/admin-billing.ts` | 8 | OK |
| `src/lib/api/admin-config.ts` | 5 | OK |
| `src/lib/api/admin-compliance.ts` | 3 | OK |
| `src/lib/api/admin-gateways.ts` | 5 | OK |
| `src/lib/api/admin-leads.ts` | 5 | OK |
| `src/lib/api/admin-metrics.ts` | 4 | OK |
| `src/lib/api/admin-saas-metrics.ts` | 3 | OK |
| `src/lib/api/admin-search.ts` | 1 | OK |
| `src/lib/api/admin-seguranca-avancada.ts` | 6 | OK |
| `src/lib/api/admin-audit.ts` | 3 | OK |
| `src/lib/api/admin-bi.ts` | 4 | OK |
| `src/lib/api/administrativo.ts` | ~20 | OK |
| `src/lib/api/alunos.ts` | 8 | OK |
| `src/lib/api/backoffice.ts` | 8 | OK |
| `src/lib/api/backoffice-seguranca/*.ts` | 10 | OK |
| `src/lib/api/bot.ts` | 2 | OK |
| `src/lib/api/cartoes.ts` | 7 | OK |
| `src/lib/api/catraca.ts` | 5 | OK |
| `src/lib/api/comercial-catalogo.ts` | 12 | OK |
| `src/lib/api/conciliacao-bancaria.ts` | 4 | OK |
| `src/lib/api/contas-bancarias.ts` | 4 | OK |
| `src/lib/api/contas-receber.ts` | 5 | OK |
| `src/lib/api/contexto-unidades.ts` | 12 | OK |
| `src/lib/api/dashboard.ts` | 1 | OK |
| `src/lib/api/financeiro-gerencial.ts` | 8 | OK |
| `src/lib/api/formas-pagamento.ts` | 6 | OK |
| `src/lib/api/grade-mural.ts` | 1 | OK |
| `src/lib/api/importacao-evo.ts` | 6 | OK |
| `src/lib/api/maquininhas.ts` | 4 | OK |
| `src/lib/api/presencas.ts` | 1 | OK |
| `src/lib/api/rbac.ts` | 10 | OK |
| `src/lib/api/tipos-conta.ts` | 4 | OK |
