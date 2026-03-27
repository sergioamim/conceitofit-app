export type UUID = string;
export type LocalDate = string; // "YYYY-MM-DD"
export type LocalDateTime = string; // "YYYY-MM-DDTHH:mm:ss"

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  total?: number;
  hasNext: boolean;
}

export interface PaginatedAlunosResult extends PaginatedResult<Aluno> {
  totaisStatus?: AlunoTotaisStatus;
}

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

export interface AlunoTotaisStatus {
  total: number;
  totalAtivo: number;
  totalSuspenso: number;
  totalInativo: number;
  totalCancelado?: number;
  ativos?: number;
  suspensos?: number;
  inativos?: number;
  cancelados?: number;
}

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
export type StatusContratoPlano = "SEM_CONTRATO" | "PENDENTE_ASSINATURA" | "ASSINADO";
export type StatusFluxoComercial =
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_ASSINATURA"
  | "ATIVO"
  | "CANCELADO"
  | "VENCIDO";

export type StatusPagamento = "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
export type StatusContaPagar = "PENDENTE" | "PAGA" | "VENCIDA" | "CANCELADA";
export type TipoContaBancaria = "CORRENTE" | "POUPANCA" | "PAGAMENTO";
export type StatusCadastro = "ATIVA" | "INATIVA";
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
export type DreProjectionScenario = "BASE" | "OTIMISTA" | "CONSERVADOR";

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
  pendenteComplementacao?: boolean;
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
  estadoAtual?: {
    dataInicioContratoAtual?: LocalDate;
    dataFimContratoAtual?: LocalDate;
    descricaoContratoAtual?: string;
    dataInicioTreino?: LocalDate;
    dataValidadeTreino?: LocalDate;
  };
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

export interface TenantOperationalEligibilityReason {
  code: string;
  message: string;
}

export interface TenantOperationalEligibility {
  tenantId: UUID;
  tenantName?: string;
  eligible: boolean;
  defaultTenant?: boolean;
  blockedReasons: TenantOperationalEligibilityReason[];
}

export interface ClienteOperationalContext {
  tenantId: UUID;
  tenantName?: string;
  baseTenantId?: UUID;
  baseTenantName?: string;
  aluno: Aluno;
  eligibleTenants: TenantOperationalEligibility[];
  blockedTenants: TenantOperationalEligibility[];
  blocked: boolean;
  message?: string;
}

export interface ClienteMigracaoUnidadePayload {
  tenantDestinoId: UUID;
  justificativa: string;
  preservarContextoComercial?: boolean;
}

export interface ClienteMigracaoUnidadeResult {
  success: boolean;
  auditId?: string;
  eventType?: string;
  message?: string;
  tenantOrigemId?: UUID;
  tenantOrigemNome?: string;
  tenantDestinoId?: UUID;
  tenantDestinoNome?: string;
  baseTenantIdAnterior?: UUID;
  baseTenantIdAtual?: UUID;
  suggestedActiveTenantId?: UUID;
  preservarContextoComercial?: boolean;
  blockedBy?: ClienteExclusaoBlockedBy[];
  aluno?: Aluno;
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
  origemVendaId?: UUID;
  contratoStatus?: StatusContratoPlano;
  contratoModoAssinatura?: ModoAssinaturaContrato;
  contratoEnviadoAutomaticamente?: boolean;
  contratoUltimoEnvioEm?: LocalDateTime;
  contratoAssinadoEm?: LocalDateTime;
  pagamento?: PagamentoResumo;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
  convenioId?: UUID;
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
  statusCadastro: StatusCadastro;
}

export interface Maquininha {
  id: UUID;
  tenantId: UUID;
  nome: string;
  adquirente: AdquirenteMaquininha;
  terminal: string;
  contaBancariaId: UUID;
  statusCadastro: StatusCadastro;
}

export type NfseAmbiente = "HOMOLOGACAO" | "PRODUCAO";
export type NfseProvider = "GINFES" | "ABRASF" | "BETHA" | "ISSNET" | "IPM";
export type NfseRegimeTributario = "SIMPLES_NACIONAL" | "LUCRO_PRESUMIDO" | "LUCRO_REAL";
export type NfseClassificacaoTributaria =
  | "SERVICO_TRIBUTAVEL"
  | "RETENCAO"
  | "ISENTO"
  | "IMUNE"
  | "NAO_INCIDENTE"
  | (string & {});
export type NfseIndicadorOperacao =
  | "SERVICO_MUNICIPIO"
  | "SERVICO_FORA_MUNICIPIO"
  | "EXPORTACAO"
  | (string & {});
export type NfseConfiguracaoStatus = "PENDENTE" | "CONFIGURADA" | "ERRO";

