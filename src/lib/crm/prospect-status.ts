import type { StatusProspect } from "@/lib/types";

const PROSPECT_STATUS_FLOW: StatusProspect[] = [
  "NOVO",
  "AGENDOU_VISITA",
  "VISITOU",
  "EM_CONTATO",
  "CONVERTIDO",
];

export function getNextProspectStatus(status: StatusProspect): StatusProspect | null {
  const index = PROSPECT_STATUS_FLOW.indexOf(status);
  if (index === -1 || index >= PROSPECT_STATUS_FLOW.length - 1) {
    return null;
  }
  return PROSPECT_STATUS_FLOW[index + 1] ?? null;
}

export function canAdvanceProspect(status: StatusProspect): boolean {
  return getNextProspectStatus(status) !== null;
}

export function canTransitionProspectStatus(current: StatusProspect, next: StatusProspect): boolean {
  if (current === next) return true;
  if (next === "PERDIDO") {
    return current !== "PERDIDO" && current !== "CONVERTIDO";
  }
  return getNextProspectStatus(current) === next;
}

export function getSelectableProspectStatuses(current: StatusProspect): StatusProspect[] {
  const options: StatusProspect[] = [current];
  const next = getNextProspectStatus(current);

  if (next) {
    options.push(next);
  }

  if (current !== "PERDIDO" && current !== "CONVERTIDO") {
    options.push("PERDIDO");
  }

  return options;
}
