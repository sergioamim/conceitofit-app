import type {
  Aluno,
  StatusAluno,
  StatusContaPagar,
  StatusContrato,
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

function isContratoAtivo(status: StatusContrato): boolean {
  return status === "ATIVA";
}

function isContratoVencido(status: StatusContrato): boolean {
  return status === "VENCIDA";
}

function isContratoCancelado(status: StatusContrato): boolean {
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

// ---------------------------------------------------------------------------
// Halo do avatar do cliente (Perfil v3 — Wave 1)
// ---------------------------------------------------------------------------

export type HaloStatus = "ativo" | "atencao" | "critico" | "neutro";

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Deriva a cor do halo ao redor do avatar do cliente.
 * - critico: SUSPENSO, bloqueado, contrato vencido ou pendência financeira
 * - atencao: contrato vence em <= 14 dias ou sem contrato
 * - ativo: ATIVO sem sinais negativos
 * - neutro: INATIVO ou CANCELADO
 */
export function getClienteHaloStatus(params: {
  aluno: Aluno;
  suspenso: boolean;
  acessoBloqueado: boolean;
  pendenteFinanceiro: boolean;
  planoAtivo?: { dataFim: string } | null;
}): HaloStatus {
  const { aluno, suspenso, acessoBloqueado, pendenteFinanceiro, planoAtivo } = params;

  if (aluno.status === "INATIVO" || aluno.status === "CANCELADO") {
    return "neutro";
  }

  if (aluno.status === "SUSPENSO" || suspenso || acessoBloqueado || pendenteFinanceiro) {
    return "critico";
  }

  if (!planoAtivo) {
    return "atencao";
  }

  const now = new Date();
  const fimDate = parseLocalDate(planoAtivo.dataFim);
  const daysUntilEnd = daysBetween(now, fimDate);
  if (daysUntilEnd < 0) return "critico";
  if (daysUntilEnd <= 14) return "atencao";

  return "ativo";
}

export function getHaloRingClass(status: HaloStatus): string {
  switch (status) {
    case "ativo":
      return "ring-gym-teal/70";
    case "atencao":
      return "ring-gym-warning/70";
    case "critico":
      return "ring-gym-danger/70";
    case "neutro":
      return "ring-border";
  }
}
