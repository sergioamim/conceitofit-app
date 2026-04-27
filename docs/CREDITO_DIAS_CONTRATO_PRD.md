# Crédito de dias em contrato — PRD

**Status:** parcialmente entregue.
Backend Wave 1 implementado em 2026-04-27; UX web ainda pendente.
**Autor:** levantado por CEO em sessão de 2026-04-24.
**Prioridade:** média. Cria gancho de compensação operacional hoje feito no braço.

---

## Problema

Hoje não existe uma forma transparente de **compensar clientes** quando a
academia deve dias de contrato. Os cenários reais que acontecem:

- Cliente foi **suspenso indevidamente** (erro operacional).
- **Academia fechou** por reforma, pandemia, caos de infra (X dias).
- **Serviço degradado** (catraca, aulas canceladas em série) e a gestão
  decide repor dias.
- **Retenção reativa** — gerente oferece "te dou 15 dias" pra evitar
  cancelamento.

O time contorna isso ajustando data de vencimento no banco "na mão" ou
criando créditos avulsos sem rastro. Resultado: receita diferida fica
inconsistente, não há histórico de quem autorizou, e o cliente não
recebe comunicação formal.

## Objetivo

Entregar duas ações auditáveis:

1. **Crédito em massa** — administrador da rede adiciona N dias ao
   contrato de **todos os clientes ativos** (ou de um subconjunto
   filtrado por unidade/plano).
2. **Crédito individual** — operador da unidade adiciona N dias a **um
   contrato específico**.

Ambas precisam:

- Registrar **quem** autorizou, **quando**, **quantos dias**, **motivo**
  (texto livre obrigatório).
- Refletir imediatamente no **vencimento** do contrato ativo do cliente.
- Notificação ao cliente fica fora da Wave 1. O backend atual grava
  `notificar_cliente=false` e não expõe flag de envio nesta etapa.
- Ficar visível no **histórico do contrato** e no **extrato financeiro**
  do cliente.
- Ser **reversível por 7 dias** via ação "Estornar crédito" (mesma
  trilha de auditoria).

## Regras de autorização

| Ação | Papel mínimo | Escopo |
|---|---|---|
| Crédito em massa — rede inteira | `SUPER_USER` da rede (dono) | Todos os clientes ativos de todas as unidades |
| Crédito em massa — unidade | `ADMIN_UNIDADE` | Clientes ativos da própria unidade |
| Crédito em massa — plano específico | `ADMIN_UNIDADE` ou superior | Clientes com determinado plano |
| Crédito individual | `OPERADOR_RECEPCAO` com permissão `CONTRATO:CREDITAR_DIAS` | Um contrato |
| Estornar crédito (7 dias) | Mesmo papel que concedeu | O crédito emitido |
| Ver histórico de créditos | Qualquer operador com acesso ao cliente | Somente visualização |

Validar permissões no **backend** (defensivo). FE apenas guia a UX
ocultando entradas para quem não tem o papel.

## Limites e guard-rails

- Máximo por emissão: **30 dias** (individual) / **15 dias** (massa).
  Exceder exige aprovação de duplo fator: pede senha do SUPER_USER.
- Não pode creditar em contrato **cancelado** ou **em cobrança judicial**.
- Não pode creditar **dias negativos** (nunca debitar por esse fluxo —
  existe ação separada de estorno).
- Crédito em massa **rate-limited**: 1 emissão por dia por unidade
  (evita disparo duplicado acidental).
- Motivo é **obrigatório** e tem mínimo de 20 caracteres.

## Modelagem de dados (proposta)

Nova tabela `contrato_credito_dias`:

| Coluna | Tipo | Observação |
|---|---|---|
| id | UUID | PK |
| contrato_id | UUID | FK contrato.id |
| cliente_id | UUID | FK cliente.id (denormalizado p/ query) |
| tenant_id | UUID | multi-tenancy |
| dias | smallint | positivo, 1..30 |
| motivo | text | obrigatório, min 20 chars |
| origem | enum | `MASSA_REDE` \| `MASSA_UNIDADE` \| `MASSA_PLANO` \| `INDIVIDUAL` |
| lote_id | UUID nullable | agrupa créditos emitidos no mesmo disparo em massa |
| autorizado_por_usuario_id | UUID | quem clicou |
| autorizado_por_papel | text | snapshot do papel na hora |
| emitido_em | timestamptz | `now()` |
| notificar_cliente | boolean | se deve enviar comunicação |
| estornado_em | timestamptz nullable | se estornado |
| estornado_por_usuario_id | UUID nullable | |
| estorno_motivo | text nullable | |

