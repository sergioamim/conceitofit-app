# Convênios — Phase 4: scoping por unidade + desconto progressivo — PRD

**Status:** proposto (2026-04-24) — implementação pendente.
**Autor:** CEO em sessão de 2026-04-24, como extensão natural após
Phase 3 (vigência + acumulação com voucher).
**Depende de:** Phase 3 entregue (vigência + `permiteVoucherAcumulado`
consumido no motor).
**Prioridade:** média-baixa. Destrava 2 cenários recorrentes hoje
impossíveis de modelar.

---

## Contexto

Hoje cada convênio vive atrelado a um **`tenant_id` único** (uma
unidade/filial). Isso significa:

- Rede com 10 unidades precisa cadastrar o mesmo convênio 10 vezes.
- Mudança (ex.: subir desconto de 10% para 15%) exige 10 edits manuais.
- Relatório consolidado por rede precisa agregar IDs diferentes.

Além disso, o desconto é **uniforme** ao longo do tempo do contrato:
não há como modelar "10% nos primeiros 3 meses, 5% depois" — cenário
comum em promoções de retenção e em acordos corporativos escalonados.

## Problemas

### 1. Scoping por unidade da rede

Cenários reais:

- "Rede ConceitoFit: convênio nacional com a Unimed vale em **todas**
  as 10 unidades."
- "Unidade Copacabana tem convênio local com o hotel Fasano — só vale
  aqui."
- "3 unidades da zona sul compartilham convênio com escola X — vale
  nessas 3, mas não na Barra."

Hoje não há como diferenciar "convênio local" de "convênio de rede".

### 2. Desconto progressivo / escalonado

Cenários reais:

- "Promoção retenção: 20% nos primeiros 3 meses, 10% nos 6 meses
  seguintes, depois 5% fixo."
- "Convênio corporativo degradê: 15% ano 1, 10% ano 2, 5% ano 3."
- "Black Friday: 30% nos 2 primeiros meses, 0% depois (promoção de
  adesão)."

Hoje o desconto é único; não há conceito de faixas.

## Objetivo

Entregar 2 extensões independentes:

1. **Scoping por unidade**: convênio pode ter escopo `UNIDADE` (único
   tenant) ou `GRUPO` (rede inteira, via `academia_id`) ou
   `UNIDADES_ESPECIFICAS` (lista explícita de tenants).
2. **Desconto progressivo**: convênio pode definir **faixas temporais**
   (`[mesInicio, mesFim, tipo, valor]`) em vez de desconto único.

Ambas são aditivas e retrocompatíveis: convênios existentes continuam
com escopo implícito `UNIDADE` e desconto sem faixas.

## Scoping por unidade — modelagem

### Novo enum

```ts
type EscopoConvenio = "UNIDADE" | "UNIDADES_ESPECIFICAS" | "GRUPO";
```

### Schema — `convenio`

| Coluna | Tipo | Observação |
|---|---|---|
| `escopo` | `varchar(24)` NOT NULL default `'UNIDADE'` | Novo |
| `academia_id` | `uuid` nullable | Preenchido quando `escopo='GRUPO'` (FK para `academia`) |

### Tabela auxiliar `convenio_unidades`

Quando `escopo='UNIDADES_ESPECIFICAS'`, lista explícita:

```sql
CREATE TABLE convenio_unidades (
    convenio_id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    CONSTRAINT convenio_unidades_pk PRIMARY KEY (convenio_id, tenant_id),
    CONSTRAINT convenio_unidades_convenio_fk FOREIGN KEY (convenio_id)
        REFERENCES convenio(id) ON DELETE CASCADE
);
```

### Regras de consistência (CHECK + validação de serviço)

- `escopo='UNIDADE'` → `tenant_id` obrigatório, `academia_id` NULL, sem
  linhas em `convenio_unidades`.
- `escopo='GRUPO'` → `academia_id` obrigatório, `tenant_id` pode ser
  qualquer da rede (mas a busca usa `academia_id`), sem linhas em
  `convenio_unidades`.
- `escopo='UNIDADES_ESPECIFICAS'` → ≥1 linha em `convenio_unidades`.

### Impacto em queries

