import type { LocalDate, LocalDateTime, UUID } from "./comum";

export type ContratoCreditoDiasOrigem =
  | "MASSA_REDE"
  | "MASSA_UNIDADE"
  | "MASSA_PLANO"
  | "INDIVIDUAL";

export interface ContratoCreditoDias {
  id: UUID;
  tenantId: UUID;
  contratoId: UUID;
  alunoId: UUID;
  dias: number;
  motivo: string;
  origem: ContratoCreditoDiasOrigem;
  autorizadoPorUsuarioId: number;
  autorizadoPorNome?: string;
  autorizadoPorPapel: string;
  emitidoEm: LocalDateTime;
  notificarCliente: boolean;
  dataFimAnterior: LocalDate;
  dataFimPosterior: LocalDate;
  estornado: boolean;
  estornadoEm?: LocalDateTime;
  estornadoPorUsuarioId?: number;
  estornadoPorNome?: string;
  estornoMotivo?: string;
}
