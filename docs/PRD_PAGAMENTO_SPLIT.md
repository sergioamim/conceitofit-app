# PRD — Pagamento Split (Multi-forma)

**Status:** Aprovado em 2026-04-28
**Versão:** 1.0
**Owner:** PO
**Worktree:** `.claude/worktrees/pagamento-split`

## 1. Contexto

Hoje o domínio de pagamento (`Pagamento` em `modulo-core`) é **monolítico**: cada
pagamento tem **uma única `formaPagamento`** (enum `TipoFormaPagamento`), uma
parcela e um status. No frontend, `vendas/nova/components/payment-panel.tsx`
permite escolher uma única forma por venda.

Isso impede cenários reais de academia:
- Cliente paga R$ 200 com R$ 100 dinheiro + R$ 100 cartão débito
- Cliente paga matrícula com R$ 50 em crédito interno + R$ 200 PIX + R$ 150 cartão crédito 3x
- Operador recebe pagamento com **2 cartões diferentes** (cada um com seu NSU)

## 2. Escopo

### Em escopo (Fase 1)
- **Caixa avulso (offline)**: operador no caixa registra pagamento com N formas, cada uma com valor próprio
- **Múltiplas formas iguais**: 2+ cartões no mesmo pagamento (cada um com NSU/bandeira distintos)
- **Crédito interno como forma**: abate `comercial_credito_cliente.saldo` atomicamente
- **Voucher como desconto pré-split**: continua aplicado no nível da Venda (`VendaEntity.descontoTotal`), antes de abrir formas
- **Confirmação por parcela**: PIX começa pendente, dinheiro/cartão confirmam quando NSU é informado
- **Estorno parcial**: cancelar 1 parcela específica sem afetar as outras

### Fora de escopo (Fase futura)
- Pagamento online (PSP via webhook/API)
- Integração TEF (maquininha conectada via SDK)
- Recorrência multi-forma (assinatura mensal continua single-form)
- Reconciliação automática com extrato da maquininha

> **Nota:** O schema é desenhado pra **suportar futuro online/TEF sem migration nova** —
> campos `origem`, `psp_provider`, `psp_transacao_id`, `psp_status_raw` ficam nullable
> e são populados quando esses fluxos forem implementados.

## 3. User Stories

### US1 — Caixa avulso multi-forma
**Como** operador no caixa
**Quero** dividir um valor entre N formas de pagamento
**Para** atender clientes que mesclam dinheiro/cartão/PIX

**Critérios de aceite:**
- Tela de pagamento mostra `Saldo a quitar` em destaque
- Botão `+ Adicionar forma` abre modal com select de forma e campo valor (default = saldo restante)
- Soma de parcelas confirmadas precisa ser igual a `valor_total` pra fechar pagamento
- Cada cartão exige NSU (mín 4 dígitos) + bandeira + parcelas
- PIX cria parcela `PENDENTE`; operador clica `[Confirmar]` quando vê depósito no app
- Dinheiro confirma direto ao adicionar
- Não permite fechar com saldo > 0

### US2 — Crédito interno como forma
**Como** operador
**Quero** usar saldo de crédito do cliente como forma de pagamento
**Para** abater valores devidos da plataforma sem precisar de transação externa

**Critérios:**
- Modal `+ Adicionar forma` exibe **opção "Crédito interno"** se cliente tem saldo > 0
- Mostra `Saldo disponível: R$ X` no modal
- Valida `valor <= saldo_disponivel`
- Abate `comercial_credito_cliente.saldo` de forma idempotente quando parcela confirma
- Estorno da parcela devolve o saldo

### US3 — Múltiplos cartões no mesmo pagamento
**Como** operador
**Quero** registrar 2+ cartões no mesmo pagamento
**Para** atender clientes que dividem valor alto entre cartões

**Critérios:**
- Permitir adicionar N parcelas com `forma = CARTAO_CREDITO` ou `CARTAO_DEBITO`
- Cada uma com NSU, bandeira, parcelas próprias
- Listagem mostra cada cartão como linha separada

### US4 — Estorno parcial
**Como** operador
**Quero** estornar 1 das N parcelas de um pagamento
**Para** ajustar quando o cliente cancela só parte da operação (ex: devolveu o produto pago em dinheiro)

