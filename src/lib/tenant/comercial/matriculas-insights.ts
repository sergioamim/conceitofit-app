import type { Aluno, Matricula, Plano } from "@/lib/types";

export type MatriculaInsightRow = Matricula & { aluno?: Aluno; plano?: Plano };

export type MatriculaActiveGroup = {
  label: string;
  count: number;
  value: number;
  percentage: number;
};

export type MatriculaMonthlySnapshot = {
  monthRows: MatriculaInsightRow[];
  activeGroups: MatriculaActiveGroup[];
  totalContracts: number;
  activeContracts: number;
  activePercentage: number;
  contractedRevenue: number;
  averageTicket: number;
  pendingSignature: number;
  insight: string;
};

function resolveReferenceDate(row: MatriculaInsightRow) {
  return row.dataCriacao || `${row.dataInicio}T00:00:00`;
}

export function sortMatriculasByRecency(rows: MatriculaInsightRow[]) {
  return [...rows].sort((left, right) => resolveReferenceDate(right).localeCompare(resolveReferenceDate(left)));
}

export function extractMonthKey(value?: string) {
  if (!value) return "";
  return value.slice(0, 7);
}

export function buildMonthKeyFromDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function formatMonthLabel(monthKey: string) {
  if (!monthKey || monthKey.length < 7) return "Mês atual";
  const [year, month] = monthKey.split("-");
  const months = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const index = Number(month) - 1;
  const monthLabel = months[index];
  if (!monthLabel || !year) return "Mês atual";
  return `${monthLabel}/${year}`;
}

export function formatDateLabel(value?: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function listAvailableMonthKeys(rows: MatriculaInsightRow[], fallbackMonthKey?: string) {
  const keys = new Set<string>();
  if (fallbackMonthKey) {
    keys.add(fallbackMonthKey);
  }

  for (const row of rows) {
    const monthKey = extractMonthKey(resolveReferenceDate(row));
    if (monthKey) {
      keys.add(monthKey);
    }
  }

  return [...keys].sort((left, right) => right.localeCompare(left));
}

function buildMatriculasMonthlySnapshot(
  rows: MatriculaInsightRow[],
  monthKey: string
): MatriculaMonthlySnapshot {
  const ordered = sortMatriculasByRecency(rows);
  const monthRows = ordered.filter((row) => extractMonthKey(resolveReferenceDate(row)) === monthKey);
  const totalContracts = monthRows.length;
  const activeRows = monthRows.filter((row) => row.status === "ATIVA");
  const activeContracts = activeRows.length;
  const contractedRevenue = monthRows.reduce(
    (total, row) => total + (row.pagamento?.valorFinal ?? row.valorPago ?? 0),
    0
  );
  const averageTicket = totalContracts > 0 ? contractedRevenue / totalContracts : 0;
  const pendingSignature = monthRows.filter((row) => row.contratoStatus === "PENDENTE_ASSINATURA").length;
  const activePercentage = totalContracts > 0 ? (activeContracts / totalContracts) * 100 : 0;

  const groupedMap = new Map<string, { label: string; count: number; value: number }>();
  for (const row of activeRows) {
    const label = row.plano?.nome?.trim() || "Sem plano";
    const current = groupedMap.get(label) ?? { label, count: 0, value: 0 };
    current.count += 1;
    current.value += row.pagamento?.valorFinal ?? row.valorPago ?? 0;
    groupedMap.set(label, current);
  }

  const grouped = [...groupedMap.values()].sort((left, right) => {
    if (right.count !== left.count) return right.count - left.count;
    return right.value - left.value;
  });

  const topGroups = grouped.slice(0, 4);
  const remaining = grouped.slice(4);
  if (remaining.length > 0) {
    topGroups.push({
      label: "Outros",
      count: remaining.reduce((total, item) => total + item.count, 0),
      value: remaining.reduce((total, item) => total + item.value, 0),
    });
  }

  const activeGroups = topGroups.map((group) => ({
    ...group,
    percentage: activeContracts > 0 ? (group.count / activeContracts) * 100 : 0,
  }));

  const mainGroup = activeGroups[0];
  const insight =
    pendingSignature > 0
      ? `${pendingSignature} contrato(s) aguardam assinatura neste mes.`
      : mainGroup && mainGroup.percentage >= 50
        ? `${mainGroup.label} concentra ${mainGroup.percentage.toFixed(0)}% da carteira ativa do mes.`
        : activeContracts > 0
          ? "Carteira ativa distribuida entre mais de um plano neste mes."
          : "Nenhum contrato ativo no recorte mensal atual.";

  return {
    monthRows,
    activeGroups,
    totalContracts,
    activeContracts,
    activePercentage,
    contractedRevenue,
    averageTicket,
    pendingSignature,
    insight,
  };
}
