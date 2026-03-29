import { UUID, LocalDate, LocalDateTime } from './comum';

export type CicloAssinatura = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export type StatusAssinatura =
  | "ATIVA"
  | "CANCELADA"
  | "SUSPENSA"
  | "VENCIDA"
  | "INADIMPLENTE"
  | "TRIAL";

export type StatusCobrancaRecorrente =
  | "PENDENTE"
  | "PAGO"
  | "VENCIDO"
  | "CANCELADO"
  | "FALHA"
  | "ESTORNADO";

export interface Assinatura {
  id: UUID;
  tenantId: UUID;
  alunoId: UUID;
  alunoNome?: string;
  planoId: UUID;
  planoNome?: string;
  gatewayId?: UUID;
  gatewayAssinaturaId?: string;
  status: StatusAssinatura;
  valor: number;
  ciclo: CicloAssinatura;
  diaCobranca: number;
  dataInicio: LocalDate;
  dataFim?: LocalDate;
  proximaCobranca?: LocalDate;
  ultimaCobranca?: LocalDate;
  tentativasCobrancaFalha?: number;
  canceladaEm?: LocalDateTime;
  motivoCancelamento?: string;
  dataCriacao: LocalDateTime;
  dataAtualizacao?: LocalDateTime;
}

export interface CobrancaRecorrente {
  id: UUID;
  tenantId: UUID;
  assinaturaId: UUID;
  alunoId: UUID;
  alunoNome?: string;
  valor: number;
  status: StatusCobrancaRecorrente;
  dataVencimento: LocalDate;
  dataPagamento?: LocalDate;
  gatewayCobrancaId?: string;
  formaPagamento?: string;
  tentativas?: number;
  ultimaTentativaEm?: LocalDateTime;
  motivoFalha?: string;
  dataCriacao: LocalDateTime;
}

export interface CreateAssinaturaInput {
  alunoId: string;
  planoId: string;
  ciclo: CicloAssinatura;
  valor: number;
  diaCobranca: number;
  dataInicio: string;
  gatewayId?: string;
}

export interface CancelAssinaturaInput {
  motivo?: string;
}
