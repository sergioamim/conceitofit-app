import { expect, test } from "@playwright/test";
import {
  canAdvanceProspect,
  canTransitionProspectStatus,
  getNextProspectStatus,
  getSelectableProspectStatuses,
} from "../../src/lib/tenant/crm/prospect-status";

test.describe("prospect status flow", () => {
  // Ordem canônica do funil (confirmada com produto):
  // NOVO -> EM_CONTATO -> AGENDOU_VISITA -> VISITOU -> CONVERTIDO.
  // EM_CONTATO ocorre ANTES do agendamento (contato prévio); contato pós-visita
  // é tratado como follow-up dentro do estado VISITOU, sem alterar o enum.
  test("usa progressao canonica a partir de NOVO", async () => {
    expect(getNextProspectStatus("NOVO")).toBe("EM_CONTATO");
    expect(getNextProspectStatus("EM_CONTATO")).toBe("AGENDOU_VISITA");
    expect(getNextProspectStatus("AGENDOU_VISITA")).toBe("VISITOU");
    expect(getNextProspectStatus("VISITOU")).toBe("CONVERTIDO");
    expect(getNextProspectStatus("CONVERTIDO")).toBeNull();
  });

  test("so permite avancar para a proxima etapa ou marcar como perdido", async () => {
    expect(canAdvanceProspect("NOVO")).toBeTruthy();
    expect(canTransitionProspectStatus("NOVO", "EM_CONTATO")).toBeTruthy();
    expect(canTransitionProspectStatus("NOVO", "AGENDOU_VISITA")).toBeFalsy();
    expect(canTransitionProspectStatus("NOVO", "VISITOU")).toBeFalsy();
    expect(canTransitionProspectStatus("NOVO", "PERDIDO")).toBeTruthy();
    expect(canTransitionProspectStatus("CONVERTIDO", "PERDIDO")).toBeFalsy();
  });

  test("limita opcoes manuais do detalhe ao conjunto valido", async () => {
    expect(getSelectableProspectStatuses("NOVO")).toEqual([
      "NOVO",
      "EM_CONTATO",
      "PERDIDO",
    ]);
    expect(getSelectableProspectStatuses("EM_CONTATO")).toEqual([
      "EM_CONTATO",
      "AGENDOU_VISITA",
      "PERDIDO",
    ]);
  });
});
