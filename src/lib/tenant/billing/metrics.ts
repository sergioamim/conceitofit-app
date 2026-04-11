/**
 * Métricas agregadas para dashboard de cobranças recorrentes.
 *
 * Converte uma lista de `Assinatura` em KPIs SaaS clássicos:
 * MRR, churn, inadimplência, ticket médio. Funções puras para
 * permitir testes unitários sem dependência de rede/React.
 */
import type { Assinatura, CicloAssinatura, StatusAssinatura } from "@/lib/types";

export interface BillingDashboardMetrics {
  /** Monthly Recurring Revenue — receita mensal normalizada das assinaturas ATIVA. */
  mrr: number;
  /** Annual Recurring Revenue — MRR × 12. */
  arr: number;
  /** Ticket médio mensal por assinante ativo. */
  ticketMedio: number;
  /** Taxa de churn: CANCELADA / (CANCELADA + ATIVA + SUSPENSA), em %. */
  churnRate: number;
  /** Taxa de inadimplência: VENCIDA / (VENCIDA + ATIVA), em %. */
  inadimplenciaRate: number;
  /** Valor financeiro em risco (soma das VENCIDA + SUSPENSA). */
  valorEmRisco: number;
  /** Contadores por status. */
  counts: Record<StatusAssinatura, number>;
  /** Total geral de assinaturas consideradas. */
  total: number;
}

/**
 * Normaliza o valor de uma assinatura para base mensal.
 * TRIMESTRAL/3, SEMESTRAL/6, ANUAL/12, MENSAL como está.
 */
export function normalizeValorMensal(valor: number, ciclo: CicloAssinatura): number {
  if (!Number.isFinite(valor) || valor <= 0) return 0;
  switch (ciclo) {
    case "MENSAL":
      return valor;
    case "TRIMESTRAL":
      return valor / 3;
    case "SEMESTRAL":
      return valor / 6;
    case "ANUAL":
      return valor / 12;
    default:
      return valor;
  }
}

function emptyCounts(): Record<StatusAssinatura, number> {
  return {
    ATIVA: 0,
    PENDENTE: 0,
    CANCELADA: 0,
    SUSPENSA: 0,
    VENCIDA: 0,
  };
}

export function calculateBillingMetrics(
  assinaturas: readonly Assinatura[],
): BillingDashboardMetrics {
  const counts = emptyCounts();
  let mrr = 0;
  let valorEmRisco = 0;

  for (const a of assinaturas) {
    counts[a.status] = (counts[a.status] ?? 0) + 1;
    if (a.status === "ATIVA") {
      mrr += normalizeValorMensal(a.valor, a.ciclo);
    }
    if (a.status === "VENCIDA" || a.status === "SUSPENSA") {
      valorEmRisco += normalizeValorMensal(a.valor, a.ciclo);
    }
  }

  const baseChurn = counts.CANCELADA + counts.ATIVA + counts.SUSPENSA;
  const churnRate = baseChurn > 0 ? (counts.CANCELADA / baseChurn) * 100 : 0;

  const baseInadimplencia = counts.VENCIDA + counts.ATIVA;
  const inadimplenciaRate =
    baseInadimplencia > 0 ? (counts.VENCIDA / baseInadimplencia) * 100 : 0;

  const ticketMedio = counts.ATIVA > 0 ? mrr / counts.ATIVA : 0;

  return {
    mrr,
    arr: mrr * 12,
    ticketMedio,
    churnRate,
    inadimplenciaRate,
    valorEmRisco,
    counts,
    total: assinaturas.length,
  };
}
