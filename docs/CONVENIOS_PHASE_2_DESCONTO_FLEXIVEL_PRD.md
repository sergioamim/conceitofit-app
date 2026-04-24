# Convênios — Phase 2: desconto flexível + restrição de pagamento — PRD

**Status:** proposto (2026-04-24) — implementação pendente.
**Autor:** refinamento do CEO em sessão de 2026-04-24.
**Depende de:** Phase 1 já entregue (FE reformado em `convenio-modal.tsx`).
**Prioridade:** média. Destrava casos de negócio reais hoje contornados
com voucher ou "acerto na mão".

---

## Contexto

A **Phase 1** (2026-04-24) entregou só o redesign do modal:

- 3 seções visuais (Identificação / Regra de desconto / Escopo)
- Switch "Disponível nas vendas" (era checkbox com label enganosa)
- Preview inline do cálculo de desconto
- Radio "Todos os planos ativos" / "Planos específicos"
- Grade lista apenas planos **ativos** (antes listava todos)
- Textarea em observações, asterisco em campos obrigatórios
- Padrão `mode: "onTouched"` + watch manual dos required

A Phase 1 mantém o modelo de dados **inalterado**. Esta Phase 2 expande
o modelo para cobrir 2 pedidos explícitos do CEO que exigem mudança de
schema + backend.

## Problemas

### 1. Desconto sempre percentual

Hoje `Convenio.descontoPercentual: number` é o único tipo. Cenários
reais que a gestão pede em voz alta:

- "Convênio Empresa XYZ: **R$ 30 de desconto fixo** por mensalidade."
- "Parceria hospital: **20% de desconto**."

Operadores contornam desconto fixo criando voucher, mas voucher tem UX
diferente (código, uso limitado) e não é o mesmo conceito de convênio
contínuo.

### 2. Desconto vale em qualquer forma de pagamento

Hoje quando o convênio está ativo, ele se aplica em qualquer forma de
pagamento (PIX, cartão, boleto, recorrente). Cenários reais:

- "Esse desconto só vale se pagar **no PIX** (pra mim fechar a conta)."
- "Convênio da matriz só no **débito automático recorrente**."
- "Desconto pra quem paga **em dinheiro ou PIX** (corta taxa
  maquininha)."

Hoje: gerente cadastra 15% e o cliente usa cartão crédito parcelado —
adeus margem.

## Objetivo

Estender o cadastro de convênio pra que o operador possa:

1. Escolher entre **desconto percentual** (0–100%) ou **valor fixo**
   em reais.
2. Opcionalmente, **restringir a 1 ou mais formas de pagamento** que
   liberam o desconto.

Ambos refletem no motor de venda: se a forma de pagamento escolhida no
checkout não está na lista permitida, o convênio some (ou é recusado
com motivo visível).

## Modelo de dados

### Tabela `convenio` — colunas novas

| Coluna | Tipo | Observação |
|---|---|---|
| `tipo_desconto` | `varchar(16)` NOT NULL default `'PERCENTUAL'` | `PERCENTUAL` \| `VALOR_FIXO` |
| `desconto_valor` | `numeric(12,2)` nullable | preenchido só quando `tipo_desconto='VALOR_FIXO'` |
| `formas_pagamento_permitidas` | `text[]` nullable | `NULL` ou `{}` = todas; array com valores = restrito |

Campo existente `desconto_percentual` continua, mas passa a fazer
sentido apenas quando `tipo_desconto='PERCENTUAL'`.

### Migration (exemplo Flyway)

```sql
-- V{timestamp}__convenio_desconto_flexivel.sql
ALTER TABLE convenio
  ADD COLUMN tipo_desconto varchar(16) NOT NULL DEFAULT 'PERCENTUAL',
  ADD COLUMN desconto_valor numeric(12,2) NULL,
  ADD COLUMN formas_pagamento_permitidas text[] NULL;

ALTER TABLE convenio
  ADD CONSTRAINT convenio_tipo_desconto_check
    CHECK (tipo_desconto IN ('PERCENTUAL', 'VALOR_FIXO'));

ALTER TABLE convenio
  ADD CONSTRAINT convenio_valor_fixo_exige_valor
    CHECK (
      tipo_desconto <> 'VALOR_FIXO' OR desconto_valor IS NOT NULL
    );

-- Nenhuma linha existente é tocada: default garante PERCENTUAL retrocompat.
```

