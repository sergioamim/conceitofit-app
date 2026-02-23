export type UUID = string;
export type LocalDate = string; // "YYYY-MM-DD"
export type LocalDateTime = string; // "YYYY-MM-DDTHH:mm:ss"

export type OrigemProspect =
  | "VISITA_PRESENCIAL"
  | "WHATSAPP"
  | "INSTAGRAM"
  | "FACEBOOK"
  | "INDICACAO"
  | "SITE"
  | "OUTROS";

export type StatusProspect =
  | "NOVO"
  | "EM_CONTATO"
  | "AGENDOU_VISITA"
  | "VISITOU"
  | "CONVERTIDO"
  | "PERDIDO";

export interface ProspectStatusLog {
  status: StatusProspect;
  data: LocalDateTime;
}

export type StatusAgendamento = "AGENDADO" | "REALIZADO" | "CANCELADO";

export interface ProspectMensagem {
  id: UUID;
  prospectId: UUID;
  texto: string;
  datahora: LocalDateTime;
  autorNome: string;
  autorId?: UUID;
}

export interface ProspectAgendamento {
  id: UUID;
  prospectId: UUID;
  funcionarioId: UUID;
  titulo: string;
  data: LocalDate;
  hora: string;
  observacoes?: string;
  status: StatusAgendamento;
}

export type StatusAluno =
  | "ATIVO"
  | "INATIVO"
  | "SUSPENSO"
  | "CANCELADO";

export type Sexo = "M" | "F" | "OUTRO";

export type CategoriaAtividade =
  | "MUSCULACAO"
  | "CARDIO"
  | "COLETIVA"
  | "LUTA"
  | "AQUATICA"
  | "OUTRA";

export type TipoPlano = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" | "AVULSO";
export type ModoAssinaturaContrato = "DIGITAL" | "PRESENCIAL" | "AMBAS";

export type StatusMatricula = "ATIVA" | "VENCIDA" | "CANCELADA" | "SUSPENSA";

export type StatusPagamento = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
export type StatusContaPagar = "PENDENTE" | "PAGA" | "VENCIDA" | "CANCELADA";

export type TipoPagamento =
  | "MATRICULA"
  | "MENSALIDADE"
  | "TAXA"
  | "PRODUTO"
  | "AVULSO";

export type TipoVenda = "PLANO" | "SERVICO" | "PRODUTO";
export type StatusVenda = "RASCUNHO" | "FECHADA" | "CANCELADA";

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

export interface Endereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
}

export interface ContatoEmergencia {
  nome: string;
  telefone: string;
  parentesco?: string;
}

export interface Prospect {
  id: UUID;
  tenantId: UUID;
  responsavelId?: UUID;
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  origem: OrigemProspect;
  status: StatusProspect;
  observacoes?: string;
  dataCriacao: LocalDateTime;
  dataUltimoContato?: LocalDateTime;
  motivoPerda?: string;
  statusLog?: ProspectStatusLog[];
}

