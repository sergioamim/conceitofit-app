import { UUID, LocalDate, LocalDateTime } from './comum';
import { Aluno } from './aluno';

export type StatusPagamento = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
export type StatusContaPagar = "PENDENTE" | "PAGA" | "VENCIDA" | "CANCELADA";
export type TipoContaBancaria = "CORRENTE" | "POUPANCA" | "PAGAMENTO";
export type AdquirenteMaquininha = "STONE" | "CIELO" | "REDE" | "GETNET" | "PAGARME_POS" | "OUTROS";
export type TipoMovimentoConciliacao = "CREDITO" | "DEBITO";
export type StatusConciliacao = "PENDENTE" | "CONCILIADA" | "IGNORADA";
export type OrigemConciliacao = "MANUAL" | "OFX" | "STONE";
export type PixTipo = "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" | "OUTRA";

export type TipoPagamento =
  | "MATRICULA"
  | "MENSALIDADE"
  | "TAXA"
  | "PRODUTO"
  | "AVULSO";

export type TipoFormaPagamento =
  | "DINHEIRO"
  | "PIX"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "BOLETO"
  | "RECORRENTE";

export type CategoriaContaPagar =
  | "FOLHA"
  | "ALUGUEL"
  | "UTILIDADES"
  | "IMPOSTOS"
  | "MARKETING"
  | "MANUTENCAO"
  | "FORNECEDORES"
  | "OUTROS";

export type RegimeContaPagar = "FIXA" | "AVULSA";
export type GrupoDre =
  | "CUSTO_VARIAVEL"
  | "DESPESA_OPERACIONAL"
  | "DESPESA_FINANCEIRA"
  | "IMPOSTOS";

export type RecorrenciaContaPagar = "MENSAL" | "INTERVALO_DIAS";
export type TerminoRecorrenciaContaPagar = "SEM_FIM" | "EM_DATA" | "APOS_OCORRENCIAS";
export type StatusRegraRecorrenciaContaPagar = "ATIVA" | "PAUSADA" | "CANCELADA";
export type DreProjectionScenario = "BASE" | "OTIMISTA" | "CONSERVADOR";

export type CobrancaStatus = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";

export interface Cobranca {
  id: UUID;
  contratoId: UUID;
  academiaId: UUID;
  academiaNome: string;
  valor: number;
  dataVencimento: LocalDate;
  dataPagamento?: LocalDate;
  status: CobrancaStatus;
  formaPagamento?: TipoFormaPagamento;
  multa?: number;
  juros?: number;
  observacoes?: string;
}

export type DashboardFinanceiroPeriodo = "3M" | "6M" | "12M";
export type DashboardFinanceiroAgingFaixa = "0_15" | "16_30" | "31_60" | "60_PLUS";

export interface DashboardFinanceiroMrrSerie {
  referencia: string;
  label: string;
  mrr: number;
}

export interface DashboardFinanceiroAgingItem {
  faixa: DashboardFinanceiroAgingFaixa;
  label: string;
  quantidade: number;
  valor: number;
}

export interface DashboardFinanceiroInadimplente {
  academiaId?: UUID;
  academiaNome: string;
  contratoId?: UUID;
  cobrancaId?: UUID;
  planoNome?: string;
  valorEmAberto: number;
  diasEmAtraso: number;
  ultimaCobrancaVencida?: LocalDate;
}

export interface DashboardFinanceiroPlanoComparativo {
  planoId?: UUID;
  planoNome: string;
  academiasAtivas: number;
  mrr: number;
  participacaoPct: number;
}

export interface DashboardFinanceiroAdmin {
  mrrAtual: number;
  mrrProjetado: number;
  totalAcademiasAtivas: number;
  totalInadimplentes: number;
  churnRateMensal: number;
  previsaoReceita: number;
  evolucaoMrr: DashboardFinanceiroMrrSerie[];
  aging: DashboardFinanceiroAgingItem[];
  inadimplentes: DashboardFinanceiroInadimplente[];
  comparativoPlanos: DashboardFinanceiroPlanoComparativo[];
  generatedAt?: LocalDateTime;
}