### Retrocompat

Convênios existentes herdam `tipo_desconto='PERCENTUAL'` via default —
sem breakage. `formas_pagamento_permitidas` fica `NULL` = todas as
formas (comportamento atual).

### Tipo TS (`src/lib/shared/types/plano.ts`)

```ts
export type TipoDescontoConvenio = "PERCENTUAL" | "VALOR_FIXO";

export interface Convenio {
  id: UUID;
  nome: string;
  ativo: boolean;
  tipoDesconto: TipoDescontoConvenio;
  descontoPercentual?: number;              // quando tipoDesconto=PERCENTUAL
  descontoValor?: number;                   // quando tipoDesconto=VALOR_FIXO
  formasPagamentoPermitidas?: TipoFormaPagamento[]; // undefined = todas
  planoIds?: UUID[];
  observacoes?: string;
}
```

## Backend — pontos de mudança

### Entidade Java

`ConvenioEntity` ganha os 3 campos. DTO de criação/edição idem.

### Validação de consistência (`@AssertTrue` ou superRefine Zod)

- Se `tipoDesconto=PERCENTUAL`: exigir `descontoPercentual ∈ [0, 100]`.
- Se `tipoDesconto=VALOR_FIXO`: exigir `descontoValor > 0`.
- `formasPagamentoPermitidas`, se não-vazio, deve conter valores válidos
  do enum `TipoFormaPagamento`.

### Endpoints

Mesmos paths de hoje (`POST/PUT /api/v1/administrativo/convenios`),
mudança apenas no DTO. Sem quebra de contrato pra clientes antigos (que
não enviam os novos campos — defaults cuidam).

## Frontend — pontos de mudança

### `convenio-modal.tsx`

Nova seção **"Regra de desconto"** ganha radio cards no topo:

```
Tipo de desconto
(•) Percentual        ( ) Valor fixo
```

Render condicional:

- Se **Percentual**: input numérico com sufixo `%`, `max=100` (o que já
  existe na Phase 1).
- Se **Valor fixo**: input numérico com prefixo `R$`, `step="0.01"`,
  `min=0.01`.

Preview adapta:

- Percentual: "plano de R$ 150,00 → R$ 127,50 (R$ 22,50 de desconto)"
- Valor fixo: "plano de R$ 150,00 → R$ 120,00 (R$ 30,00 de desconto)"

Se `descontoValor > valorDoPlano`, warning visual: "Desconto maior que
valor de alguns planos elegíveis — desconto será limitado ao valor do
plano."

### Nova seção "Formas de pagamento permitidas"

```
Formas de pagamento
(•) Todas as formas
( ) Restringir a formas específicas
    └─ [✓] Dinheiro     [ ] PIX       [✓] Cartão crédito
       [ ] Cartão débito [ ] Boleto   [ ] Recorrente
```

UX: multi-select de checkboxes só aparece no modo "restringir". Validação:
se escolher "restringir" com 0 selecionadas → erro "selecione ao menos
uma forma".

### Listagem (`convenios-content.tsx`)

Coluna "Desconto" passa a mostrar:

- `15%` (como hoje) — quando percentual
- `R$ 30,00` — quando valor fixo
- Badge "3 formas" ou "Todas" na coluna nova "Pagamento"

## Motor de cálculo — `sales-runtime.ts` / `plano-flow.ts`

### Aplicação do desconto

```ts
function calcularDescontoConvenio(
  plano: Plano,
  convenio: Convenio,
  formaPagamento: TipoFormaPagamento,
): number {
  // 1. Convênio desativado ou fora do escopo de plano → 0
  if (!convenio.ativo) return 0;
  if (convenio.planoIds?.length && !convenio.planoIds.includes(plano.id)) return 0;

  // 2. Forma de pagamento não permitida → 0
  if (
    convenio.formasPagamentoPermitidas?.length &&
    !convenio.formasPagamentoPermitidas.includes(formaPagamento)
  ) {
    return 0;
  }

  // 3. Cálculo conforme tipo
  if (convenio.tipoDesconto === "VALOR_FIXO") {
    return Math.min(convenio.descontoValor ?? 0, plano.valor);
  }
  const pct = convenio.descontoPercentual ?? 0;
  return (plano.valor * pct) / 100;
}
```