**Critérios:**
- DELETE em `/pagamentos/{id}/parcelas/{pid}` marca parcela `FALHOU`
- Se era CREDITO_INTERNO, devolve saldo
- Pagamento volta pra status `PENDENTE` (saldo a quitar reabre)
- Audita operador, timestamp, motivo

## 4. Modelo de Dados

### Nova tabela: `pagamento_parcela`

```sql
CREATE TABLE pagamento_parcela (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pagamento_id UUID NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    ordem SMALLINT NOT NULL,                    -- ordem de exibição (1, 2, 3...)
    forma VARCHAR(30) NOT NULL,                 -- TipoFormaPagamento + CREDITO_INTERNO
    valor NUMERIC(12,2) NOT NULL CHECK (valor > 0),
    numero_parcelas SMALLINT NOT NULL DEFAULT 1, -- só CARTAO_CREDITO usa > 1
    bandeira VARCHAR(40),                        -- VISA, MASTERCARD, ELO, ...
    codigo_autorizacao VARCHAR(50),              -- NSU/CV cartão; txid PIX
    status VARCHAR(20) NOT NULL,                 -- PENDENTE | CONFIRMADO | FALHOU
    confirmado_em TIMESTAMP,
    confirmado_por UUID,                         -- operador (usuario_id)
    estornado_em TIMESTAMP,
    estornado_por UUID,
    motivo_estorno TEXT,
    observacao TEXT,

    -- Campos preparados pra fluxo online/TEF (futuro)
    origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL_OFFLINE',  -- MANUAL_OFFLINE | TEF | ONLINE
    psp_provider VARCHAR(40),                    -- PAGARME, STONE, ...
    psp_transacao_id VARCHAR(80),
    psp_status_raw JSONB,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

    CONSTRAINT pp_parcelas_valid CHECK (numero_parcelas BETWEEN 1 AND 24),
    CONSTRAINT pp_status_valid CHECK (status IN ('PENDENTE','CONFIRMADO','FALHOU')),
    CONSTRAINT pp_origem_valid CHECK (origem IN ('MANUAL_OFFLINE','TEF','ONLINE')),
    CONSTRAINT pp_credito_sem_nsu CHECK (
        forma <> 'CREDITO_INTERNO' OR codigo_autorizacao IS NULL
    )
);

CREATE INDEX idx_pp_pagamento ON pagamento_parcela (pagamento_id);
CREATE INDEX idx_pp_tenant_status ON pagamento_parcela (tenant_id, status);
CREATE INDEX idx_pp_psp_transacao ON pagamento_parcela (psp_transacao_id) WHERE psp_transacao_id IS NOT NULL;
```

### Mudança no enum `TipoFormaPagamento`

Adicionar valor:
```java
CREDITO_INTERNO("Crédito interno")
```

### Pagamento (existente) — mudanças mínimas

Campo `formaPagamento` na tabela `pagamentos` **fica obsoleto** mas não removido
(retrocompatibilidade — pagamentos antigos continuam consultáveis). Novos
pagamentos criados via fluxo split deixam esse campo NULL e a informação real
está nas parcelas.

Campo derivado (computed read-only no service):
- `Pagamento.formaPagamentoResumo` → string `"DINHEIRO + CARTAO_CREDITO 3x"` montada das parcelas confirmadas

### Status derivado do `Pagamento`

```
SE existe parcela com status PENDENTE     → pagamento.status = PENDENTE
SENÃO SE soma(parcelas CONFIRMADO) >= valor_total - desconto → pagamento.status = PAGO
SENÃO                                     → pagamento.status = PENDENTE (saldo aberto)
SE todas parcelas estão FALHOU            → pagamento.status = CANCELADO
```

## 5. Contrato de API

Base path mantido: `/api/v1/comercial`

### `POST /pagamentos`

**Request:**
```json
{
  "tenantId": "uuid",
  "alunoId": "uuid",
  "matriculaId": "uuid?",
  "tipo": "MATRICULA | MENSALIDADE | TAXA | PRODUTO | AVULSO",
  "descricao": "string",
  "valor": 350.00,
  "desconto": 0,
  "dataVencimento": "2026-04-28",
  "parcelas": [
    {
      "forma": "DINHEIRO",
      "valor": 50.00
    },
    {
      "forma": "CARTAO_CREDITO",
      "valor": 200.00,
      "numero_parcelas": 3,
      "bandeira": "VISA",
      "codigo_autorizacao": "123456"
    },
    {
      "forma": "CREDITO_INTERNO",
      "valor": 100.00
    }
  ]
}
```

