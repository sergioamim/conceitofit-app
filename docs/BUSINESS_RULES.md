# Regras de Negócio

## Modelo organizacional (Academia x Unidade)
- `Academia` e a entidade forte (matriz/rede).
- `Unidade` (tenant) e entidade fraca: uma academia possui `1..N` unidades.
- `Tenant` continua sendo o contexto operacional da aplicacao e dono dos dados transacionais.
- Todo dado transacional permanece relacionado a `tenantId` (clientes, prospects, planos, produtos, servicos, vendas, pagamentos etc.).
- Excecao de listagem: no cadastro de `Unidades`, a lista exibe todas as unidades da academia atual.
- Troca de unidade deve ocorrer somente entre unidades ativas da mesma academia.

## Whitelabel e tema
- Tema e marca sao configuracoes da `Academia` (nao da unidade).
- Existe um unico tema por academia, aplicado a todas as unidades daquela academia.
- `Branding` da academia inclui:
  - Nome da marca no sistema.
  - Logo.
  - Tema base (preset).
  - Cores customizadas opcionais (override do preset).

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
- Fluxo visual consolidado do Kanban:
  - `NOVO -> AGENDOU_VISITA -> VISITOU -> EM_CONTATO -> CONVERTIDO`
  - `PERDIDO` continua etapa paralela/final.
- Regra por origem:
  - Origem digital: segue fluxo completo.
  - Origem presencial (`VISITA_PRESENCIAL`): ao evoluir de `NOVO`, vai para `VISITOU` (pula `AGENDOU_VISITA`).
- No card do Kanban nao existe acao direta de avancar.
- No modal de detalhe do prospect existe botao `Avancar` com a regra acima.

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

## Atividades e grade
- Existe cadastro de `Atividades` (catalogo) e cadastro de `Atividades - Grade` (disponibilidade).
- Grade possui relacionamento com atividade e suporta multiplos dias da semana no mesmo registro.
- Cada item da grade sera exibido na visao de calendario semanal (`Grade`) e, futuramente, calendario operacional completo.
- A atividade pode:
  - Nao usar check-in.
  - Permitir check-in.
  - Exigir check-in.
- Regra de exibicao de vagas:
  - Se atividade nao usa check-in, exibir capacidade da sala.
  - Se atividade permite/exige check-in, exibir vagas disponiveis somente dentro da janela definida por `checkinLiberadoMinutosAntes`.
- `Funcionario` substitui cadastro isolado de professor.
  - Funcionario tem cargo.
  - Flag `podeMinistrarAulas` controla elegibilidade para grade.

## Serviços
- Serviço é item separado de atividade e pode possuir número de sessões.
- Servico pode habilitar:
  - Acesso por catraca por quantidade de sessoes.
  - Aplicacao de voucher.

## Planos
- Plano nao deve ser removido fisicamente; deve ser desativado.
- Listagem de planos, por padrao, exibe apenas ativos.
- Plano informa:
  - Se permite renovacao automatica.
  - Se permite cobranca automatica/recorrente.
- Plano pode ter vigencia e conjunto de atividades inclusas.

## Vendas (Plano, Serviço, Produto)
- Venda pode ser de `PLANO`, `SERVICO` ou `PRODUTO`.
- `PLANO`: cliente identificado é obrigatório.
- `SERVICO`: cliente identificado é obrigatório.
- `PRODUTO`: cliente identificado é opcional (venda balcão), porém recomendado.
- Em termos de operação, a maioria das vendas tende a ser de plano; a experiência da tela deve priorizar esse fluxo.
- A venda deve guardar tenant da operação (`tenantId`), mesmo quando cliente não for identificado.
- Toda selecao de cliente na aplicacao deve usar suggestion box por `nome` ou `CPF`.
- Selecao de item de venda deve usar suggestion box por nome e opcao de leitura de codigo de barras.

## Checkout / Pagamento único
- O checkout deve ser único e reutilizável para qualquer origem de venda no sistema.
- O mesmo componente deve suportar plano, serviço e produto sem duplicar regra de pagamento.
- Regras de forma de pagamento, descontos, taxas e confirmação de pendência devem ser centralizadas no checkout compartilhado.

## Produtos e compartilhamento
- Produtos podem ser compartilhados/reaproveitados entre unidades da mesma academia/rede.

## Vouchers
- Voucher pode ter escopo:
  - `UNIDADE`: vinculado a um `tenantId`.
  - `GRUPO`/global da academia: `tenantId` vazio e identificacao de grupo/academia.
- Quando voucher e global, deve poder ser utilizado em qualquer unidade da mesma academia/rede, respeitando regras de validade e uso.

## Dashboard e filtros de periodo
- Dashboard usa data do dia atual por padrao.
- Usuario pode escolher outra data apenas no passado.
- Componentes de periodo em telas de listagem devem respeitar escopo funcional:
  - Quando definido, listar dados do mes/ano selecionado.