export interface PagamentoResumo {
  id: UUID;
  status: StatusPagamento;
  valorFinal: number;
  dataVencimento?: LocalDate;
  dataPagamento?: LocalDate;
  formaPagamento?: TipoFormaPagamento;
}

export interface Pagamento {
  id: UUID;
  tenantId: UUID;
  alunoId: UUID;
  matriculaId?: UUID;
  aluno?: Aluno;
  tipo: TipoPagamento;
  descricao: string;
  valor: number;
  desconto: number;
  valorFinal: number;
  dataVencimento: LocalDate;
  dataPagamento?: LocalDate;
  formaPagamento?: TipoFormaPagamento;
  status: StatusPagamento;
  comprovante?: string;
  observacoes?: string;
  nfseEmitida?: boolean;
  nfseNumero?: string;
  nfseChave?: string;
  dataEmissaoNfse?: LocalDateTime;
  dataCriacao: LocalDateTime;
}

export interface ContaBancaria {
  id: UUID;
  tenantId: UUID;
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo: TipoContaBancaria;
  titular: string;
  pixChave?: string;
  pixTipo?: PixTipo;
  statusCadastro: "ATIVA" | "INATIVA";
}

interface Maquininha {
  id: UUID;
  tenantId: UUID;
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: UUID;
  statusCadastro: "ATIVA" | "INATIVA";
}

export type NfseAmbiente = "HOMOLOGACAO" | "PRODUCAO";

/**
 * Provedores NFS-e suportados pelo backend (Task #557).
 * Alinhado com `NfseProvedor.java`. Valores antigos (GINFES, ABRASF, BETHA,
 * ISSNET, IPM) foram removidos — o BE atual só reconhece SEFIN_NACIONAL
 * (padrão nacional) e ENOTAS (gateway).
 */
export type NfseProvider = "SEFIN_NACIONAL" | "ENOTAS";
export type NfseRegimeTributario = "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
export type NfseClassificacaoTributaria =
  | "SERVICO_TRIBUTAVEL"
  | "RETENCAO"
  | "ISENTO"
  | "IMUNE"
  | "NAO_INCIDENTE"
  | (string & {});
/**
 * Indicador de operação NFS-e (Task #557). Alinhado com
 * `NfseIndicadorOperacao.java` (enum PRESENCIAL/NAO_PRESENCIAL). Valores
 * antigos (SERVICO_MUNICIPIO, SERVICO_FORA_MUNICIPIO, EXPORTACAO) eram
 * incorretos — eles representam outro conceito fiscal.
 */
export type NfseIndicadorOperacao = "PRESENCIAL" | "NAO_PRESENCIAL";
export type NfseConfiguracaoStatus = "PENDENTE" | "CONFIGURADA" | "ERRO";

/**
 * Configuração de NFS-e por unidade.
 *
 * Alinhado em Task #557 com o DTO do BE `NfseConfiguracaoUnidadeResponse`
 * (ver modulo-nfse). Os campos oficiais são os obrigatórios pelo backend;
 * os campos marcados `@deprecated` eram do modelo anterior do FE e não
 * são persistidos pelo BE atual (permanecem apenas para evitar quebras
 * de código legado — não devem ser usados em novas features).
 */
export interface NfseConfiguracao {
  id: UUID;
  tenantId: UUID;
  // Task #557: novos campos do BE (NfseConfiguracaoUnidadeResponse)
  unidadeId?: UUID;
  municipioCodigoIbge?: string;
  municipioUf?: string;
  endpointBase?: string;
  integracaoAtiva?: boolean;
  simulacao?: boolean;
  clienteId?: string;
  ativo?: boolean;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;

  // Campos compartilhados (existem em ambos os modelos)
  ambiente: NfseAmbiente;
  provedor: NfseProvider;
  codigoTributacaoNacional: string;
  codigoNbs: string;
  classificacaoTributaria: NfseClassificacaoTributaria;
  consumidorFinal: boolean;
  indicadorOperacao: NfseIndicadorOperacao;