**Validações:**
- `sum(parcelas[].valor) == valor - desconto`
- Cada parcela: `valor > 0`
- `numero_parcelas` só faz sentido pra CARTAO_CREDITO
- `codigo_autorizacao` obrigatório pra CARTAO_*
- CREDITO_INTERNO: cliente precisa ter saldo suficiente

**Response:** `PagamentoResponse` com `parcelas: ParcelaResponse[]`

### `PATCH /pagamentos/{id}/parcelas/{pid}/confirmar`

Confirma parcela `PENDENTE` (uso típico: PIX após confirmação manual do operador).

**Request:**
```json
{
  "codigo_autorizacao": "TXID-OPCIONAL",
  "observacao": "PIX confirmado no app"
}
```

Idempotente: confirmar parcela já `CONFIRMADO` retorna 200 sem alterar nada.

### `DELETE /pagamentos/{id}/parcelas/{pid}`

Estorno parcial.

**Request:**
```json
{
  "motivo": "Cliente devolveu produto"
}
```

Side-effects:
- Marca parcela `FALHOU`
- Se forma era `CREDITO_INTERNO`: devolve saldo a `comercial_credito_cliente`
- Recalcula `pagamento.status`
- Audita

### `GET /pagamentos/{id}` (existente, ajustar response)

Retorna pagamento com array `parcelas` populado.

## 6. Plano de Implementação (Waves)

| Wave | Escopo | Estimativa | Repo |
|------|--------|-----------|------|
| **W1** | Migration `pagamento_parcela` + entity + repo + enum CREDITO_INTERNO | 0.5d | java |
| **W2** | `PagamentoSplitService` + abate crédito idempotente + testes | 1d | java |
| **W3** | API REST: POST com parcelas[] + PATCH confirmar + DELETE estorno + DTOs | 1d | java |
| **W4** | UI Caixa: refactor `payment-panel.tsx` pra wizard split | 2d | app |
| **W5** | Estorno parcial UI + auditoria backend | 0.5d | ambos |
| **W6** | Relatório caixa diário consolidado | 0.5d | ambos |

**Total: ~5.5 dias**

### Dependências cruzadas
- **PRD Crédito de Dias** (`credito-dias-prd.md`): a forma `CREDITO_INTERNO` faz par com a feature de
  crédito de dias. Verificar se o saldo abatido aqui é o mesmo `comercial_credito_cliente.saldo` ou se há
  divergência conceitual.
- **PRD Convênios Phase 4** (em scoping): convênios podem oferecer desconto progressivo — interage com
  voucher e potencialmente com forma `CONVENIO_DESCONTO`.

## 7. Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Pagamento parcial (algumas parcelas confirmadas, outras pendentes) gera ambiguidade no acesso do aluno | Status `PAGO` só quando soma confirmada >= total. Mensalidades só liberam acesso com `PAGO` |
| Operador esquece de confirmar PIX | Listagem filtra "PENDENTE há > 24h" pra alerta visual |
| Estorno de parcela CREDITO_INTERNO em pagamento já fechado pode dessincronizar saldo | Service usa transação + `SELECT FOR UPDATE` no crédito; idempotência via `parcelaId` único |
| 2 cartões com mesmo NSU (cliente passa o mesmo cartão 2x) | Não bloqueia (validação só por valor); reconciliação manual identifica |
| Migração de pagamentos existentes (single-form) pra novo schema | **Não migra** — convivência: `pagamentos.formaPagamento` continua válido pra registros antigos. Só novos pagamentos usam `pagamento_parcela`. UI consulta ambos |

## 8. Métricas de Sucesso

- 0% de pagamentos rejeitados por "limite de uma forma" após release
- Tempo médio de fechamento de caixa não aumenta > 20% (medir antes/depois)
- 0 inconsistências de saldo de crédito interno após 30 dias de uso

## 9. Glossário

- **Parcela**: cada forma individual de pagamento dentro de um Pagamento split. Não confundir com
  "parcelas de cartão" (`numero_parcelas` é atributo de uma parcela tipo CARTAO_CREDITO)
- **NSU**: Número Sequencial Único (cód. autorização da maquininha)
- **Crédito interno**: saldo do cliente em `comercial_credito_cliente.saldo`, usado como forma
- **Voucher**: cupom de desconto aplicado no nível da venda (não é forma)
