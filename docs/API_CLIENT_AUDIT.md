# Auditoria de clientes HTTP em `src/lib/api`

Data: 2026-03-10

## Escopo e fonte de verdade

- Frontend auditado: `src/lib/api/*.ts`
- Backend comparado: `/Users/sergioamim/dev/pessoal/academia-java/modulo-app/src/main/resources/static/openapi.yaml`
- Comando reexecutavel: `npm run audit:api`

## Resumo executivo

- O diretório tem `24` arquivos TypeScript, com `169` services assíncronos exportados.
- Existem `30` contratos locais `ApiRequest`/`ApiResponse` e `29` helpers `normalize*`.
- O script conseguiu auditar `168` operações com path estático; `163` batem com `method + path` da OpenAPI atual e `5` estão fora do contrato documentado.
- Há `1` operação com path sobrescrevível por ambiente: `listarAcessosCatracaApi` em `src/lib/api/catraca.ts` usa `NEXT_PUBLIC_CATRACA_ACESSOS_PATH`.
- Existem `65` operações que batem com a OpenAPI, mas não propagam `tenantId` mesmo quando o spec declara `TenantIdQuery`.
- `http.ts` normaliza `tenantId` apenas quando o caller já enviou o campo. Ele não injeta `tenantId` ausente, então esses gaps continuam reais mesmo com o wrapper central.

## Camada compartilhada

- `src/lib/api/http.ts` já centraliza `Authorization`, refresh token, auto-login de desenvolvimento, `X-Context-Id`, proxy `/backend` e `ApiRequestError`.
- `src/lib/api/session.ts` concentra persistência de token, refresh token, tenant ativo, tenants disponíveis, tenant preferido e sessão mock.
- O shape de erro local está alinhado com o backend (`timestamp`, `status`, `error`, `message`, `path`, `fieldErrors`, `responseBody`).
- O ponto fraco atual do wrapper central é multi-tenant: ele corrige um `tenantId` inválido para um tenant permitido da sessão, mas não força a presença do query param quando o contrato exige.

## Cobertura por domínio

| Domínio | Operações OpenAPI | Envelopadas em `src/lib/api` | Faltando wrapper |
| --- | ---: | ---: | ---: |
| `auth-rbac` | 19 | 16 | 3 |
| `contexto-academia` | 13 | 13 | 0 |
| `financeiro` | 72 | 39 | 33 |
| `crm` | 19 | 14 | 5 |
| `comercial` | 48 | 27 | 21 |
| `treinos` | 22 | 8 | 14 |
| `administrativo` | 36 | 36 | 0 |
| `integracoes` | 29 | 7 | 22 |
| `app-cliente-grade-pagamentos` | 26 | 0 | 26 |

## Divergências críticas encontradas

### 1. Endpoints usados no frontend, mas ausentes na OpenAPI atual

- `src/lib/api/contexto-unidades.ts`: `PUT /api/v1/context/horarios-funcionamento`
- `src/lib/api/dashboard.ts`: fallback `GET /api/v1/academia/dashboard`
- `src/lib/api/pagamentos.ts`: `POST /api/v1/comercial/pagamentos/{id}/emitir-nfse`
- `src/lib/api/catraca.ts`: `GET /api/v1/gerencial/catraca/acessos/dashboard`
- `src/lib/api/rbac.ts`: `GET /api/v1/auth/users`

### 2. Hotspots de `tenantId` ausente

- `src/lib/api/administrativo.ts`: `25` operações
- `src/lib/api/comercial-catalogo.ts`: `17` operações
- `src/lib/api/beneficios.ts`: `10` operações
- `src/lib/api/formas-pagamento.ts`: `5` operações
- `src/lib/api/tipos-conta.ts`: `4` operações
- `src/lib/api/contexto-unidades.ts`: `3` operações (`/api/v1/academia`)
- `src/lib/api/dashboard.ts`: `1` operação

### 3. Módulos com maior risco de drift de contrato

- Wrappers finos, sem contratos locais `ApiRequest`/`ApiResponse`: `administrativo.ts`, `beneficios.ts`, `bot.ts`, `comercial-catalogo.ts`, `crm.ts`, `tipos-conta.ts`
- Wrappers mais robustos, com adaptação explícita: `auth.ts`, `contexto-unidades.ts`, `financeiro-gerencial.ts`, `contas-receber.ts`, `contas-bancarias.ts`, `formas-pagamento.ts`, `maquininhas.ts`, `pagamentos.ts`, `dashboard.ts`, `rbac.ts`, `treinos.ts`, `vendas.ts`, `catraca.ts`

## Cobertura OpenAPI ainda sem client correspondente

- `auth-rbac`: `forgot-password`, `reset-password`, `authorize/check`
- `crm`: todo o bloco de `campanhas`
- `comercial`: `matriculas`, `anamnese`, suspensão de aluno, bandeiras de cartão e cartões do aluno
- `financeiro`: `contas-pagar/visao-completa`, recorrência de contas a receber, arquivos de conciliação, categorias, grupos DRE, naturezas financeiras, convênios e descontos do financeiro
- `treinos`: grupos musculares, exclusão/status/renovação/clonagem de treino, CRUD de itens e dashboard
- `integracoes`: credenciais, ingestão/pull/ack/release da catraca, upload/importação EVO e leitura de jobs/rejeições

## Prioridade recomendada para as próximas subtarefas

1. `1.2` deve começar por `http.ts`: decidir se `tenantId` será obrigatório no caller ou injetado automaticamente quando o spec exigir.
2. `1.3` deve endurecer contratos nos wrappers finos que hoje sustentam telas já ativas: `administrativo.ts`, `comercial-catalogo.ts`, `beneficios.ts`, `tipos-conta.ts`, `crm.ts`.
3. Antes de qualquer geração automática de client, o backend precisa corrigir o `openapi.yaml` atual.

## Observação sobre o spec do backend

- O `openapi.yaml` atual não passa em parser YAML padrão. `ruby`/`psych` falha em `line 4583 column 18`, no bloco de `PUT /api/v1/exercicios/{id}`.
- Por isso o script de auditoria faz parsing textual de `paths`, `methods` e presença de `TenantIdQuery`, sem depender de geração OpenAPI neste estágio.