  /** @deprecated Não persistido no BE atual (Task #557) */
  prefeitura?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  inscricaoMunicipal?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  cnaePrincipal?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  serieRps?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  loteInicial?: number;
  /** @deprecated Não persistido no BE atual (Task #557) */
  aliquotaPadrao?: number;
  /** @deprecated Não persistido no BE atual (Task #557) */
  regimeTributario?: NfseRegimeTributario;
  /** @deprecated Não persistido no BE atual (Task #557) */
  emissaoAutomatica?: boolean;
  /** @deprecated Não persistido no BE atual (Task #557) */
  emailCopiaFinanceiro?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  certificadoAlias?: string;
  /** @deprecated Não persistido no BE atual (Task #557) */
  webhookFiscalUrl?: string;

  // Campos derivados (não enviados em requests)
  status?: NfseConfiguracaoStatus;
  ultimaValidacaoEm?: LocalDateTime;
  ultimaSincronizacaoEm?: LocalDateTime;
  ultimoErro?: string;
}

/**
 * Payload para POST /api/v1/nfse/configuracoes (NfseConfiguracaoUnidadeRequest
 * do BE). Usado pela Task #557 para persistir configuração real.
 */
export interface NfseConfiguracaoPayload {
  id?: UUID;
  tenantId: UUID;
  unidadeId: UUID;
  municipioCodigoIbge: string; // 7 chars
  municipioUf: string; // 2 chars
  provedor: string;
  ambiente: NfseAmbiente;
  endpointBase: string;
  integracaoAtiva?: boolean;
  simulacao?: boolean;
  clienteId?: string;
  clienteSecret?: string;
  certificadoBase64?: string;
  credenciaisJson?: string;
  codigoTributacaoNacional: string;
  codigoNbs: string;
  classificacaoTributaria: string;
  consumidorFinal: boolean;
  indicadorOperacao: NfseIndicadorOperacao;
  ativo?: boolean;
}

export type AgregadorMeioCaptura = "POS" | "TEF" | "LINK_PAGAMENTO";
export type AgregadorTransacaoStatus = "CAPTURADA" | "PENDENTE" | "FALHA" | "ESTORNADA";
export type AgregadorRepasseStatus = "PREVISTO" | "EM_TRANSITO" | "LIQUIDADO" | "DIVERGENTE";
export type AgregadorConciliacaoStatus = "PENDENTE" | "CONCILIADA" | "DIVERGENTE";

export interface AgregadorTransacao {
  id: UUID;
  tenantId: UUID;
  pagamentoId?: UUID;
  adquirente: AdquirenteMaquininha;
  maquininhaNome?: string;
  nsu: string;
  autorizacao?: string;
  bandeira: string;
  meioCaptura: AgregadorMeioCaptura;
  clienteNome: string;
  descricao: string;
  valorBruto: number;
  taxa: number;
  valorLiquido: number;
  parcelas: number;
  dataTransacao: LocalDateTime;
  dataPrevistaRepasse: LocalDate;
  dataRepasse?: LocalDate;
  statusTransacao: AgregadorTransacaoStatus;
  statusRepasse: AgregadorRepasseStatus;
  statusConciliacao: AgregadorConciliacaoStatus;
  observacao?: string;
}

export interface ConciliacaoLinha {
  id: UUID;
  tenantId: UUID;
  contaBancariaId: UUID;
  chaveConciliacao: string;
  origem: OrigemConciliacao;
  status: StatusConciliacao;
  dataMovimento: LocalDate;
  descricao?: string;
  documento?: string;
  valor: number;
  tipoMovimento: TipoMovimentoConciliacao;
  contaReceberId?: UUID;
  contaPagarId?: UUID;
  observacao?: string;
}

