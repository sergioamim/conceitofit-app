import { UUID, LocalDate, LocalDateTime, Sexo, Endereco, ContatoEmergencia, PaginatedResult } from './comum';

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

interface PaginatedAlunosResult extends PaginatedResult<Aluno> {
  totaisStatus?: AlunoTotaisStatus;
}

export interface Presenca {
  id: UUID;
  alunoId: UUID;
  data: LocalDate;
  horario: string;
  origem: "CHECKIN" | "AULA" | "ACESSO";
  atividade?: string;
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
