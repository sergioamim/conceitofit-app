# Validação de Compatibilidade OpenAPI x Frontend (mock -> API)

Data da validação: 2026-02-23

## Escopo validado
- Frontend contratos atuais:
  - `/Users/sergioamim/dev/pessoal/academia-app/src/lib/types.ts`
  - `/Users/sergioamim/dev/pessoal/academia-app/src/lib/mock/services.ts`
- OpenAPI backend:
  - `/Users/sergioamim/dev/pessoal/academia-java/modulo-app/src/main/resources/static/openapi.yaml`

## Veredito geral
`NÃO está 100% compatível` para migração completa do frontend.

Resumo objetivo:
- `services.ts`: 133 funções públicas
- OpenAPI: 15 paths
- A OpenAPI cobre parte do contexto de unidade, financeiro gerencial e mural, mas não cobre a maior parte do contrato usado pelas telas.

## Compatibilidades confirmadas (parcial)
1. Enums financeiros principais estão alinhados com `types.ts`:
- `CategoriaContaPagar`
- `GrupoDre`
- `RegimeContaPagar`
- `StatusContaPagar`
- `RecorrenciaContaPagar`
- `TerminoRecorrenciaContaPagar`
- `StatusRegraRecorrenciaContaPagar`
- `TipoFormaPagamento`
- `DiaSemana`

2. Filtros de DRE com `month/year/startDate/endDate` compatíveis com assinatura atual de `getDreGerencial`.

3. Contexto de unidade ativa existe e atende conceito multi-tenant básico (header de contexto + tenant opcional por query).

## Gaps críticos (bloqueiam migração sem quebra)
1. Cobertura insuficiente de contrato
- OpenAPI não cobre a maioria dos domínios usados pelas telas (CRM, clientes, vendas, planos, produtos, serviços, atividades administrativas etc.).
- Impacto: impossível trocar `services.ts` completo para API sem manter fallback mock.

2. Endpoint ausente para `updateContaPagar`
- Frontend possui `updateContaPagar` em `/src/lib/mock/services.ts`.
- OpenAPI não define `PUT/PATCH /api/v1/gerencial/financeiro/contas-pagar/{id}`.
- Impacto: perda de paridade funcional da camada atual.

3. Formas de pagamento ausentes na OpenAPI de migração
- Tela de contas a pagar depende de `listFormasPagamento` para baixa (`/src/app/(app)/gerencial/contas-a-pagar/page.tsx`).
- OpenAPI atual não expõe CRUD/lista de formas de pagamento.
- Impacto: baixa financeira sem fonte oficial de opções.

4. `CreateContaPagarRequest` não exige `tipoContaId`
- Frontend e regra de negócio tratam tipo de conta como obrigatório.
- OpenAPI permite criação sem `tipoContaId`.
- Impacto: divergência de regra + risco de dados inconsistentes para DRE.

5. OpenAPI 3.0 inválida no retorno `null` de criação de conta recorrente
- Em `/contas-pagar` POST foi usado `anyOf` com `type: 'null'`.
- Em OpenAPI 3.0.x, `type: null` não é válido para geradores padrão.
- Impacto: quebra de geração de client ou tipos inconsistentes.

6. Contrato de tenant/contexto incompleto para frontend atual
- `Tenant` no frontend inclui `groupId`, `branding`, `configuracoes` (tema/branding/impressão).
- `TenantDTO` da OpenAPI não inclui esses campos.
- Impacto: adapter precisa enriquecer resposta por outras chamadas ou perde dados já usados em UI.

7. Mural semanal: payload insuficiente para renderização completa atual sem consultas extras
- OpenAPI retorna `tenantId/week/days`.
- A UI do mural atual exibe nome da academia, unidade e logo.
- Sem dados de academia/unidade no payload, exige mais round-trips ou endpoint complementar.

## Gaps médios (não bloqueiam, mas exigem decisão)
1. Divergência de retorno em funções `void` do frontend vs retorno objeto na OpenAPI.
- Ex.: toggle/update/pagar/cancelar retornam entidade no backend; frontend usa `Promise<void>`.
- Pode ser absorvido no adapter descartando retorno.

2. Estratégia de contexto mista (header `X-Context-Id` + `tenantId` query opcional).
- Funciona, mas precisa padronização operacional para evitar drift entre abas/sessões.

## Plano de migração incremental (sem refactor de telas)
1. Fase A - Infra de adapter
- Criar `src/lib/api/client.ts` (base URL, headers, erro padronizado).
- Criar `src/lib/api/adapters/services-api.ts` com mesma assinatura de `services.ts`.
- Backend real como padrão único de execução.

2. Fase B - Contexto + financeiro gerencial (primeiro domínio)
- Migrar no adapter:
  - `getCurrentTenant`, `setCurrentTenant`, `listTenants` (com mapeamento do contexto)
  - tipos de conta
  - contas a pagar
  - regras de recorrência
  - DRE
- Backend precisa antes fechar os gaps críticos 2, 3, 4, 5.

3. Fase C - Mural semanal
- Criar método de API para mural (sem mudar página).
- Backend deve incluir metadados mínimos de branding/unidade no payload ou expor endpoint auxiliar de contexto.

4. Fase D - Demais domínios
- Migrar em blocos: CRM -> Clientes/Matrículas/Pagamentos -> Catálogo/Vendas -> Administrativo.
- Sempre mantendo assinatura pública do `services.ts` para não tocar telas.

5. Fase E - Desligamento do mock
- Quando cobertura de endpoints atingir 100% dos métodos usados em produção, desligar fallback localStorage.

## Checklist mínimo para declarar "pronto para fase financeira"
1. Adicionar endpoint de atualização de conta a pagar (`updateContaPagar`).
2. Adicionar endpoints de formas de pagamento usados na baixa.
3. Tornar `tipoContaId` obrigatório na criação de conta a pagar (ou regra equivalente no backend com erro explícito).
4. Corrigir schema OpenAPI para retorno nullable compatível com 3.0.
5. Incluir campos de tenant necessários para UI (ou endpoint complementar mapeável pelo adapter).
