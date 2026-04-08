import { UUID, LocalDate, LocalDateTime, Sexo, Endereco, ContatoEmergencia } from './comum';
import { Aluno } from './aluno';
import { Matricula } from './matricula';
import { Pagamento, TipoFormaPagamento } from './pagamento';

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

/* --- CRM --- */

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
  | "EMAIL" | "VISITA" | "PROPOSTA" | "FOLLOW_UP";
export type CrmTaskOrigem = "MANUAL" | "AUTOMACAO" | "CADENCIA";
export type CrmPlaybookAcao =
  | "CHECKLIST"
  | "SCRIPT_WHATSAPP"
  | "LIGACAO"
  | "PROPOSTA"
  | "VISITA"
  | "ENVIAR_WHATSAPP";
export type CrmCadenciaGatilho =
  | "NOVO_PROSPECT"
  | "SEM_RESPOSTA"
  | "VISITA_REALIZADA"
  | "MUDANCA_DE_ETAPA"
  | "CONVERSA_ABERTA"
  | "MENSAGEM_RECEBIDA"
  | "SEM_RESPOSTA_24H"
  | "SEM_RESPOSTA_48H"
  | "SEM_RESPOSTA_72H";
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

/* --- Cadence Execution Engine --- */

export type CrmCadenceExecutionStatus =
  | "EM_ANDAMENTO"
  | "CONCLUIDA"
  | "CANCELADA"
  | "ESCALADA";

export type CrmCadenceStepExecutionStatus =
  | "PENDENTE"
  | "EXECUTADO"
  | "PULADO"
  | "FALHA";

export type CrmEscalationAction =
  | "MOVER_ETAPA"
  | "CRIAR_TAREFA_URGENTE"
  | "NOTIFICAR_GESTOR"
  | "MARCAR_PERDIDO";

export interface CrmCadenceStepExecution {
  id: UUID;
  stepId: UUID;
  stepTitulo: string;
  acao: CrmCadenciaAcao;
  status: CrmCadenceStepExecutionStatus;
  agendadoPara: LocalDateTime;
  executadoEm?: LocalDateTime;
  erro?: string;
}

export interface CrmCadenceExecution {
  id: UUID;
  tenantId: UUID;
  cadenciaId: UUID;
  cadenciaNome: string;
  prospectId: UUID;
  prospectNome: string;
  status: CrmCadenceExecutionStatus;
  gatilho: CrmCadenciaGatilho;
  stageStatus: StatusProspect;
  passos: CrmCadenceStepExecution[];
  iniciadoEm: LocalDateTime;
  concluidoEm?: LocalDateTime;
  escaladoEm?: LocalDateTime;
  escalacaoAcao?: CrmEscalationAction;
  escalacaoMotivo?: string;
}

export interface CrmEscalationRule {
  id: UUID;
  tenantId: UUID;
  cadenciaId: UUID;
  nome: string;
  condicao: "TAREFA_VENCIDA" | "SEM_RESPOSTA_APOS_CADENCIA" | "SLA_EXCEDIDO";
  acao: CrmEscalationAction;
  parametros?: Record<string, string>;
  ativo: boolean;
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
