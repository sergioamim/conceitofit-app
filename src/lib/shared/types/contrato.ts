import { UUID, LocalDate, LocalDateTime, ModoAssinaturaContrato } from './comum';
import type { StatusContratoPlano } from './comum';
import type { StatusAssinatura } from './billing';
import { Aluno } from './aluno';
import { Plano } from './plano';
import { PagamentoResumo, TipoFormaPagamento } from './pagamento';

export type StatusContrato = "ATIVA" | "VENCIDA" | "CANCELADA" | "SUSPENSA";
export type StatusFluxoComercial =
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_ASSINATURA"
  | "ATIVO"
  | "CANCELADO"
  | "VENCIDO";

export interface Contrato {
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
  status: StatusContrato;
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
  assinaturaId?: UUID;
  assinaturaStatus?: StatusAssinatura;
}

export interface ContratoEdicaoResumo {
  contratoId: UUID;
  tenantId: UUID;
  alunoId?: UUID;
  dataInicioAnterior: LocalDate;
  dataInicioNova: LocalDate;
  dataFimAnterior: LocalDate;
  dataFimNova: LocalDate;
  duracaoEfetivaDias: number;
  diasCreditoPreservados: number;
  motivo: string;
  auditId: UUID;
}
