# Financeiro Gerencial (Contas a Pagar/Receber, DRE e Conciliação)

## Escopo implementado agora (frontend)
- Menu Gerencial:
  - `Contas a Receber` (já existente)
  - `Contas a Pagar` (novo)
  - `DRE` (novo)
- `Contas a Pagar`:
  - cadastro de lançamento financeiro
  - filtros por período, status, categoria e busca textual
  - baixa de pagamento
  - cancelamento de conta pendente
- `DRE`:
  - visão mensal ou período customizado
  - estrutura gerencial do resultado
  - indicadores de ticket, inadimplência e saldos em aberto
  - despesas por categoria

## Modelo sugerido (backend)

### Contas a pagar
- Entidade: `conta_pagar`
- Campos principais:
  - `id`, `tenant_id`
  - `fornecedor`, `documento_fornecedor`
  - `descricao`, `categoria`, `centro_custo`
  - `regime` (`FIXA` | `AVULSA`)
  - `competencia`, `data_emissao`, `data_vencimento`, `data_pagamento`
  - `valor_original`, `desconto`, `juros_multa`, `valor_pago`
  - `forma_pagamento`, `status` (`PENDENTE` | `PAGA` | `VENCIDA` | `CANCELADA`)
  - `observacoes`, `data_criacao`, `data_atualizacao`

### Contas a receber
- Já deriva de `pagamentos`, porém recomenda-se uma visão unificada de títulos:
  - `tipo_origem` (`MATRICULA`, `VENDA`, `SERVICO`, `MANUAL`, ...)
  - `origem_id` para rastreabilidade
  - baixa parcial/total

### DRE
- Estrutura operacional:
  - Receita bruta
  - (-) Deduções
  - Receita líquida
  - (-) Custos variáveis
  - Margem de contribuição
  - (-) Despesas operacionais
  - EBITDA
  - Resultado líquido

## Regras de cálculo recomendadas
- Vencimento automático:
  - `PENDENTE` com `data_vencimento < hoje` vira `VENCIDA`.
- Valor líquido da conta a pagar:
  - `valor_original - desconto + juros_multa`.
- DRE realizado:
  - Receitas: somente recebimentos efetivamente pagos no período.
  - Despesas: somente contas a pagar efetivamente pagas no período.
- DRE projetado (próxima etapa):
  - incluir pendências a vencer e cenários.

## Próximas evoluções (financeiro completo)
1. Plano de contas e centros de custo hierárquicos.
2. Rateio de despesas por unidade/departamento.
3. Orçado x realizado por mês.
4. Fluxo de caixa diário/semanal/mensal.
5. Aprovação de pagamentos (workflow por perfil).
6. Anexos fiscais (NFe, boletos, comprovantes).

## Conciliação bancária (futuro)
### Fase 1
- Importação manual de extrato (`OFX`, `CNAB`, `CSV`).
- Motor de matching:
  - por valor, data, documento, favorecido, referência.
- Estado de conciliação:
  - `PENDENTE`, `CONCILIADO`, `DIVERGENTE`, `IGNORADO`.

### Fase 2
- Integração via API bancária/Open Finance:
  - sincronização de contas e movimentos
  - webhook/polling de liquidações
  - confirmação automática com regras de confiança

### Fase 3
- Inteligência de conciliação:
  - sugestões automáticas de classificação contábil
  - alertas de anomalias e divergências recorrentes

## Multi-unidade (Academia x Unidade)
- Todas as contas são por `tenantId` (unidade).
- Dashboards gerenciais podem ter:
  - visão da unidade ativa (padrão)
  - visão consolidada da academia (etapa posterior)
