import { UUID, LocalDate, LocalDateTime, ModoAssinaturaContrato } from './comum';
import type { StatusContratoPlano } from './comum';
import type { StatusAssinatura } from './billing';
import { Aluno } from './aluno';
import { Plano } from './plano';
import { PagamentoResumo, TipoFormaPagamento } from './pagamento';

export type StatusMatricula = "ATIVA" | "VENCIDA" | "CANCELADA" | "SUSPENSA";
export type StatusFluxoComercial =
  | "AGUARDANDO_PAGAMENTO"
  | "AGUARDANDO_ASSINATURA"
  | "ATIVO"
  | "CANCELADO"
  | "VENCIDO";

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
  assinaturaId?: UUID;
  assinaturaStatus?: StatusAssinatura;
}
