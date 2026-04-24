import { UUID, LocalDate, LocalDateTime, ModoAssinaturaContrato, DiaSemana } from './comum';

export type CategoriaAtividade =
  | "MUSCULACAO"
  | "CARDIO"
  | "COLETIVA"
  | "LUTA"
  | "AQUATICA"
  | "OUTRA";

export type TipoPlano = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" | "AVULSO";

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
  diaCobrancaPadrao?: number[];
  contratoTemplateHtml?: string;
  contratoAssinatura: ModoAssinaturaContrato;
  contratoEnviarAutomaticoEmail: boolean;
  atividades?: UUID[];
  beneficios?: string[];
  destaque: boolean;
  ativo: boolean;
  ordem?: number;
}

export type CicloPlanoPlataforma = "MENSAL" | "ANUAL";
export type StatusContratoPlataforma = "ATIVO" | "SUSPENSO" | "CANCELADO" | "TRIAL";

export interface PlanoPlataforma {
  id: UUID;
  nome: string;
  descricao?: string;
  precoMensal: number;
  precoAnual?: number;
  ciclo: CicloPlanoPlataforma;
  maxUnidades?: number;
  maxAlunos?: number;
  featuresIncluidas: string[];
  ativo: boolean;
}

export interface ContratoPlataforma {
  id: UUID;
  academiaId: UUID;
  planoId: UUID;
  planoNome: string;
  academiaNome: string;
  dataInicio: LocalDate;
  dataFim?: LocalDate;
  ciclo: CicloPlanoPlataforma;
  valorMensal: number;
  status: StatusContratoPlataforma;
  motivoSuspensao?: string;
  historicoPlanosIds: UUID[];
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

export type TipoDescontoConvenio = "PERCENTUAL" | "VALOR_FIXO";

export interface Convenio {
  id: UUID;
  nome: string;
  ativo: boolean;
  tipoDesconto: TipoDescontoConvenio;
  /** Preenchido quando tipoDesconto === "PERCENTUAL" (0..100). */
  descontoPercentual: number;
  /** Preenchido quando tipoDesconto === "VALOR_FIXO" (R$). */
  descontoValor?: number;
  planoIds?: UUID[];
  /** Vazio/undefined = todas as formas aceitam o convênio. */
  formasPagamentoPermitidas?: import("./pagamento").TipoFormaPagamento[];
  observacoes?: string;
}

/* --- Aulas e Reservas --- */

export type ReservaAulaStatus =
  | "CONFIRMADA"
  | "LISTA_ESPERA"
  | "CANCELADA"
  | "CHECKIN";
export type ReservaAulaOrigem = "PORTAL_CLIENTE" | "PORTAL_ALUNO" | "BACKOFFICE";

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
