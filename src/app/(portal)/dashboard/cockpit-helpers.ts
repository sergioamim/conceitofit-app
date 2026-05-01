import type { DashboardData, StatusAluno } from "@/lib/types";

export type NormalizedMetrics = DashboardData & {
  statusAlunoCount: Record<StatusAluno, number>;
};

export const KPI_RAIL_CLASS =
  "flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:snap-none sm:overflow-visible sm:pb-0 lg:grid-cols-4";

export function railFromShare(part: number, whole: number) {
  if (whole <= 0 || part <= 0) return 24;
  return Math.round(Math.min(100, Math.max(12, (part / whole) * 100)));
}

export function railMomentum(current: number, previous: number) {
  const m = Math.max(current, previous, 1);
  return Math.round(Math.min(100, Math.max(18, (current / m) * 100)));
}

export function deltaLabel(current: number, prev: number): { up: boolean; text: string } {
  const diff = current - prev;
  const up = diff >= 0;
  return { up, text: `${up ? "+" : ""}${diff.toLocaleString("pt-BR")}` };
}
