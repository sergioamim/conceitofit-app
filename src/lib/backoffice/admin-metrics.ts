import type { MetricasOperacionaisGlobalAcademia } from "@/lib/types";

export type OperacionalSortKey =
  | "academiaNome"
  | "unidades"
  | "alunosAtivos"
  | "matriculasAtivas"
  | "vendasMesQuantidade"
  | "vendasMesValor"
  | "ticketMedio";

export type OperacionalSortDirection = "asc" | "desc";

export interface OperacionalSortState {
  key: OperacionalSortKey;
  direction: OperacionalSortDirection;
}

export function formatCompactNumber(value: number) {
  return value.toLocaleString("pt-BR");
}

export function formatSignedPercent(value: number) {
  const normalized = Number.isFinite(value) ? value : 0;
  return `${normalized >= 0 ? "+" : ""}${normalized.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function resolveTrendTone(value: number) {
  if (value > 0) return "positive";
  if (value < 0) return "negative";
  return "neutral";
}

export function sortDistribuicaoAcademias(
  rows: MetricasOperacionaisGlobalAcademia[],
  sort: OperacionalSortState
): MetricasOperacionaisGlobalAcademia[] {
  const directionFactor = sort.direction === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    if (sort.key === "academiaNome") {
      return left.academiaNome.localeCompare(right.academiaNome, "pt-BR") * directionFactor;
    }

    const leftValue = left[sort.key];
    const rightValue = right[sort.key];
    return (Number(leftValue) - Number(rightValue)) * directionFactor;
  });
}

export function toggleSortState(
  current: OperacionalSortState,
  key: OperacionalSortKey
): OperacionalSortState {
  if (current.key !== key) {
    return { key, direction: key === "academiaNome" ? "asc" : "desc" };
  }

  return {
    key,
    direction: current.direction === "asc" ? "desc" : "asc",
  };
}