export interface ContaPagar {
  id: UUID;
  tenantId: UUID;
  tipoContaId?: UUID;
  fornecedor: string;
  documentoFornecedor?: string;
  descricao: string;
  categoria: CategoriaContaPagar;
  grupoDre?: GrupoDre;
  centroCusto?: string;
  regime: RegimeContaPagar;
  competencia: LocalDate;
  dataEmissao?: LocalDate;
  dataVencimento: LocalDate;
  dataPagamento?: LocalDate;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  valorPago?: number;
  formaPagamento?: TipoFormaPagamento;
  status: StatusContaPagar;
  regraRecorrenciaId?: UUID;
  geradaAutomaticamente?: boolean;
  origemLancamento?: "MANUAL" | "RECORRENTE";
  observacoes?: string;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface TipoContaPagar {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  categoriaOperacional: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCustoPadrao?: string;
  ativo: boolean;
}

export interface RegraRecorrenciaContaPagar {
  id: UUID;
  tenantId: UUID;
  tipoContaId: UUID;
  fornecedor: string;
  documentoFornecedor?: string;
  descricao: string;
  categoriaOperacional: CategoriaContaPagar;
  grupoDre: GrupoDre;
  centroCusto?: string;
  valorOriginal: number;
  desconto: number;
  jurosMulta: number;
  recorrencia: RecorrenciaContaPagar;
  intervaloDias?: number;
  diaDoMes?: number;
  dataInicial: LocalDate;
  termino: TerminoRecorrenciaContaPagar;
  dataFim?: LocalDate;
  numeroOcorrencias?: number;
  criarLancamentoInicial: boolean;
  timezone?: string;
  status: StatusRegraRecorrenciaContaPagar;
  ultimaGeracaoEm?: LocalDateTime;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface DREGerencial {
  periodoInicio: LocalDate;
  periodoFim: LocalDate;
  receitaBruta: number;
  deducoesReceita: number;
  receitaLiquida: number;
  custosVariaveis: number;
  margemContribuicao: number;
  despesasOperacionais: number;
  ebitda: number;
  resultadoLiquido: number;
  ticketMedio: number;
  inadimplencia: number;
  contasReceberEmAberto: number;
  contasPagarEmAberto: number;
  despesasPorGrupo: Array<{ grupo: GrupoDre; valor: number }>;
  despesasPorCategoria: Array<{ categoria: CategoriaContaPagar; valor: number }>;
  despesasSemTipoCount: number;
  despesasSemTipoValor: number;
}

export interface DREBloco {
  receitas: number;
  despesas: number;
  resultado: number;
  custosVariaveis: number;
  despesasOperacionais: number;
  despesasFinanceiras: number;
  impostos: number;
}

export interface DREProjecaoLinha {
  grupo: string;
  natureza: "RECEITA" | "DESPESA";
  realizado: number;
  projetado: number;
  consolidado: number;
}

export interface DREProjecao {
  periodoInicio: LocalDate;
  periodoFim: LocalDate;
  cenario: DreProjectionScenario;
  realizado: DREBloco;
  projetado: DREBloco;
  consolidado: DREBloco;
  linhas: DREProjecaoLinha[];
}

export interface ReceberPagamentoInput {
  dataPagamento: LocalDate;
  formaPagamento: TipoFormaPagamento;
  codigoTransacao?: string;
  observacoes?: string;
}

export type ProvedorGateway =
  | "PAGARME"
  | "STRIPE"
  | "MERCADO_PAGO"
  | "CIELO_ECOMMERCE"
  | "ASAAS"
  | "OUTRO";

export interface GatewayPagamento {
  id: UUID;
  nome: string;
  provedor: ProvedorGateway;
  chaveApi: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  ativo: boolean;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export type StatusAssinatura = "ATIVA" | "PENDENTE" | "CANCELADA" | "SUSPENSA" | "VENCIDA";
export type CicloAssinatura = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export interface Assinatura {
  id: UUID;
  tenantId: UUID;
  alunoId: UUID;
  planoId: UUID;
  clienteNome?: string;
  planoNome?: string;
  status: StatusAssinatura;
  valor: number;
  ciclo: CicloAssinatura;
  dataInicio: LocalDate;
  proximaCobranca?: LocalDate;
  dataFim?: LocalDate;
  gatewayId?: string;
  gatewayAssinaturaId?: string;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export interface BillingConfig {
  id: UUID;
  tenantId: UUID;
  provedorAtivo: ProvedorGateway;
  chaveApi: string;
  webhookUrl?: string;
  webhookSecret?: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  statusConexao: "ONLINE" | "OFFLINE" | "NAO_CONFIGURADO";
  ultimoTesteEm?: LocalDateTime;
  ativo: boolean;
}