Hoje `ConvenioRepository.findByTenantIdAndAtivoTrue...` filtra só por
`tenant_id`. Precisa virar uma query mais rica:

```sql
SELECT * FROM convenio c
WHERE c.ativo = true
  AND (
    (c.escopo = 'UNIDADE'              AND c.tenant_id = :tenantId)
    OR
    (c.escopo = 'GRUPO'                AND c.academia_id = :academiaId)
    OR
    (c.escopo = 'UNIDADES_ESPECIFICAS' AND EXISTS (
       SELECT 1 FROM convenio_unidades cu
       WHERE cu.convenio_id = c.id AND cu.tenant_id = :tenantId
    ))
  );
```

Todo endpoint que lista convênios passa a precisar do `academia_id` do
tenant — derivável via `Tenant.getAcademiaId()`.

### Governança — quem pode criar cada escopo

Seguindo o padrão do PRD de crédito de dias:

| Escopo | Papel mínimo |
|---|---|
| `UNIDADE` | `ADMIN_UNIDADE` |
| `UNIDADES_ESPECIFICAS` | `ADMIN_REDE` (novo) ou delegado |
| `GRUPO` | `SUPER_USER` da rede |

Backend valida no endpoint. FE guia UX.

## Desconto progressivo — modelagem

### Modelo: faixas temporais

Cada convênio ganha uma lista opcional de `faixas`. Se lista vazia,
cai no modelo atual (desconto único de `descontoPercentual` ou
`descontoValor`).

```ts
interface FaixaDescontoConvenio {
  mesInicio: number;      // 1-based, inclusivo (ex.: 1 = primeiro mês)
  mesFim: number | null;  // null = "a partir desse mês, sem fim"
  tipoDesconto: "PERCENTUAL" | "VALOR_FIXO";
  valor: number;          // percent (0..100) ou R$
}
```

### Tabela

```sql
CREATE TABLE convenio_faixa_desconto (
    id uuid PRIMARY KEY,
    convenio_id uuid NOT NULL REFERENCES convenio(id) ON DELETE CASCADE,
    mes_inicio smallint NOT NULL CHECK (mes_inicio >= 1),
    mes_fim smallint NULL CHECK (mes_fim IS NULL OR mes_fim >= mes_inicio),
    tipo_desconto varchar(16) NOT NULL
        CHECK (tipo_desconto IN ('PERCENTUAL','VALOR_FIXO')),
    valor numeric(12,2) NOT NULL CHECK (valor >= 0),
    ordem smallint NOT NULL DEFAULT 0
);

CREATE INDEX convenio_faixa_desconto_convenio_idx
    ON convenio_faixa_desconto (convenio_id, ordem);
```

### Regras

- As faixas de um convênio **não podem sobrepor** (exceto a última com
  `mes_fim=NULL`).
- Faixas ordenadas por `mes_inicio`; UI exibe em ordem natural.
- Se a venda pede um mês > maior `mes_fim`, cai na faixa `mes_fim=NULL`
  (a "cauda"). Se não houver cauda, desconto é zero após a última faixa.

### Cálculo no motor

O `planoDryRun` hoje calcula o desconto **de um mês só**. Com faixas,
o cálculo vira "o que é cobrado neste ciclo específico":

```ts
function descontoConvenioNoCiclo(
  plano: Plano,
  convenio: Convenio,
  mesContrato: number,       // 1, 2, 3... (qual mês do contrato está sendo cobrado)
  formaPagamento?: TipoFormaPagamento,
): number {
  const faixa = encontrarFaixa(convenio.faixas, mesContrato);
  if (!faixa) return 0;
  // ... mesma lógica tipo/valor da Phase 2, mas usando faixa em vez do
  // descontoPercentual/descontoValor direto
}
```

**Complexidade**: impacta contratos recorrentes (mensal, anual). Cada
parcela gerada no backend precisa saber qual `mesContrato` está sendo
cobrada para calcular o desconto correto. Isso **muda a integração com
o job de renovação** (`RenovacaoPlanoJob`) e com a geração de
`Pagamento`s antecipados.

### Alternativa simplificada (MVP)

Se o escopo completo for pesado demais, uma versão MVP válida:

- Máximo de 3 faixas por convênio.
- Sem cauda `mes_fim=NULL` — depois da última faixa, desconto é 0.
- Aplicado apenas em planos **mensais recorrentes**; planos anuais
  mantêm desconto único (usa `descontoPercentual` herdado).

MVP destrava ~70% dos casos reais sem tocar em jobs de renovação anual.

## UX — telas

### Modal (scoping)

Nova seção "Escopo da rede" com radio cards (`UNIDADE`/`GRUPO`/`UNIDADES_ESPECIFICAS`). Quando `UNIDADES_ESPECIFICAS`, abre grade de unidades ativas da rede pra seleção (padrão Phase 2 para planos).

### Modal (progressivo)

Nova seção "Desconto progressivo" com toggle "Desconto único / Faixas".
Quando "Faixas", abre editor dinâmico:

```
Faixa 1: do mês  [1]  até o mês  [3]   [15 %]   [x]
Faixa 2: do mês  [4]  até o mês  [6]   [10 %]   [x]
Faixa 3: do mês  [7]  em diante         [5 %]    [x]
                                                 [+ Adicionar faixa]
```

Com preview abaixo: "Em R$ 150, cliente pagará R$ 127,50 nos meses 1–3,
R$ 135 nos meses 4–6, R$ 142,50 daí em diante."

### Listagem

Coluna nova "Escopo": `Local / Rede / N unidades`. Se convênio tem
faixas, badge "Progressivo" na coluna Desconto.

## Integração com Phases anteriores

Esta Phase 4 **compõe** com Phases 2/3. Todos os filtros coexistem:

1. Convênio ativo? (Phase 1)
2. Vigente hoje? (Phase 3)
3. Plano escolhido está em `planoIds`? (Phase 1)
4. Forma de pagamento permitida? (Phase 2)
5. Cliente aplicou voucher E `permiteVoucherAcumulado=false`? (Phase 3)
6. **Escopo cobre esta unidade?** (Phase 4 — filtro novo)
7. **Qual faixa aplica no mês deste ciclo?** (Phase 4 — cálculo novo)

## Plano de corte (ordem sugerida)

- **Wave A — Scoping backend**: migration + entity + endpoint de listagem
  adaptado + repository novo.
- **Wave B — Scoping FE**: modal + filtro em `useCommercialFlow`.
- **Wave C — Progressivo backend (MVP 3 faixas)**: migration + entity +
  cálculo por mês (parametrizado) + testes de `RenovacaoPlanoJob`.
- **Wave D — Progressivo FE**: editor de faixas dinâmico + preview +
  listagem com badge.
- **Wave E — Governança**: roles `ADMIN_REDE` + validação de escopo no
  backend.

Wave A-B entrega scoping sem tocar em motor. Waves C-D são o grande
risco (mudam cálculo em produção).

## Fora de escopo desta Phase 4

- Faixas baseadas em **valor acumulado** ("desconto de 5% acima de
  R$ 5000 comprados"). Outro PRD se pedirem.
- Scoping hierárquico de redes aninhadas. Hoje a modelagem é "uma
  rede tem N unidades" — se vier "rede X com sub-redes", refactor
  maior que escopo não cobre.
- Importação em massa de convênios com escopo via CSV.

## Testes críticos

- **Scoping**: convênio `GRUPO` aparece nas 10 unidades da rede;
  convênio `UNIDADE` só na dona; `UNIDADES_ESPECIFICAS` só nas
  marcadas.
- **Progressivo**: 3ª mensalidade de um plano com faixa 1-3 aplica 15%;
  4ª mensalidade aplica 10%; 7ª em diante aplica 5%.
- **Composição**: convênio `GRUPO`+`VALOR_FIXO`+vigência+restrito a PIX
  funciona todas as regras somadas, zerando quando qualquer uma falha.
- **Retrocompat**: convênio existente (sem escopo, sem faixas)
  continua idêntico ao Phase 3.

## Métricas pós-release

- % de convênios criados com cada escopo (`UNIDADE` vs `GRUPO` vs específicas).
- % de convênios com faixas.
- Distribuição de número de faixas (1, 2, 3+).
- Churn após fim da primeira faixa (onde desconto cai) — sinal de
  "desconto âncora" bem desenhado vs. cliente que cancela quando
  preço sobe.
