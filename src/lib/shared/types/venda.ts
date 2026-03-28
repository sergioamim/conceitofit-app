import { UUID, LocalDate, LocalDateTime, LocalDate as LocalDateType } from './comum';
import type { StatusContratoPlano } from './comum';
import { TipoFormaPagamento } from './pagamento';

export type TipoVenda = "PLANO" | "SERVICO" | "PRODUTO";
export type StatusVenda = "RASCUNHO" | "FECHADA" | "CANCELADA";

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

export interface BandeiraCartao {
  id: UUID;
  nome: string;
  taxaPercentual: number;
  diasRepasse: number;
  ativo: boolean;
}

/* --- Voucher --- */

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
