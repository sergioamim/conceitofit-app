import type {
  AcademiaContractStatus,
  AcademiaHealthLevel,
  AcademiaHealthStatus,
} from "@/lib/types";

export type HealthFilter = "TODOS" | AcademiaHealthLevel;

export function formatPercent(value: number) {
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
}

export function formatDateTime(value?: string) {
  if (!value) return "Sem login recente";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Sem login recente";
  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export function resolveContractBadgeClass(status: AcademiaContractStatus) {
  switch (status) {
    case "ATIVO":
      return "border-gym-teal/30 bg-gym-teal/10 text-gym-teal";
    case "EM_RISCO":
      return "border-gym-warning/30 bg-gym-warning/10 text-gym-warning";
    case "SUSPENSO":
      return "border-gym-danger/30 bg-gym-danger/10 text-gym-danger";
    case "CANCELADO":
    default:
      return "border-border bg-secondary text-muted-foreground";
  }
}

export function calculateDaysSinceLogin(lastLogin?: string) {
  if (!lastLogin) return undefined;
  const loginDate = new Date(lastLogin);
  if (Number.isNaN(loginDate.getTime())) return undefined;
  const now = Date.now();
  const diff = now - loginDate.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export function classifyAcademiaHealth(input: {
  alunosAtivos: number;
  inadimplenciaPercentual: number;
  ultimoLoginAdmin?: string;
}): AcademiaHealthLevel {
  const diasSemLogin = calculateDaysSinceLogin(input.ultimoLoginAdmin);
  if (
    input.alunosAtivos < 10 ||
    input.inadimplenciaPercentual > 20 ||
    (typeof diasSemLogin === "number" && diasSemLogin >= 30)
  ) {
    return "CRITICO";
  }

  if (
    (input.alunosAtivos >= 10 && input.alunosAtivos <= 50) ||
    (input.inadimplenciaPercentual >= 10 && input.inadimplenciaPercentual <= 20)
  ) {
    return "RISCO";
  }

  return "SAUDAVEL";
}

export function buildHealthAlerts(input: {
  alunosAtivos: number;
  inadimplenciaPercentual: number;
  diasSemLoginAdmin?: number;
  statusContrato: AcademiaContractStatus;
}): string[] {
  const alerts: string[] = [];

  if (input.alunosAtivos < 10) {
    alerts.push("Base de alunos abaixo de 10 ativos.");
  } else if (input.alunosAtivos <= 50) {
    alerts.push("Base de alunos em faixa de atenção.");
  }

  if (input.inadimplenciaPercentual > 20) {
    alerts.push("Inadimplência acima de 20%.");
  } else if (input.inadimplenciaPercentual >= 10) {
    alerts.push("Inadimplência em faixa de risco.");
  }

  if (typeof input.diasSemLoginAdmin === "number" && input.diasSemLoginAdmin >= 30) {
    alerts.push("Admin sem login há 30 dias ou mais.");
  }

  if (input.statusContrato === "EM_RISCO" || input.statusContrato === "SUSPENSO") {
    alerts.push(`Contrato em estado ${input.statusContrato.toLowerCase().replace("_", " ")}.`);
  }

  return alerts;
}

export function normalizeAcademiaHealthStatus(item: AcademiaHealthStatus): AcademiaHealthStatus {
  const diasSemLoginAdmin = item.diasSemLoginAdmin ?? calculateDaysSinceLogin(item.ultimoLoginAdmin);
  const healthLevel = classifyAcademiaHealth({
    alunosAtivos: item.alunosAtivos,
    inadimplenciaPercentual: item.inadimplenciaPercentual,
    ultimoLoginAdmin: item.ultimoLoginAdmin,
  });
  const alertasRisco =
    item.alertasRisco?.length > 0
      ? item.alertasRisco
      : buildHealthAlerts({
          alunosAtivos: item.alunosAtivos,
          inadimplenciaPercentual: item.inadimplenciaPercentual,
          diasSemLoginAdmin,
          statusContrato: item.statusContrato,
        });

  return {
    ...item,
    diasSemLoginAdmin,
    healthLevel,
    alertasRisco,
  };
}

export function filterAcademiasHealthMap(
  items: AcademiaHealthStatus[],
  filters: {
    healthLevel: HealthFilter;
    planoContratado: string;
  }
) {
  return items.filter((item) => {
    if (filters.healthLevel !== "TODOS" && item.healthLevel !== filters.healthLevel) {
      return false;
    }
    if (filters.planoContratado && item.planoContratado !== filters.planoContratado) {
      return false;
    }
    return true;
  });
}