export interface Aluno {
  id: UUID;
  tenantId: UUID;
  prospectId?: UUID;
  nome: string;
  email: string;
  telefone: string;
  telefoneSec?: string;
  cpf: string;
  rg?: string;
  dataNascimento: LocalDate;
  sexo: Sexo;
  endereco?: Endereco;
  contatoEmergencia?: ContatoEmergencia;
  observacoesMedicas?: string;
  foto?: string;
  status: StatusAluno;
  suspensao?: {
    motivo: string;
    inicio?: LocalDate;
    fim?: LocalDate;
    detalhes?: string;
    arquivoBase64?: string;
  };
  suspensoes?: {
    motivo: string;
    inicio?: LocalDate;
    fim?: LocalDate;
    detalhes?: string;
    arquivoBase64?: string;
    dataRegistro: LocalDateTime;
  }[];
  dataCadastro: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface Atividade {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  categoria: CategoriaAtividade;
  icone?: string;
  cor?: string;
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
  ativo: boolean;
}

export type DiaSemana =
  | "SEG"
  | "TER"
  | "QUA"
  | "QUI"
  | "SEX"
  | "SAB"
  | "DOM";

export interface AtividadeGrade {
  id: UUID;
  tenantId: UUID;
  atividadeId: UUID;
  salaId?: UUID;
  funcionarioId?: UUID;
  diasSemana: DiaSemana[];
  definicaoHorario: "PREVIAMENTE" | "SOB_DEMANDA";
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  checkinLiberadoMinutosAntes: number;
  duracaoMinutos: number;
  codigo?: string;
  grupoAtividades?: string;
  publico?: string;
  dificuldade?: 1 | 2 | 3 | 4 | 5;
  descricaoAgenda?: string;
  acessoClientes: "TODOS_CLIENTES" | "APENAS_COM_CONTRATO_OU_SERVICO";
  permiteReserva: boolean;
  limitarVagasAgregadores: boolean;
  exibirWellhub: boolean;
  permitirSaidaAntesInicio: boolean;
  permitirEscolherNumeroVaga: boolean;
  exibirNoAppCliente: boolean;
  exibirNoAutoatendimento: boolean;
  exibirNoWodTv: boolean;
  finalizarAtividadeAutomaticamente: boolean;
  desabilitarListaEspera: boolean;
  local?: string;
  instrutor?: string;
  ativo: boolean;
}

export interface Plano {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  tipo: TipoPlano;
  duracaoDias: number;
  valor: number;
  valorMatricula: number;
  cobraAnuidade: boolean;
  valorAnuidade?: number;
  parcelasMaxAnuidade?: number;
  permiteRenovacaoAutomatica: boolean;
  permiteCobrancaRecorrente: boolean;
  diaCobrancaPadrao?: number;
  contratoTemplateHtml?: string;
  contratoAssinatura: ModoAssinaturaContrato;
  contratoEnviarAutomaticoEmail: boolean;
  atividades?: UUID[];
  beneficios?: string[];
  destaque: boolean;
  ativo: boolean;
  ordem?: number;
}

export interface Matricula {
  id: UUID;
  tenantId: UUID;
  alunoId: UUID;
  planoId: UUID;
  aluno?: Aluno;
  plano?: Plano;
  dataInicio: LocalDate;
  dataFim: LocalDate;
  valorPago: number;
  valorMatricula: number;
  desconto: number;
  motivoDesconto?: string;
  formaPagamento: TipoFormaPagamento;
  status: StatusMatricula;
  renovacaoAutomatica: boolean;
  observacoes?: string;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
  convenioId?: UUID;
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
  dataCriacao: LocalDateTime;
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

export interface VendaItem {
  id: UUID;
  tipo: TipoVenda;
  referenciaId: UUID;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  valorTotal: number;
}

export interface PagamentoVenda {
  formaPagamento: TipoFormaPagamento;
  parcelas?: number;
  valorPago: number;
  observacoes?: string;
}

export interface Venda {
  id: UUID;
  tenantId: UUID;
  tipo: TipoVenda;
  clienteId?: UUID;
  clienteNome?: string;
  status: StatusVenda;
  itens: VendaItem[];
  subtotal: number;
  descontoTotal: number;
  acrescimoTotal: number;
  total: number;
  pagamento: PagamentoVenda;
  dataCriacao: LocalDateTime;
}

export interface FormaPagamento {
  id: UUID;
  tenantId: UUID;
  nome: string;
  tipo: TipoFormaPagamento;
  taxaPercentual: number;
  parcelasMax: number;
  instrucoes?: string;
  ativo: boolean;
}

export interface Funcionario {
  id: UUID;
  nome: string;
  cargoId?: UUID;
  cargo?: string;
  podeMinistrarAulas: boolean;
  ativo: boolean;
}

export interface Cargo {
  id: UUID;
  tenantId: UUID;
  nome: string;
  ativo: boolean;
}

export interface Sala {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  capacidadePadrao?: number;
  ativo: boolean;
}

export interface BandeiraCartao {
  id: UUID;
  nome: string;
  taxaPercentual: number;
  diasRepasse: number;
  ativo: boolean;
}

export interface CartaoCliente {
  id: UUID;
  alunoId: UUID;
  bandeiraId: UUID;
  titular: string;
  cpfTitular?: string;
  ultimos4: string;
  validade: string;
  ativo: boolean;
  padrao?: boolean;
}

export interface Servico {
  id: UUID;
  tenantId: UUID;
  nome: string;
  sku?: string;
  categoria?: string;
  descricao?: string;
  sessoes?: number;
  duracaoMinutos?: number;
  validadeDias?: number;
  valor: number;
  custo?: number;
  comissaoPercentual?: number;
  aliquotaImpostoPercentual?: number;
  permiteDesconto: boolean;
  tipoCobranca: "UNICO" | "RECORRENTE";
  recorrenciaDias?: number;
  agendavel: boolean;
  permiteAcessoCatraca: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
}

export interface Produto {
  id: UUID;
  tenantId: UUID;
  nome: string;
  sku: string;
  codigoBarras?: string;
  categoria?: string;
  marca?: string;
  unidadeMedida: "UN" | "KG" | "G" | "L" | "ML" | "CX";
  descricao?: string;
  valorVenda: number;
  custo?: number;
  comissaoPercentual?: number;
  aliquotaImpostoPercentual?: number;
  controlaEstoque: boolean;
  estoqueAtual: number;
  estoqueMinimo?: number;
  permiteDesconto: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
}

export interface Presenca {
  id: UUID;
  alunoId: UUID;
  data: LocalDate;
  horario: string;
  origem: "CHECKIN" | "AULA" | "ACESSO";
  atividade?: string;
}

export interface Tenant {
  id: UUID;
  academiaId?: UUID;
  nome: string;
  razaoSocial?: string;
  documento?: string;
  groupId?: string;
  subdomain?: string;
  email?: string;
  telefone?: string;
  ativo?: boolean;
  endereco?: Endereco;
  branding?: TenantBranding;
  configuracoes?: TenantConfiguracoes;
}

export interface Academia {
  id: UUID;
  nome: string;
  razaoSocial?: string;
  documento?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  branding?: TenantBranding;
  ativo?: boolean;
}

export type TenantThemePreset =
  | "CONCEITO_DARK"
  | "AZUL_OCEANO"
  | "VERDE_ENERGIA"
  | "GRAFITE_FIRE";

export interface TenantThemeColors {
  accent: string;
  primary: string;
  ring: string;
  secondary: string;
  background: string;
  surface: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  danger: string;
  warning: string;
  teal: string;
}

export interface TenantBranding {
  appName?: string;
  logoUrl?: string;
  themePreset?: TenantThemePreset;
  useCustomColors?: boolean;
  colors?: Partial<TenantThemeColors>;
}

export type CupomPrintMode = "58MM" | "80MM" | "CUSTOM";

export interface TenantConfiguracoes {
  impressaoCupom?: {
    modo: CupomPrintMode;
    larguraCustomMm?: number;
  };
}

export interface HorarioFuncionamento {
  dia: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";
  abre: string;
  fecha: string;
  fechado?: boolean;
}

export interface Convenio {
  id: UUID;
  nome: string;
  ativo: boolean;
  descontoPercentual: number;
  planoIds?: UUID[];
  observacoes?: string;
}

export type VoucherCodeType = "UNICO" | "ALEATORIO";
export type VoucherAplicarEm = "CONTRATO" | "ANUIDADE";
export type VoucherEscopo = "UNIDADE" | "GRUPO";

export interface Voucher {
  id: UUID;
  tenantId?: UUID;
  groupId?: string;
  escopo: VoucherEscopo;
  tipo: string;
  nome: string;
  periodoInicio: LocalDate;
  periodoFim?: LocalDate;
  prazoDeterminado: boolean;
  quantidade?: number;
  ilimitado: boolean;
  codigoTipo: VoucherCodeType;
  usarNaVenda: boolean;
  planoIds?: UUID[];
  umaVezPorCliente: boolean;
  aplicarEm: VoucherAplicarEm[];
  ativo: boolean;
}

export interface VoucherCodigo {
  id: UUID;
  voucherId: UUID;
  codigo: string;
  usado: boolean;
  usadoPorAlunoId?: UUID;
  dataUso?: LocalDateTime;
}

export type CampanhaCanal = "WHATSAPP" | "EMAIL" | "SMS" | "LIGACAO";
export type CampanhaPublicoAlvo =
  | "EVADIDOS_ULTIMOS_3_MESES"
  | "PROSPECTS_EM_ABERTO"
  | "ALUNOS_INATIVOS";
export type CampanhaStatus = "RASCUNHO" | "ATIVA" | "ENCERRADA";

export interface CampanhaCRM {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  publicoAlvo: CampanhaPublicoAlvo;
  canais: CampanhaCanal[];
  voucherId?: UUID;
  dataInicio: LocalDate;
  dataFim?: LocalDate;
  status: CampanhaStatus;
  disparosRealizados: number;
  ultimaExecucao?: LocalDateTime;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
  audienceEstimado?: number;
}

// ─── Input/Request types ────────────────────────────────────────────────────

export interface CreateProspectInput {
  nome: string;
  telefone: string;
  email?: string;
  cpf?: string;
  origem: OrigemProspect;
  observacoes?: string;
  responsavelId?: UUID;
}

export interface ConverterProspectInput {
  prospectId: UUID;
  cpf: string;
  dataNascimento: LocalDate;
  sexo: Sexo;
  rg?: string;
  endereco?: Endereco;
  contatoEmergencia?: ContatoEmergencia;
  observacoesMedicas?: string;
  planoId: UUID;
  dataInicio: LocalDate;
  desconto?: number;
  motivoDesconto?: string;
  formaPagamento: TipoFormaPagamento;
}

export interface ConverterProspectResponse {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
}

export interface DashboardData {
  totalAlunosAtivos: number;
  prospectsNovos: number;
  matriculasDoMes: number;
  receitaDoMes: number;
  prospectsRecentes: Prospect[];
  matriculasVencendo: (Matricula & { aluno?: Aluno; plano?: Plano })[];
  pagamentosPendentes: (Pagamento & { aluno?: Aluno })[];
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

export interface ReceberPagamentoInput {
  dataPagamento: LocalDate;
  formaPagamento: TipoFormaPagamento;
  observacoes?: string;
}
