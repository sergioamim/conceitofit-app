# Regras de Negócio

## Clientes (ex-alunos)
- Um cliente tem status: `ATIVO`, `INATIVO`, `SUSPENSO`, `CANCELADO`.
- Cliente só é `ATIVO` quando possui plano vigente e não está em atraso.
- Cliente em atraso (`PAGAMENTO` `VENCIDO`) fica `INATIVO`.
- Cliente sem plano vigente fica `INATIVO`.
- `SUSPENSO` é definido manualmente no detalhe do cliente e exige:
  - `motivo` obrigatório.
  - `inicio` e `fim` opcionais (vazio = suspensão imediata e por prazo indeterminado).
  - `detalhes` (texto livre) e `arquivo` (anexo) opcionais.

## Prospects
- Prospect possui histórico de status (`statusLog`).
- Um prospect pode ser contado em múltiplos status no mesmo mês se ele passou por eles naquele período.
- `PERDIDO` deve registrar `motivoPerda`.

## Matrículas
- Apenas uma matrícula `ATIVA` por cliente.
- Ao criar matrícula, gera pagamento automaticamente.
- `dataFim = dataInicio + plano.duracaoDias`.
- Renovação cria nova matrícula a partir do dia seguinte ao `dataFim`.
- Não é permitido vender o mesmo plano no mesmo período vigente.
- Não é permitido vender plano com atividades iguais no mesmo período vigente.
- Para vender um plano com conflito, a `dataInicio` deve ser posterior ao período vigente.

## Convênios
- Convênio pode aplicar desconto a todos os planos ou apenas a planos selecionados.
- Convênio inativo impede renovação de matrícula associada.
- Convênio só pode ser selecionado na venda se o plano estiver vinculado.

## Pagamentos
- `PENDENTE` vencido se `dataVencimento` < hoje.
- Pagamentos `VENCIDOS` deixam o cliente `INATIVO`.
- Ao receber pagamento, status vira `PAGO` e o cliente pode voltar para `ATIVO` se tiver plano vigente e não houver débitos.
- Venda com pagamento pendente exige confirmação explícita.

## Presenças
- Registro de presença inclui `data`, `horario`, `origem` e `atividade`.
- Gráfico de frequência conta no máximo 1 presença por dia.

## Serviços
- Serviço é item separado de atividade e pode possuir número de sessões.