Efeito imediato no contrato: `UPDATE contrato SET data_fim_vigencia = data_fim_vigencia + dias` (operação atômica dentro da mesma transação do insert).

## Endpoints

```
POST   /api/v1/contratos/{contratoId}/creditos-dias    → individual
POST   /api/v1/contratos/creditos-dias/lote            → em massa
POST   /api/v1/contratos/creditos-dias/{id}/estornar   → reverte
GET    /api/v1/contratos/{contratoId}/creditos-dias    → histórico
GET    /api/v1/admin/creditos-dias/lotes               → listagem de lotes (SUPER_USER)
```

Payload `POST /lote`:
```json
{
  "dias": 7,
  "motivo": "Academia fechada para reforma elétrica 18-24/mai",
  "escopo": "UNIDADE",
  "unidadeId": "uuid",
  "planoId": null,
  "notificarClientes": true
}
```

## Telas

1. **Individual** — dentro da página do cliente, aba de contratos:
   botão "Creditar dias" → modal simples com:
   - Dias (1–30)
   - Motivo (textarea, ≥20 chars)
   - Preview: "Novo vencimento: 12/08/2026"
   - Confirmar

2. **Em massa** — nova rota `/admin/compensacoes/creditos-dias`:
   - Escopo: Toda rede / Unidade / Plano
   - Dias
   - Motivo
   - Estimativa de impacto: "Será aplicado a 347 contratos ativos"
   - Double-confirm com senha do usuário
   - Após envio: job assíncrono + status em tempo real

3. **Histórico de créditos** — seção na aba de contratos do perfil do
   cliente. Dashboard/lotes admin continuam para waves futuras.

## Auditoria

Reaproveitar a infraestrutura de auditoria existente (mesma do
`ajuste-modal.tsx` de caixa). Todo evento fica em `audit_log` com:
- `action`: `CONTRATO.CREDITO_DIAS.EMITIDO` / `.ESTORNADO`
- `actor_user_id`, `actor_role`
- `target_type=contrato`, `target_id=contrato.id`
- `metadata`: JSON com dias, motivo, origem, lote_id

Retention: 5 anos (alinhado com receita diferida e auditoria fiscal).

## Notificação ao cliente

Planejada para Wave 2. Não entra na entrega atual.

Template alvo:
> Oi {{nome}}! A {{academia}} creditou {{dias}} dias no seu contrato.
> Motivo: {{motivo_publico}}. Novo vencimento: {{novo_vencimento}}.

Nota: o motivo público é **opcional** e curado pelo emissor — o motivo
técnico fica só no audit log. Em massa, usar texto padrão redigido pelo
emissor.

## Fora de escopo desta feature

- Débito de dias (antecipar vencimento) — flow separado, regra diferente.
- Crédito de valor monetário (R$) — usar fluxo existente de voucher.
- Migração de contrato (plano A → plano B com pro-rata) — outro PRD.

## Métricas pós-release

- % de contratos com ao menos 1 crédito no trimestre.
- Distribuição de motivos (tokenizar e classificar: "fechamento",
  "retenção", "erro operacional").
- Tempo médio entre erro operacional relatado → crédito emitido.
- Taxa de estorno (quantos créditos são revertidos em 7 dias).

## Dependências

- Tabela de auditoria já existe (`audit_log` é usada por caixa).
- Sistema de permissões (RBAC) já suporta `SUPER_USER` e
  permissões granulares por recurso — adicionar
  `CONTRATO:CREDITAR_DIAS` e `CONTRATO:CREDITAR_DIAS_MASSA`.
- Job assíncrono pra aplicar lotes — reusar infraestrutura de fila
  existente ou criar worker dedicado se não houver.

## Plano de corte

- **Wave 1**: crédito individual + histórico + estorno. Sem notificação.
  Backend já entregue; FE web ainda em implementação.
- **Wave 2**: notificação ao cliente + template curado.
- **Wave 3**: crédito em massa por unidade (ADMIN_UNIDADE).
- **Wave 4**: crédito em massa por rede (SUPER_USER) com double-confirm.

Cada wave é entregável independente. Wave 1 desbloqueia o operador na
recepção; Wave 3-4 desbloqueia o dono em cenário de crise.
