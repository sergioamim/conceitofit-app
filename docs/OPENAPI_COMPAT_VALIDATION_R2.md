# Validação OpenAPI x Frontend (Rodada 2)

Data: 2026-02-23

## Resultado executivo
- Evolução confirmada no backend: `openapi.yaml` passou de 15 para 17 paths.
- Itens críticos da fase financeira foram majoritariamente resolvidos.
- Ainda **não está 100% compatível** para migração completa de `services.ts` (133 funções) para API real.

## Correções confirmadas no backend
1. Endpoint de atualização de conta a pagar foi adicionado:
- `PUT /api/v1/gerencial/financeiro/contas-pagar/{id}`

2. Endpoint de formas de pagamento foi adicionado:
- `GET /api/v1/gerencial/financeiro/formas-pagamento`

3. `tipoContaId` em criação de conta a pagar ficou obrigatório:
- `CreateContaPagarRequest.required` inclui `tipoContaId`

4. Nullable da criação de conta foi ajustado para OpenAPI 3.0:
- `POST /contas-pagar` response com schema nullable sem `type: null`

5. `TenantDTO` agora contempla campos usados no frontend:
- `groupId`, `branding`, `configuracoes`, `endereco`

6. Mural ganhou metadados úteis para UI:
- `GradeMuralResponse` inclui `tenant`, `academia`, `horarioDia`

## Pendências que ainda impedem “100% compatível”
1. Cobertura de domínios ainda parcial
- `services.ts`: 133 funções públicas
- OpenAPI: 17 paths
- Faltam contratos para grande parte de CRM, clientes, matrículas, pagamentos comerciais, vendas, planos, serviços, produtos, vouchers, convênios, funcionários, salas, atividades e demais módulos administrativos.

2. Formas de pagamento sem paridade total com o frontend
- Frontend possui CRUD completo (`list/create/update/toggle/delete`) em `services.ts`.
- OpenAPI expõe apenas listagem (`GET`).
- Para migração de telas administrativas de formas de pagamento, ainda faltam endpoints.

3. Mapeamento de assinatura funcional ainda não é 1:1 no conjunto total
- Mesmo com avanços no financeiro, a maioria dos métodos do `services.ts` não possui endpoint correspondente.
- A migração integral exige contrato para todos os métodos usados em produção.

## Conclusão técnica
- Para **fase financeira** (contas a pagar + DRE + contexto + mural): já está próximo de viabilizar adapter real.
- Para **migração global do frontend**: ainda não.

---

## Texto curto para revalidar no backend (copiar e colar)

Precisamos fechar a compatibilidade total com o frontend atual sem refatorar telas.

Contexto a usar:
1) `/Users/sergioamim/dev/pessoal/academia-app/src/lib/types.ts`
2) `/Users/sergioamim/dev/pessoal/academia-app/src/lib/mock/services.ts`
3) `/Users/sergioamim/dev/pessoal/academia-app/docs/OPENAPI_COMPAT_VALIDATION_R2.md`
4) `/Users/sergioamim/dev/pessoal/academia-java/modulo-app/src/main/resources/static/openapi.yaml`

Status: financeiro evoluiu e vários gaps críticos foram resolvidos, mas ainda não estamos 100% compatíveis.

Ajustes solicitados agora:
1. Completar OpenAPI para cobrir os métodos faltantes de `services.ts` (prioridade: CRM -> clientes/matrículas/pagamentos -> vendas/catálogo -> administrativo).
2. Expor CRUD completo de formas de pagamento (não só GET), mantendo enum `TipoFormaPagamento` case-sensitive.
3. Garantir paridade de nomes/enums/estruturas com `types.ts`.
4. Entregar OpenAPI atualizada + tabela de mapeamento `services.ts -> endpoint` marcando 100% cobertura.

Critério de aceite:
- Cada função pública usada em produção no `services.ts` deve ter endpoint equivalente e payload compatível.