### Filtro de convênios elegíveis no checkout

Ao trocar forma de pagamento, a lista de convênios disponíveis deve
**reagir**: esconder (ou marcar como indisponível) convênios com
`formasPagamentoPermitidas` incompatíveis.

Mensagem quando o cliente tinha um convênio selecionado e troca forma
de pagamento incompatível:
> "Convênio Empresa XYZ só vale em PIX. Mude a forma de pagamento ou
> escolha outro convênio."

## Impacto colateral

| Área | Mudança |
|---|---|
| Export CSV de convênios | Incluir colunas `tipo_desconto`, `desconto_valor`, `formas_permitidas` |
| Relatório de receita por convênio | `valor_desconto` continua agregado normal — motor já calcula certo |
| Dashboard de convênios | Considerar gráfico "descontos por forma de pagamento" (nice-to-have) |
| Checkout B2C (`/storefront/*`) | Filtrar convênios elegíveis conforme forma escolhida |
| Venda presencial (`/vendas/nova`) | Idem checkout |
| Cliente cobrança recorrente | Se convênio restringe a `RECORRENTE`, manter ativo automaticamente |

## Fora de escopo

- Desconto progressivo (ex.: "10% nos primeiros 3 meses, 5% depois") —
  complexidade alta, outro PRD.
- Desconto acumulativo com voucher — regra de precedência exige
  discussão separada.
- Data de validade do convênio (hoje só tem `ativo` booleano) — se for
  necessário, outro PRD.
- Scoping de convênio por unidade da rede (hoje convênio é por tenant
  inteiro) — outro PRD.

## Plano de corte

- **Wave 1 (backend)**: migration + entity + DTO + validação. Sem FE
  ainda. Permite curl manual. **Valor**: destrava integrações futuras.
- **Wave 2 (FE modal)**: radio tipo de desconto + campo valor fixo +
  preview adaptado. Ainda sem restrição de pagamento.
- **Wave 3 (FE modal)**: checkboxes de forma de pagamento permitida.
- **Wave 4 (motor de venda)**: aplicar filtro/cálculo novo em
  `sales-runtime.ts` e `plano-flow.ts`. Ajustar checkout B2C e venda
  presencial.
- **Wave 5 (listagem/relatório)**: coluna nova na tabela + export CSV +
  relatório agregado.

Waves 1–3 são entregas de infra/UI que não afetam produção (nenhum
cliente usa ainda). Wave 4 **muda comportamento do checkout** — precisa
de testes de regressão + feature flag sugerida (`convenio.v2.enabled`).
Wave 5 é polish.

## Testes críticos (Wave 4)

- Convênio percentual + forma restrita: só aplica na forma certa.
- Convênio valor fixo maior que plano: limita ao valor do plano.
- Convênio sem restrição de pagamento: funciona como antes (retrocompat).
- Troca de forma de pagamento no checkout: convênio incompatível some
  sem apagar seleção anterior sem aviso.
- Migração: convênios existentes (só `descontoPercentual`) funcionam
  sem mudança.

## Dependências

- Enum `TipoFormaPagamento` já existe no tipo (`src/lib/types`).
- Função `formatBRL` já usada.
- Infraestrutura de feature flags — verificar se existe canal pra
  `convenio.v2.enabled` ou introduzir.
- Testes de integração de vendas — revisar suíte existente.

## Métricas pós-release

- % de convênios criados em modo `VALOR_FIXO` vs `PERCENTUAL`.
- % de convênios com restrição de forma de pagamento ativa.
- Ticket médio com vs. sem convênio (baseline x semana 1/4).
- Conversão no checkout quando cliente troca forma e convênio some
  (heatmap do drop-off).
