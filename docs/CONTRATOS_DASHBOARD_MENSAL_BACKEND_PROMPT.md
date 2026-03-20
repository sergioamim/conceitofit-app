# Prompt para backend: endpoint de dashboard mensal de contratos

Implemente um endpoint backend que atenda integralmente a tela de contratos do frontend em `/matriculas`, removendo a necessidade de o frontend carregar uma lista grande e derivar os agregados localmente.

## Objetivo

Entregar um endpoint com filtro obrigatório por mês (`YYYY-MM`) que devolva:

- resumo executivo do mês
- agrupamento da carteira ativa por plano
- lista paginada dos contratos mais recentes do mês
- metadados suficientes para paginação e cobertura do recorte

O comportamento esperado do frontend é:

- por padrão selecionar o mês corrente
- permitir trocar o mês manualmente
- renderizar KPIs do mês selecionado
- exibir gráfico em pizza da carteira ativa por plano no mês selecionado
- listar os últimos contratos do mês selecionado, do mais recente para o mais antigo

## Endpoint proposto

`GET /api/comercial/matriculas/dashboard-mensal?tenantId={tenantId}&mes=YYYY-MM&page=0&size=20`

Se o projeto já usar `X-Context-Id` ou contexto ativo por header para tenancy, manter o padrão existente e não duplicar scoping de forma incoerente.

## Requisitos funcionais

1. O parâmetro `mes` é obrigatório no formato `YYYY-MM`.
2. O recorte mensal deve considerar como data de referência:
   - `dataCriacao`, quando existir
   - fallback para `dataInicio`, quando `dataCriacao` estiver ausente
3. A lista de contratos deve vir ordenada do mais recente para o mais antigo usando essa mesma data de referência.
4. Os indicadores superiores devem ser calculados sobre todo o recorte do mês, não apenas sobre a página atual.
5. O agrupamento da pizza deve considerar apenas contratos ativos no mês.
6. O agrupamento deve consolidar por plano e devolver os principais grupos já ordenados por quantidade descrescente.
7. O backend deve devolver paginação da lista do mês, sem obrigar o frontend a carregar 200 registros para montar a tela.
8. O endpoint deve responder vazio, mas válido, quando não houver contratos no mês selecionado.

## Resposta esperada

```json
{
  "mes": "2026-03",
  "resumo": {
    "totalContratos": 48,
    "contratosAtivos": 31,
    "percentualAtivos": 64.58,
    "receitaContratada": 12490.0,
    "ticketMedio": 260.21,
    "pendentesAssinatura": 6,
    "insight": "6 contrato(s) aguardam assinatura neste mes."
  },
  "carteiraAtivaPorPlano": [
    {
      "planoId": "plano-black",
      "planoNome": "Black",
      "quantidade": 18,
      "valor": 5400.0,
      "percentual": 58.06
    },
    {
      "planoId": "plano-fit",
      "planoNome": "Fit",
      "quantidade": 9,
      "valor": 1710.0,
      "percentual": 29.03
    }
  ],
  "contratos": {
    "items": [
      {
        "id": "mat-1",
        "aluno": {
          "id": "aluno-1",
          "nome": "Ana"
        },
        "plano": {
          "id": "plano-black",
          "nome": "Black"
        },
        "dataCriacao": "2026-03-18T14:30:00",
        "dataInicio": "2026-03-18",
        "dataFim": "2027-03-18",
        "status": "ATIVA",
        "contratoStatus": "ASSINADO",
        "formaPagamento": "PIX",
        "valorPago": 299.9,
        "pagamento": {
          "status": "PAGO",
          "formaPagamento": "PIX",
          "valorFinal": 299.9
        }
      }
    ],
    "page": 0,
    "size": 20,
    "totalItems": 48,
    "totalPages": 3
  }
}
```

## Regras de cálculo

- `totalContratos`: total de contratos no mês filtrado
- `contratosAtivos`: quantidade com status `ATIVA`
- `percentualAtivos`: `contratosAtivos / totalContratos * 100`
- `receitaContratada`: soma de `pagamento.valorFinal` quando existir; fallback para `valorPago`
- `ticketMedio`: `receitaContratada / totalContratos`
- `pendentesAssinatura`: quantidade com `contratoStatus = PENDENTE_ASSINATURA`
- `insight`: o backend já pode devolver um texto pronto para reduzir duplicação de regra no frontend

## Regras de agrupamento da pizza

- considerar somente contratos ativos do mês
- agrupar por plano
- ordenar por quantidade descrescente; desempate por valor descrescente
- devolver percentual já calculado sobre a base de contratos ativos
- se fizer sentido para o produto, o backend pode opcionalmente devolver um grupo `Outros` quando existirem muitos planos, mas isso precisa ser explícito no contrato

## Contrato e compatibilidade

- manter os campos hoje usados pelo frontend para badge de contrato, badge de fluxo, aluno, plano, pagamento e ações de renovação/cancelamento
- não remover campos do contrato individual que a listagem já consome
- se já existir endpoint paginado de matrículas, este novo endpoint pode reaproveitar o assembler/mapper, mas precisa devolver também o bloco agregado do dashboard

## Erros e validações

- `400` para `mes` ausente ou inválido
- `403` se o usuário não tiver acesso ao tenant/contexto informado
- `200` com arrays vazios e totais zero quando não houver contratos para o mês

## Performance

- evitar carregar todos os contratos em memória no backend para depois paginar
- calcular agregados do mês por query otimizada
- paginar a lista de contratos do mês no banco
- garantir índice adequado para tenant + data de referência + status quando aplicável

## Testes esperados

1. teste de contrato do endpoint validando shape completo da resposta
2. teste cobrindo filtro por mês `YYYY-MM`
3. teste cobrindo ordenação decrescente por data de referência
4. teste cobrindo cálculo de resumo executivo
5. teste cobrindo agrupamento da carteira ativa por plano
6. teste cobrindo mês vazio
7. teste cobrindo fallback para `dataInicio` quando `dataCriacao` estiver ausente

## Observações de integração

- o frontend já foi preparado para selecionar mês manualmente, com padrão no mês corrente
- idealmente este endpoint deve substituir a composição local hoje feita em `src/lib/comercial/matriculas-insights.ts`
- se necessário, pode haver uma primeira versão mantendo o frontend híbrido, mas o alvo final é a tela depender de um único endpoint agregado por mês
