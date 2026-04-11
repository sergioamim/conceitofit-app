import type { StatusProspect } from "@/lib/types";

/**
 * Ordem canônica do funil de vendas do CRM.
 *
 * Deve refletir a ordem apresentada pelas colunas do kanban
 * (CRM_STAGE_PRESETS em @/lib/tenant/crm/workspace.ts). Esta lista
 * é o ÚNICO source of truth das transições válidas: quem precisa da
 * sequência deve importar as funções daqui, nunca duplicar o array.
 *
 * Fluxo comercial:
 *   NOVO → EM_CONTATO → AGENDOU_VISITA → VISITOU → CONVERTIDO
 *
 * PERDIDO é um terminal permitido a partir de qualquer estado ativo
 * (tratado separadamente em `canTransitionProspectStatus`).
 */
export const PROSPECT_STATUS_FLOW: readonly StatusProspect[] = [
  "NOVO",
  "EM_CONTATO",
  "AGENDOU_VISITA",
  "VISITOU",
  "CONVERTIDO",
] as const;

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
