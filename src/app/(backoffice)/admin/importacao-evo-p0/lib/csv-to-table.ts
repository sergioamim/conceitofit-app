/**
 * Mapa estático de chave de arquivo (frontend, camelCase) para a tabela destino
 * no banco de dados da Conceito Fit. Os targets são derivados dos javadoc
 * `Target table:` de cada `*StagingMergeStrategy.java` no backend
 * (modulo-importacao-terceiros/service/staging/).
 *
 * Chaves sem strategy correspondente (ex.: arquivos auxiliares de colaboradores
 * processados pelo `SkipStagingMergeStrategy`) não aparecem aqui — nesses casos
 * `getTargetTable()` retorna `null`.
 */
export const CSV_TO_TABLE: Record<string, string> = {
  // Clientes e relacionados
  clientes: "alunos",
  clientesCartoes: "cartao_cliente",
  clientesContratos: "matriculas",
  clientesContratosDependentes: "contrato_dependente",
  clientesContratosSuspensoes: "contrato_suspensao",
  clientesCreditosDias: "comercial_cliente_credito_dia",
  clientesResponsaveis: "cliente_responsavel",
  clienteResponsavelVinculo: "cliente_responsavel_vinculo",
  clienteTipoResponsavel: "cliente_responsavel_tipo",
  clienteContratoHistoricoAlteracao: "contrato_historico",

  // Prospects / carteira
  prospects: "prospects",
  historicoCarteira: "comercial_historico_carteira",
  historicoCarteiraAgrupado: "comercial_historico_carteira",

  // Contratos / planos
  contratos: "planos",
  contratoGrupoAtividade: "atividade_elegibilidade_planos",
  multasContrato: "multa_contrato",

  // Vendas
  vendas: "venda_itens",
  vendasItens: "venda_itens",

  // Recebimentos / financeiro
  recebimentos: "pagamentos",
  recebimentosTipos: "financeiro_recebimento_tipo_importado",
  historicoRecebimento: "financeiro_historico_recebimento_importado",
  bancos: "financeiro_banco_importado",
  bandeirasConfiguracoes: "financeiro_bandeira_configuracao_legado",
  cartoesCredito: "financeiro_cartao_credito",
  cartoesCreditoTaxas: "financeiro_cartao_credito_taxa",
  cartoesDebito: "financeiro_cartao_debito",
  cartaoAdquirente: "financeiro_cartao_adquirente",
  cartaoAdquirenteItem: "financeiro_cartao_adquirente_item",
  maquininhas: "financeiro_maquininha",
  maquinasCartao: "financeiro_maquininha",
  fornecedores: "financeiro_fornecedor_importado",
  centrosCustos: "financeiro_centro_custo_importado",
  dreGrupos: "financeiro_grupo_dre",
  contasBancarias: "financeiro_conta_bancaria",
  contasBancariasConciliacoes: "financeiro_conciliacao_linha",
  contasPagar: "conta_pagar",

  // Créditos comerciais
  creditos: "comercial_credito_cliente",
  creditosCancelamentos: "comercial_credito_cancelamento",
  creditosTransferencias: "comercial_credito_transferencia",

  // Operacional / caixa
  caixa: "operacional_caixa",
  caixas: "operacional_caixa_catalogo",
  caixaItem: "operacional_caixa_movimento",
  caixaItemDetalhe: "operacional_caixa_movimento_detalhe",
  sangria: "operacional_caixa_sangria",

  // Catálogo
  produtos: "catalogo_produto",
  produtoMovimentacoes: "catalogo_produto_movimentacao",
  servicos: "catalogo_servico",
  servicoGrupoAtividade: "atividade_elegibilidade_servicos",

  // Atividades / turmas
  atividade: "atividades",
  atividadeConfiguracao: "atividade_grade",
  atividadeSessao: "atividade_sessoes",
  atividadeProfessor: "atividade_sessao_instrutores",
  grupoAtividade: "atividade_grupos",
  gympassGrupoAtividade: "atividade_elegibilidade_parceiros",

  // Treinos
  treinos: "treinos",
  treinosExercicios: "exercicios",
  treinosGruposExercicios: "grupos_exercicio",
  treinosSeries: "treino_series",
  treinosSeriesItens: "treino_itens",

  // Estrutura administrativa
  areas: "admin_sala",
  funcionarios: "admin_funcionario",

  // Catraca / entradas
  entradas: "catraca_eventos",
};

/**
 * Retorna a tabela destino para a chave do CSV, ou `null` quando o arquivo
 * não tem strategy de merge associada (ex.: CSVs auxiliares de colaboradores,
 * biometria, fotos etc.).
 */
export function getTargetTable(chave: string): string | null {
  if (!chave) return null;
  return CSV_TO_TABLE[chave] ?? null;
}
