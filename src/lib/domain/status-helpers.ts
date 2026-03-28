import type {
  StatusAluno,
  StatusContaPagar,
  StatusMatricula,
  StatusPagamento,
  StatusProspect,
  StatusVenda,
  CobrancaStatus,
} from "@/lib/shared/types";

// ---------------------------------------------------------------------------
// Pagamento
// ---------------------------------------------------------------------------

export function isPagamentoPendente(status: StatusPagamento): boolean {
  return status === "PENDENTE";
}

export function isPagamentoPago(status: StatusPagamento): boolean {
  return status === "PAGO";
}

export function isPagamentoVencido(status: StatusPagamento): boolean {
  return status === "VENCIDO";
}

export function isPagamentoCancelado(status: StatusPagamento): boolean {
  return status === "CANCELADO";
}

export function isPagamentoEmAberto(status: StatusPagamento): boolean {
  return status === "PENDENTE" || status === "VENCIDO";
}

export const STATUS_PAGAMENTO_EM_ABERTO: readonly StatusPagamento[] = ["PENDENTE", "VENCIDO"];

// ---------------------------------------------------------------------------
// Cobrança (mesmo shape de StatusPagamento)
// ---------------------------------------------------------------------------

export function isCobrancaEmAberto(status: CobrancaStatus): boolean {
  return status === "PENDENTE" || status === "VENCIDO";
}

export function isCobrancaPendente(status: CobrancaStatus): boolean {
  return status === "PENDENTE";
}

// ---------------------------------------------------------------------------
// Conta a Pagar
// ---------------------------------------------------------------------------

export function isContaPagarPendente(status: StatusContaPagar): boolean {
  return status === "PENDENTE";
}

export function isContaPagarEmAberto(status: StatusContaPagar): boolean {
  return status === "PENDENTE" || status === "VENCIDA";
}

export const STATUS_CONTA_PAGAR_EM_ABERTO: readonly StatusContaPagar[] = ["PENDENTE", "VENCIDA"];

// ---------------------------------------------------------------------------
// Aluno
// ---------------------------------------------------------------------------

export function isAlunoAtivo(status: StatusAluno): boolean {
  return status === "ATIVO";
}

export function isAlunoCancelado(status: StatusAluno): boolean {
  return status === "CANCELADO";
}

// ---------------------------------------------------------------------------
// Matrícula
// ---------------------------------------------------------------------------

export function isMatriculaAtiva(status: StatusMatricula): boolean {
  return status === "ATIVA";
}

export function isMatriculaVencida(status: StatusMatricula): boolean {
  return status === "VENCIDA";
}

export function isMatriculaCancelada(status: StatusMatricula): boolean {
  return status === "CANCELADA";
}

// ---------------------------------------------------------------------------
// Prospect
// ---------------------------------------------------------------------------

export function isProspectConvertido(status: StatusProspect): boolean {
  return status === "CONVERTIDO";
}

export function isProspectPerdido(status: StatusProspect): boolean {
  return status === "PERDIDO";
}

// ---------------------------------------------------------------------------
// Venda
// ---------------------------------------------------------------------------

export function isVendaFechada(status: StatusVenda): boolean {
  return status === "FECHADA";
}

export function isVendaCancelada(status: StatusVenda): boolean {
  return status === "CANCELADA";
}
