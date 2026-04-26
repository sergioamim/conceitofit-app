import { UUID, LocalDate, LocalDateTime, Sexo, Endereco, ContatoEmergencia } from './comum';

/**
 * Status operacional do aluno.
 *
 * Decisão de domínio (Task 458 follow-up):
 *  - BLOQUEADO é estado distinto de INATIVO.
 *    Ex.: BLOQUEADO = acesso suspenso por inadimplência;
 *         INATIVO  = plano vencido sem atividade.
 * Handlers exaustivos devem tratar "BLOQUEADO" explicitamente. UI que ainda
 * não saiba renderizar deve cair no fallback neutro (ex.: badge muted), sem
 * mapear para INATIVO (esse mapeamento perde informação de negócio).
 */
export type StatusAluno =
  | "ATIVO"
  | "INATIVO"
  | "SUSPENSO"
  | "CANCELADO"
  | "BLOQUEADO";

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
  passaporte?: string;
  rg?: string;
  dataNascimento: LocalDate;
  sexo: Sexo;
  endereco?: Endereco;
  contatoEmergencia?: ContatoEmergencia;
  responsavel?: {
    id?: UUID;
    clienteId?: UUID;
    nome: string;
    cpf?: string;
    email?: string;
    telefone?: string;
    parentesco?: string;
  };
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
  /** Notação de tempo de execução (ex: "2-0-1"). Wave 2 do PRD V3. */
  cadencia?: string;
  /** Reps in Reserve (0-10). Wave 2 do PRD V3. */
  rir?: number;
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
  /** URL de mídia rica — gif/imagem demonstrativa (preenchido por import do catálogo). */
  midiaUrl?: string;
  /** URL de thumbnail/imagem estática. */
  thumbnailUrl?: string;
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

// Task #539: alinhado ao enum TreinoExecucaoStatus do backend Java
// (INICIADA, CONCLUIDA, PARCIAL, ABANDONADA, CANCELADA). PULADA foi
// renomeada para ABANDONADA para bater com o DTO.
export type TreinoExecucaoStatus =
  | "INICIADA"
  | "CONCLUIDA"
  | "PARCIAL"
  | "ABANDONADA"
  | "CANCELADA";

export interface TreinoExecucao {
  id: UUID;
  treinoId: UUID;
  alunoId?: UUID;
  data: LocalDate;
  status: TreinoExecucaoStatus;
  observacao?: string;
  cargaMedia?: number;
  criadoEm: LocalDateTime;
}

/**
 * Resposta do endpoint GET /api/v1/treinos/aderencia (dashboard de aderência
 * para professor). Espelha TreinoCicloService.AderenciaTreinoResponse do BE.
 * Task #539.
 */
export type TreinoCicloStatus =
  | "ATIVO"
  | "ENCERRADO"
  | "PAUSADO"
  | "CANCELADO";

/**
 * Motivos de prescrição de treino — espelha enum TreinoMotivoPrescricao do BE.
 * Task #540.
 */
export type TreinoMotivoPrescricao =
  | "INICIAL"
  | "RENOVACAO"
  | "AJUSTE_OBJETIVO"
  | "POS_AVALIACAO"
  | "IMPORTACAO"
  | "OUTRO";

/**
 * Payload de prescrição enviado no POST /api/v1/treinos/{id}/prescricao.
 * Espelha PrescricaoTreinoRequest do BE. Task #540.
 */
export interface PrescricaoTreinoPayload {
  professorId?: UUID;
  frequenciaPlanejadaSemana?: number;
  quantidadePrevistaExecucoes?: number;
  motivoPrescricao?: TreinoMotivoPrescricao;
  observacoesPrescricao?: string;
  dataInicio?: LocalDate;
  dataFim?: LocalDate;
}

/**
 * Resposta completa de ciclo/prescrição de treino.
 * Espelha TreinoCicloResponse do BE. Task #540.
 */
export interface TreinoCicloResponse {
  cicloId: UUID;
  treinoId: UUID;
  clienteId?: UUID;
  professorId?: UUID;
  templateId?: UUID;
  templateVersaoSnapshot?: number;
  status: TreinoCicloStatus;
  revisaoNumero?: number;
  frequenciaPlanejadaSemana?: number;
  quantidadePrevistaExecucoes?: number;
  execucoesConcluidas?: number;
  aderenciaPercentual?: number;
  motivoPrescricao?: TreinoMotivoPrescricao;
  observacoesPrescricao?: string;
  dataInicio?: LocalDate;
  dataFim?: LocalDate;
  cicloAnteriorId?: UUID;
  createdAt?: LocalDateTime;
  updatedAt?: LocalDateTime;
  encerradoEm?: LocalDateTime;
}

export interface AderenciaTreino {
  cicloId: UUID;
  treinoId: UUID;
  treinoNome?: string;
  clienteId: UUID;
  clienteNome?: string;
  professorId?: UUID;
  professorNome?: string;
  status: TreinoCicloStatus;
  revisaoNumero?: number;
  frequenciaPlanejadaSemana?: number;
  quantidadePrevistaExecucoes?: number;
  execucoesConcluidas: number;
  aderenciaPercentual?: number;
  dataInicio?: LocalDate;
  dataFim?: LocalDate;
}
