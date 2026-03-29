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

function isPagamentoPendente(status: StatusPagamento): boolean {
  return status === "PENDENTE";
}

function isPagamentoPago(status: StatusPagamento): boolean {
  return status === "PAGO";
}

function isPagamentoVencido(status: StatusPagamento): boolean {
  return status === "VENCIDO";
}

function isPagamentoCancelado(status: StatusPagamento): boolean {
  return status === "CANCELADO";
}

export function isPagamentoEmAberto(status: StatusPagamento): boolean {
  return status === "PENDENTE" || status === "VENCIDO";
}

const STATUS_PAGAMENTO_EM_ABERTO: readonly StatusPagamento[] = ["PENDENTE", "VENCIDO"];

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

const STATUS_CONTA_PAGAR_EM_ABERTO: readonly StatusContaPagar[] = ["PENDENTE", "VENCIDA"];

// ---------------------------------------------------------------------------
// Aluno
// ---------------------------------------------------------------------------

function isAlunoAtivo(status: StatusAluno): boolean {
  return status === "ATIVO";
}

function isAlunoCancelado(status: StatusAluno): boolean {
  return status === "CANCELADO";
}

// ---------------------------------------------------------------------------
// Matrícula
// ---------------------------------------------------------------------------

function isMatriculaAtiva(status: StatusMatricula): boolean {
  return status === "ATIVA";
}

function isMatriculaVencida(status: StatusMatricula): boolean {
  return status === "VENCIDA";
}

function isMatriculaCancelada(status: StatusMatricula): boolean {
  return status === "CANCELADA";
}

// ---------------------------------------------------------------------------
// Prospect
// ---------------------------------------------------------------------------

function isProspectConvertido(status: StatusProspect): boolean {
  return status === "CONVERTIDO";
}

function isProspectPerdido(status: StatusProspect): boolean {
  return status === "PERDIDO";
}

// ---------------------------------------------------------------------------
// Venda
// ---------------------------------------------------------------------------

function isVendaFechada(status: StatusVenda): boolean {
  return status === "FECHADA";
}

function isVendaCancelada(status: StatusVenda): boolean {
  return status === "CANCELADA";
}