export interface NfseConfiguracao {
  id: UUID;
  tenantId: UUID;
  ambiente: NfseAmbiente;
  provedor: NfseProvider;
  prefeitura: string;
  inscricaoMunicipal: string;
  cnaePrincipal: string;
  codigoTributacaoNacional: string;
  codigoNbs: string;
  classificacaoTributaria: NfseClassificacaoTributaria;
  consumidorFinal: boolean;
  indicadorOperacao: NfseIndicadorOperacao;
  serieRps: string;
  loteInicial: number;
  aliquotaPadrao: number;
  regimeTributario: NfseRegimeTributario;
  emissaoAutomatica: boolean;
  emailCopiaFinanceiro?: string;
  certificadoAlias?: string;
  webhookFiscalUrl?: string;
  status: NfseConfiguracaoStatus;
  ultimaValidacaoEm?: LocalDateTime;
  ultimaSincronizacaoEm?: LocalDateTime;
  ultimoErro?: string;
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

export type IntegracaoOperacionalTipo = "NFSE" | "ADQUIRENTE" | "CATRACA" | "WEBHOOK" | "IMPORTACAO";
export type IntegracaoOperacionalStatus = "SAUDAVEL" | "ATENCAO" | "FALHA" | "CONFIGURACAO_PENDENTE";
export type IntegracaoOcorrenciaSeveridade = "INFO" | "WARN" | "ERROR";

export interface IntegracaoOperacionalOcorrencia {
  id: UUID;
  integracaoId: UUID;
  severidade: IntegracaoOcorrenciaSeveridade;
  mensagem: string;
  codigo?: string;
  dataCriacao: LocalDateTime;
}

export interface IntegracaoOperacional {
  id: UUID;
  tenantId: UUID;
  nome: string;
  tipo: IntegracaoOperacionalTipo;
  fornecedor: string;
  status: IntegracaoOperacionalStatus;
  filaPendente: number;
  latenciaMs?: number;
  ultimaExecucaoEm?: LocalDateTime;
  ultimaSucessoEm?: LocalDateTime;
  ultimoErro?: string;
  linkDestino?: string;
  ocorrencias: IntegracaoOperacionalOcorrencia[];
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
  status?: "PAGO" | "PENDENTE";
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
  planoId?: UUID;
  matriculaId?: UUID;
  contratoStatus?: StatusContratoPlano;
  dataInicioContrato?: LocalDate;
  dataFimContrato?: LocalDate;
  dataCriacao: LocalDateTime;
}

export interface FormaPagamento {
  id: UUID;
  tenantId: UUID;
  nome: string;
  tipo: TipoFormaPagamento;
  taxaPercentual: number;
  parcelasMax: number;
  emitirAutomaticamente?: boolean;
  prazoRecebimentoDias?: number;
  instrucoes?: string;
  ativo: boolean;
}

export type FuncionarioStatusOperacional = "ATIVO" | "BLOQUEADO" | "INATIVO" | "DESLIGADO";
export type FuncionarioStatusAcesso = "SEM_ACESSO" | "ATIVO" | "CONVITE_PENDENTE" | "PRIMEIRO_ACESSO" | "BLOQUEADO";
export type FuncionarioOrigemCadastro = "MANUAL" | "IMPORTADO_EVO" | "CONVITE" | "SINCRONIZADO";
export type FuncionarioTipoContratacao = "CLT" | "PJ" | "ESTAGIO" | "AUTONOMO" | "HORISTA" | "OUTRO";
export type FuncionarioProvisionamentoAcesso = "SEM_ACESSO" | "CONVITE" | "REUTILIZAR_USUARIO";

export interface FuncionarioMembership {
  tenantId: UUID;
  tenantNome: string;
  roleName?: string;
  roleDisplayName?: string;
  defaultTenant?: boolean;
  active?: boolean;
  accessOrigin?: "MANUAL" | "HERDADO_POLITICA";
}

export interface FuncionarioEndereco {
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  pais?: string;
}

export interface FuncionarioEmergencia {
  nomeResponsavel?: string;
  telefoneResponsavel?: string;
  convenioMedico?: string;
  hospitalPreferencia?: string;
  alergias?: string;
  observacoes?: string;
}

export interface FuncionarioContratacao {
  tipo?: FuncionarioTipoContratacao;
  dataAdmissao?: string;
  dataDemissao?: string;
  cargoContratual?: string;
  salarioAtual?: number;
  banco?: string;
  agencia?: string;
  conta?: string;
  pixTipo?: "CPF" | "EMAIL" | "TELEFONE" | "ALEATORIA";
  pixValor?: string;
  observacoes?: string;
}

export interface FuncionarioHorario {
  id?: UUID;
  diaSemana: DiaSemana;
  horaInicio?: string;
  horaFim?: string;
  permiteForaHorario?: boolean;
  ativo?: boolean;
}

export interface FuncionarioNotificacoes {
  email?: boolean;
  whatsapp?: boolean;
  pendenciasOperacionais?: boolean;
  escala?: boolean;
}

export interface Funcionario {
  id: UUID;
  tenantId?: UUID;
  usuarioId?: string;
  externalId?: string;
  nome: string;
  nomeRegistro?: string;
  apelido?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  cargoId?: UUID;
  cargo?: string;
  emailProfissional?: string;
  emailPessoal?: string;
  celular?: string;
  telefone?: string;
  podeMinistrarAulas: boolean;
  permiteCatraca?: boolean;
  permiteForaHorario?: boolean;
  utilizaTecladoAcesso?: boolean;
  bloqueiaAcessoSistema?: boolean;
  coordenador?: boolean;
  alertaFuncionarios?: boolean;
  statusOperacional?: FuncionarioStatusOperacional;
  statusAcesso?: FuncionarioStatusAcesso;
  origemCadastro?: FuncionarioOrigemCadastro;
  possuiAcessoSistema?: boolean;
  provisionamentoAcesso?: FuncionarioProvisionamentoAcesso;
  tenantBaseId?: UUID;
  tenantBaseNome?: string;
  perfilAcessoInicialId?: string;
  perfilAcessoInicialNome?: string;
  memberships?: FuncionarioMembership[];
  endereco?: FuncionarioEndereco;
  emergencia?: FuncionarioEmergencia;
  contratacao?: FuncionarioContratacao;
  horarios?: FuncionarioHorario[];
  observacoes?: string;
  informacoesInternas?: string;
  notificacoes?: FuncionarioNotificacoes;
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

export type ReservaAulaStatus =
  | "CONFIRMADA"
  | "LISTA_ESPERA"
  | "CANCELADA"
  | "CHECKIN";
export type ReservaAulaOrigem = "PORTAL_CLIENTE" | "BACKOFFICE";

export interface AulaSessao {
  id: UUID;
  tenantId: UUID;
  atividadeGradeId: UUID;
  atividadeId: UUID;
  atividadeNome: string;
  data: LocalDate;
  diaSemana: DiaSemana;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  vagasOcupadas: number;
  vagasDisponiveis: number;
  waitlistTotal: number;
  permiteReserva: boolean;
  listaEsperaHabilitada: boolean;
  acessoClientes: AtividadeGrade["acessoClientes"];
  exibirNoAppCliente: boolean;
  exibirNoAutoatendimento: boolean;
  checkinLiberadoMinutosAntes: number;
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
  local?: string;
  salaNome?: string;
  instrutorNome?: string;
  origemTipo?: "GRADE_RECORRENTE" | "OCORRENCIA_AVULSA";
  ocorrenciaId?: UUID;
  definicaoHorario?: AtividadeGrade["definicaoHorario"];
}

export interface ReservaAula {
  id: UUID;
  tenantId: UUID;
  sessaoId: UUID;
  atividadeGradeId: UUID;
  atividadeId: UUID;
  atividadeNome: string;
  alunoId: UUID;
  alunoNome: string;
  data: LocalDate;
  horaInicio: string;
  horaFim: string;
  origem: ReservaAulaOrigem;
  status: ReservaAulaStatus;
  posicaoListaEspera?: number;
  checkinEm?: LocalDateTime;
  canceladaEm?: LocalDateTime;
  local?: string;
  instrutorNome?: string;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface AulaOcupacao {
  sessao: AulaSessao;
  confirmadas: ReservaAula[];
  waitlist: ReservaAula[];
  canceladas: ReservaAula[];
  checkinsRealizados: number;
}

export interface AtividadeOcorrenciaAvulsa {
  id: UUID;
  tenantId: UUID;
  atividadeGradeId: UUID;
  atividadeId: UUID;
  atividadeNome?: string;
  data: LocalDate;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  local?: string;
  salaNome?: string;
  instrutorNome?: string;
  observacoes?: string;
  origemTipo: "OCORRENCIA_AVULSA";
}

export interface ClienteExclusaoBlockedBy {
  code: string;
  message: string;
}

export interface ClienteExclusaoResult {
  success: boolean;
  auditId?: string;
  eventType?: string;
  blockedBy?: ClienteExclusaoBlockedBy[];
  message?: string;
}

export interface Treino {
  id: UUID;
  tenantId: UUID;
  alunoId?: UUID;
  alunoNome?: string;
  nome?: string;
  objetivo?: string;
  divisao?: string; // A, B, C...
  metaSessoesSemana?: number;
  frequenciaPlanejada?: number;
  quantidadePrevista?: number;
  dataInicio?: LocalDate;
  dataFim?: LocalDate;
  atividadeId?: UUID;
  atividadeNome?: string;
  funcionarioId?: UUID;
  funcionarioNome?: string;
  vencimento?: LocalDate; // compat de UI; mapeia para dataFim
  observacoes?: string;
  status?: "RASCUNHO" | "ATIVO" | "ARQUIVADO" | "CANCELADO";
  tipoTreino?: "PRE_MONTADO" | "CUSTOMIZADO";
  treinoBaseId?: UUID;
  templateNome?: string;
  diasParaVencimento?: number | null;
  statusValidade?: "ATIVO" | "VENCENDO" | "VENCIDO" | null;
  statusCiclo?: "PLANEJADO" | "EM_DIA" | "ATENCAO" | "ATRASADO" | "ENCERRADO";
  revisaoAtual?: number;
  ultimaRevisaoEm?: LocalDateTime;
  proximaRevisaoEm?: LocalDate;
  atribuicaoOrigem?: "MANUAL" | "TEMPLATE" | "RENOVACAO";
  atribuidoEm?: LocalDateTime;
  encerradoEm?: LocalDateTime;
  renovadoDeTreinoId?: UUID;
  execucoesPrevistas?: number;
  execucoesConcluidas?: number;
  aderenciaPercentual?: number;
  ativo: boolean;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
  itens?: TreinoItem[];
  revisoes?: TreinoRevisao[];
  execucoes?: TreinoExecucao[];
}

export interface TreinoItem {
  id: UUID;
  treinoId: UUID;
  exercicioId: UUID;
  exercicioNome?: string;
  grupoMuscularId?: UUID;
  grupoMuscularNome?: string;
  ordem: number;
  series: number;
  repeticoes?: number;
  repeticoesMin?: number;
  repeticoesMax?: number;
  carga?: number;
  cargaSugerida?: number;
  intervaloSegundos?: number;
  tempoExecucaoSegundos?: number;
  observacao?: string;
  diasSemana?: string[];
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export interface Exercicio {
  id: UUID;
  tenantId: UUID;
  nome: string;
  grupoMuscularId?: UUID;
  grupoMuscular?: string;
  grupoMuscularNome?: string;
  equipamento?: string;
  descricao?: string;
  videoUrl?: string;
  unidade?: string;
  ativo: boolean;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export interface GrupoMuscular {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  categoria?: "SUPERIOR" | "INFERIOR" | "CORE" | "FUNCIONAL" | "OUTRO";
  ativo: boolean;
  criadoEm?: LocalDateTime;
  atualizadoEm?: LocalDateTime;
}

export interface TreinoRevisao {
  id: UUID;
  treinoId: UUID;
  tipo: "CRIACAO" | "REVISAO" | "RENOVACAO" | "ENCERRAMENTO" | "ATRIBUICAO";
  titulo: string;
  observacao?: string;
  criadoEm: LocalDateTime;
}

export interface TreinoExecucao {
  id: UUID;
  treinoId: UUID;
  alunoId?: UUID;
  data: LocalDate;
  status: "CONCLUIDA" | "PARCIAL" | "PULADA";
  observacao?: string;
  cargaMedia?: number;
  criadoEm: LocalDateTime;
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

export type UnidadeOnboardingStrategy = "CARGA_INICIAL" | "IMPORTAR_DEPOIS" | "PREPARAR_ETL";
export type UnidadeOnboardingStatus =
  | "PENDENTE_SEED"
  | "AGUARDANDO_IMPORTACAO"
  | "EM_IMPORTACAO"
  | "PRONTA"
  | "ERRO";
export type UnidadeOnboardingOrigem = "SEED" | "CSV" | "PACOTE" | "MANUAL";
export type UnidadeOnboardingEventType =
  | "UNIDADE_CRIADA"
  | "ESTRATEGIA_DEFINIDA"
  | "SEED_AGENDADO"
  | "IMPORTACAO_PREPARADA"
  | "JOB_CRIADO"
  | "JOB_STATUS_ATUALIZADO";

export interface UnidadeOnboardingEvent {
  id: UUID;
  tenantId: UUID;
  type: UnidadeOnboardingEventType;
  titulo: string;
  descricao?: string;
  status?: UnidadeOnboardingStatus;
  origem?: UnidadeOnboardingOrigem;
  jobId?: string;
  criadoEm: LocalDateTime;
}

export interface UnidadeOnboardingState {
  tenantId: UUID;
  academiaId?: UUID;
  estrategia: UnidadeOnboardingStrategy;
  status: UnidadeOnboardingStatus;
  evoFilialId?: string;
  ultimoJobId?: string;
  ultimaOrigem?: UnidadeOnboardingOrigem;
  ultimaMensagem?: string;
  criadoEm: LocalDateTime;
  atualizadoEm: LocalDateTime;
  eventos: UnidadeOnboardingEvent[];
}

export type TenantThemePreset =
  | "CONCEITO_DARK"
  | "AZUL_OCEANO"
  | "VERDE_ENERGIA"
  | "GRAFITE_FIRE"
  | "DRACULA"
  | "AREIA_SOLAR"
  | "NUVEM_CLARA"
  | "ROSA_EDITORIAL"
  | "COBALTO_NOTURNO"
  | "AURORA_BOREAL"
  | "TERRACOTA_SUAVE"
  | "MENTA_MODERNA";

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

export interface VoucherValidacaoResult {
  valido: boolean;
  mensagem: string;
  descontoPercentual: number;
  descontoValor?: number;
  escopo?: VoucherEscopo;
  planoIds?: UUID[];
  aplicarEm?: VoucherAplicarEm[];
  umaVezPorCliente?: boolean;
  voucherId?: UUID;
  codigo?: string;
}

export type CampanhaCanal = "WHATSAPP" | "EMAIL" | "SMS" | "LIGACAO";
export type CampanhaPublicoAlvo =
  | "EVADIDOS_ULTIMOS_3_MESES"
  | "PROSPECTS_EM_ABERTO"
  | "ALUNOS_INATIVOS";
export type CampanhaStatus = "RASCUNHO" | "ATIVA" | "ENCERRADA";
export type CrmTaskStatus =
  | "PENDENTE"
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "ATRASADA"
  | "CANCELADA";
export type CrmTaskPrioridade = "BAIXA" | "MEDIA" | "ALTA";
export type CrmTaskTipo =
  | "LIGACAO"
  | "WHATSAPP"
  | "EMAIL"
  | "VISITA"
  | "PROPOSTA"
  | "FOLLOW_UP";
export type CrmTaskOrigem = "MANUAL" | "AUTOMACAO" | "CADENCIA";
export type CrmPlaybookAcao =
  | "CHECKLIST"
  | "SCRIPT_WHATSAPP"
  | "LIGACAO"
  | "PROPOSTA"
  | "VISITA";
export type CrmCadenciaGatilho =
  | "NOVO_PROSPECT"
  | "SEM_RESPOSTA"
  | "VISITA_REALIZADA"
  | "MUDANCA_DE_ETAPA";
export type CrmCadenciaAcao = "WHATSAPP" | "EMAIL" | "LIGACAO" | "TAREFA_INTERNA";
export type CrmAutomationGatilho =
  | "PROSPECT_CRIADO"
  | "ETAPA_ALTERADA"
  | "TAREFA_ATRASADA"
  | "CADENCIA_CONCLUIDA";
export type CrmAutomationAcao =
  | "CRIAR_TAREFA"
  | "INICIAR_CADENCIA"
  | "APLICAR_PLAYBOOK"
  | "NOTIFICAR_RESPONSAVEL";
export type CrmActivityTipo =
  | "PROSPECT_CRIADO"
  | "ETAPA_ALTERADA"
  | "FOLLOW_UP_REGISTRADO"
  | "TAREFA_CRIADA"
  | "TAREFA_CONCLUIDA"
  | "PLAYBOOK_ATUALIZADO"
  | "CADENCIA_ATIVADA"
  | "AUTOMACAO_ALTERADA";
export type CrmActivityOrigem = "OPERADOR" | "AUTOMACAO" | "SISTEMA";

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

export interface CrmPipelineStage {
  id: UUID;
  tenantId: UUID;
  status: StatusProspect;
  nome: string;
  ordem: number;
  descricao: string;
  objetivo: string;
  slaHoras: number;
  ativo: boolean;
  accentClass?: string;
}

export interface CrmTask {
  id: UUID;
  tenantId: UUID;
  prospectId?: UUID;
  prospectNome?: string;
  stageStatus?: StatusProspect;
  titulo: string;
  descricao?: string;
  tipo: CrmTaskTipo;
  prioridade: CrmTaskPrioridade;
  status: CrmTaskStatus;
  responsavelId?: UUID;
  responsavelNome?: string;
  origem: CrmTaskOrigem;
  vencimentoEm: LocalDateTime;
  concluidaEm?: LocalDateTime;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface CrmPlaybookStep {
  id: UUID;
  titulo: string;
  descricao?: string;
  acao: CrmPlaybookAcao;
  prazoHoras: number;
  obrigatoria: boolean;
}

export interface CrmPlaybook {
  id: UUID;
  tenantId: UUID;
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  ativo: boolean;
  passos: CrmPlaybookStep[];
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface CrmCadenciaStep {
  id: UUID;
  titulo: string;
  acao: CrmCadenciaAcao;
  delayDias: number;
  template?: string;
  automatica: boolean;
}

export interface CrmCadencia {
  id: UUID;
  tenantId: UUID;
  nome: string;
  objetivo: string;
  stageStatus: StatusProspect;
  gatilho: CrmCadenciaGatilho;
  ativo: boolean;
  passos: CrmCadenciaStep[];
  ultimaExecucao?: LocalDateTime;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface CrmAutomation {
  id: UUID;
  tenantId: UUID;
  nome: string;
  descricao?: string;
  gatilho: CrmAutomationGatilho;
  acao: CrmAutomationAcao;
  stageStatus?: StatusProspect;
  ativo: boolean;
  execucoes: number;
  ultimaExecucao?: LocalDateTime;
  cadenceId?: UUID;
  playbookId?: UUID;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface CrmActivity {
  id: UUID;
  tenantId: UUID;
  prospectId?: UUID;
  prospectNome?: string;
  taskId?: UUID;
  tipo: CrmActivityTipo;
  titulo: string;
  descricao?: string;
  actorNome: string;
  actorId?: UUID;
  origem: CrmActivityOrigem;
  dataCriacao: LocalDateTime;
}

export interface CrmWorkspaceStageSummary {
  stageStatus: StatusProspect;
  stageNome: string;
  totalProspects: number;
  totalTarefas: number;
  slaHoras: number;
}

export interface CrmWorkspaceSnapshot {
  tenantId: UUID;
  totalProspectsAbertos: number;
  totalTarefasAbertas: number;
  totalTarefasAtrasadas: number;
  totalCadenciasAtivas: number;
  totalAutomacoesAtivas: number;
  estagios: CrmWorkspaceStageSummary[];
  proximasTarefas: CrmTask[];
  atividadesRecentes: CrmActivity[];
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
  statusAlunoCount: Record<StatusAluno, number>;
  prospectsEmAberto: number;
  followupPendente: number;
  visitasAguardandoRetorno: number;
  prospectsNovosAnterior: number;
  matriculasDoMesAnterior: number;
  receitaDoMesAnterior: number;
  ticketMedio: number;
  ticketMedioAnterior: number;
  pagamentosRecebidosMes: number;
  pagamentosRecebidosMesAnterior: number;
  vendasNovas: number;
  vendasRecorrentes: number;
  inadimplencia: number;
  aReceber: number;
}

export interface MetricasOperacionaisGlobalSerie {
  referencia: string;
  label: string;
  total: number;
}

export interface MetricasOperacionaisGlobalAcademia {
  academiaId?: UUID;
  academiaNome: string;
  unidades: number;
  alunosAtivos: number;
  matriculasAtivas: number;
  vendasMesQuantidade: number;
  vendasMesValor: number;
  ticketMedio: number;
}

export interface MetricasOperacionaisGlobal {
  totalAlunosAtivos: number;
  totalMatriculasAtivas: number;
  vendasMesQuantidade: number;
  vendasMesValor: number;
  ticketMedioGlobal: number;
  novosAlunosMes: number;
  novosAlunosMesAnterior: number;
  tendenciaCrescimentoPercentual: number;
  evolucaoNovosAlunos: MetricasOperacionaisGlobalSerie[];
  distribuicaoAcademias: MetricasOperacionaisGlobalAcademia[];
  generatedAt?: LocalDateTime;
}

export type BiEscopo = "UNIDADE" | "ACADEMIA";
export type BiSegmento = OrigemProspect | "TODOS";
export type BiKpiKey =
  | "CONVERSAO"
  | "OCUPACAO"
  | "INADIMPLENCIA"
  | "RETENCAO"
  | "RECEITA"
  | "ATIVOS";
export type BiQualityStatus = "OK" | "ATENCAO";

export interface BiKpiDefinition {
  key: BiKpiKey;
  label: string;
  description: string;
  unit: "%" | "currency" | "count";
}

export interface BiResumoOperacional {
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
  receita: number;
  ativos: number;
  prospects: number;
  conversoes: number;
  lugaresOcupados: number;
  lugaresDisponiveis: number;
  valorInadimplente: number;
  valorEmAberto: number;
}

export interface BiDeltaOperacional {
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
  receita: number;
  ativos: number;
}

export interface BiSeriePonto {
  label: string;
  periodoInicio: LocalDate;
  periodoFim: LocalDate;
  receita: number;
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
}

export interface BiBenchmarkTenant {
  tenantId: UUID;
  tenantNome: string;
  academiaId?: UUID;
  academiaNome?: string;
  receita: number;
  ativos: number;
  prospects: number;
  conversoes: number;
  conversaoPct: number;
  ocupacaoPct: number;
  inadimplenciaPct: number;
  retencaoPct: number;
}

export interface BiQualityItem {
  id: string;
  label: string;
  status: BiQualityStatus;
  detail: string;
}

export interface BiOperationalSnapshot {
  scope: BiEscopo;
  startDate: LocalDate;
  endDate: LocalDate;
  academiaId?: UUID;
  academiaNome?: string;
  tenantId?: UUID;
  tenantNome?: string;
  segmento: BiSegmento;
  kpis: BiResumoOperacional;
  deltas: BiDeltaOperacional;
  series: BiSeriePonto[];
  benchmark: BiBenchmarkTenant[];
  quality: BiQualityItem[];
  generatedAt: LocalDateTime;
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
  observacoes?: string;
}

export type RbacPermission = "VIEW" | "EDIT" | "MANAGE";

export interface RbacPerfil {
  id: UUID;
  tenantId: UUID;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface RbacPerfilCreatePayload {
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
}

export type RbacPerfilUpdatePayload = Partial<RbacPerfilCreatePayload>;

export interface RbacUser {
  id: UUID;
  tenantId: UUID;
  name: string;
  fullName?: string;
  email: string;
  active?: boolean;
}

export interface SecurityUserLoginIdentifierInput {
  label: string;
  value: string;
}

export interface RbacUserCreatePayload {
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  tenantIds: UUID[];
  defaultTenantId?: UUID;
  initialPerfilIds?: UUID[];
  loginIdentifiers?: SecurityUserLoginIdentifierInput[];
}

export interface RbacFeature {
  featureKey: string;
  name?: string;
  enabled: boolean;
  rollout: number;
}

export interface RbacFeatureConfig {
  enabled: boolean;
  rollout: number;
}

export interface RbacGrant {
  id?: UUID;
  tenantId?: UUID;
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
}

export interface RbacGrantPayload {
  roleName: string;
  featureKey: string;
  permission: RbacPermission;
  allowed: boolean;
}

export type RbacActionFilter = string;

export type RbacResourceTypeFilter = string;

export interface RbacAuditoriaItem {
  id: UUID;
  tenantId: UUID;
  action: string;
  resourceType: string;
  resourceId?: UUID;
  actorId?: UUID;
  actorName?: string;
  actorEmail?: string;
  createdAt: LocalDateTime;
  detalhes?: string;
}

export interface RbacPaginatedResult<T> {
  items: T[];
  page: number;
  size: number;
  hasNext: boolean;
  total?: number;
}

export type GlobalAdminUserStatus = "ATIVO" | "INATIVO" | "PENDENTE";
export type GlobalAdminScopeType = "UNIDADE" | "REDE" | "GLOBAL";

export type GlobalAdminMembershipOrigin =
  | "MANUAL"
  | "HERDADO_POLITICA"
  | "PERFIL_ADMIN"
  | "IMPORTACAO"
  | "SISTEMA";

export type GlobalAdminNewUnitsPolicyScope = "ACADEMIA_ATUAL" | "REDE";
export type GlobalAdminRiskLevel = "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
export type GlobalAdminReviewStatus = "EM_DIA" | "PENDENTE" | "VENCIDA";

export interface GlobalAdminAccessException {
  id: UUID;
  title: string;
  scopeLabel?: string;
  justification: string;
  expiresAt?: LocalDateTime;
  createdAt?: LocalDateTime;
  createdBy?: string;
  active: boolean;
}

export interface GlobalAdminRecentChange {
  id: UUID;
  title: string;
  description?: string;
  happenedAt?: LocalDateTime;
  actorName?: string;
  severity?: GlobalAdminRiskLevel;
}

export interface GlobalAdminReviewBoardItem {
  id: UUID;
  userId?: UUID;
  userName: string;
  title: string;
  description?: string;
  severity: GlobalAdminRiskLevel;
  dueAt?: LocalDateTime;
  category:
    | "REVISAO_PENDENTE"
    | "EXCECAO_EXPIRANDO"
    | "MUDANCA_RECENTE"
    | "ACESSO_AMPLO"
    | "PERFIL_SEM_DONO";
}

export interface GlobalAdminReviewBoard {
  pendingReviews: GlobalAdminReviewBoardItem[];
  expiringExceptions: GlobalAdminReviewBoardItem[];
  recentChanges: GlobalAdminReviewBoardItem[];
  broadAccess: GlobalAdminReviewBoardItem[];
  orphanProfiles: GlobalAdminReviewBoardItem[];
}

export interface GlobalAdminUnitRef {
  id: UUID;
  nome: string;
}

export interface GlobalAdminMembershipProfile {
  perfilId: UUID;
  roleName: string;
  displayName: string;
  active: boolean;
  inherited?: boolean;
}

export interface GlobalAdminMembership {
  id: UUID;
  userId: UUID;
  tenantId: UUID;
  tenantName: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  scopeType?: GlobalAdminScopeType;
  academiaId?: UUID;
  academiaName?: string;
  active: boolean;
  defaultTenant: boolean;
  accessOrigin: GlobalAdminMembershipOrigin;
  inheritedFrom?: string;
  tenantBaseId?: UUID;
  tenantBaseName?: string;
  activeTenantId?: UUID;
  activeTenantName?: string;
  eligibleForNewUnits?: boolean;
  profiles: GlobalAdminMembershipProfile[];
  availableProfiles?: RbacPerfil[];
  riskLevel?: GlobalAdminRiskLevel;
  riskFlags?: string[];
  broadAccess?: boolean;
  reviewStatus?: GlobalAdminReviewStatus;
  nextReviewAt?: LocalDateTime;
  exceptions?: GlobalAdminAccessException[];
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
}

export interface GlobalAdminNewUnitsPolicy {
  enabled: boolean;
  scope: GlobalAdminNewUnitsPolicyScope;
  academiaIds?: UUID[];
  inherited?: boolean;
  rationale?: string;
  sourceLabel?: string;
  updatedAt?: LocalDateTime;
}

export interface GlobalAdminUserSummary {
  id: UUID;
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  networkId?: UUID;
  networkName?: string;
  networkSubdomain?: string;
  networkSlug?: string;
  scopeType?: GlobalAdminScopeType;
  loginIdentifiers?: Array<{
    label: string;
    value: string;
  }>;
  domainLinksSummary?: string[];
  status: GlobalAdminUserStatus;
  active: boolean;
  academias: GlobalAdminUnitRef[];
  membershipsAtivos: number;
  membershipsTotal: number;
  perfis: string[];
  defaultTenantId?: UUID;
  defaultTenantName?: string;
  activeTenantId?: UUID;
  activeTenantName?: string;
  eligibleForNewUnits: boolean;
  broadAccess?: boolean;
  compatibilityMode?: boolean;
  riskLevel?: GlobalAdminRiskLevel;
  riskFlags?: string[];
  exceptionsCount?: number;
  reviewStatus?: GlobalAdminReviewStatus;
  nextReviewAt?: LocalDateTime;
}

export interface GlobalAdminUserDetail extends GlobalAdminUserSummary {
  createdAt?: LocalDateTime;
  lastLoginAt?: LocalDateTime;
  memberships: GlobalAdminMembership[];
  policy: GlobalAdminNewUnitsPolicy;
  exceptions: GlobalAdminAccessException[];
  recentChanges: GlobalAdminRecentChange[];
}

export interface GlobalAdminUserCreatePayload {
  name: string;
  fullName?: string;
  email: string;
  userKind?: string;
  scopeType: GlobalAdminScopeType;
  academiaId?: UUID;
  tenantIds?: UUID[];
  defaultTenantId?: UUID;
  broadAccess?: boolean;
  eligibleForNewUnits?: boolean;
  policyScope?: GlobalAdminNewUnitsPolicyScope;
  loginIdentifiers?: SecurityUserLoginIdentifierInput[];
}

export interface GlobalAdminSecurityOverview {
  totalUsers: number;
  activeMemberships: number;
  defaultUnitsConfigured: number;
  eligibleForNewUnits: number;
  broadAccessUsers?: number;
  expiringExceptions?: number;
  pendingReviews?: number;
  rolloutPercentage?: number;
  compatibilityModeUsers?: number;
}

export type SecurityBusinessScope = "UNIDADE" | "ACADEMIA" | "REDE";

export interface SecurityFeatureCatalogItem {
  featureKey: string;
  moduleKey: string;
  moduleLabel: string;
  capabilityLabel: string;
  businessLabel: string;
  description: string;
  actionLabels: string[];
  permissionLevels: RbacPermission[];
  riskLevel: GlobalAdminRiskLevel;
  scopes: SecurityBusinessScope[];
  requiresAudit: boolean;
  requiresApproval: boolean;
  requiresMfa: boolean;
  dependencies: string[];
  enabled: boolean;
  rollout: number;
  assignedProfiles: string[];
}

export interface SecurityProfileImpactSummary {
  users: number;
  memberships: number;
  academias: number;
  exceptions: number;
  broadAccessUsers: number;
  pendingReviews: number;
}

export interface SecurityProfileMatrixItem extends SecurityFeatureCatalogItem {
  permissions: RbacPermission[];
  impactedUsers: number;
  impactedMemberships: number;
}

export interface SecurityStandardizedProfile {
  id: UUID;
  tenantId: UUID;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
  objective: string;
  recommendedScope: SecurityBusinessScope;
  riskLevel: GlobalAdminRiskLevel;
  modules: string[];
  versionLabel: string;
  lastUpdatedAt?: LocalDateTime;
  featureCount: number;
  criticalFeatureCount: number;
  usersImpacted: number;
  membershipsImpacted: number;
  impact: SecurityProfileImpactSummary;
  matrix: SecurityProfileMatrixItem[];
}

/* ---------- Global Search (Backoffice) ---------- */

export type GlobalSearchPersonType = "ALUNO" | "FUNCIONARIO" | "ADMIN";

export interface GlobalSearchResult {
  id: UUID;
  tipo: GlobalSearchPersonType;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  academiaId?: UUID;
  academiaNome?: string;
  tenantId?: UUID;
  unidadeNome?: string;
  status?: string;
  /** URL relativa para navegar ao detalhe */
  href?: string;
}

export interface GlobalSearchResponse {
  items: GlobalSearchResult[];
  total: number;
  query: string;
}
