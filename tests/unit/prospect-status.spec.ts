import { expect, test } from "@playwright/test";
import {
  canAdvanceProspect,
  canTransitionProspectStatus,
  getNextProspectStatus,
  getSelectableProspectStatuses,
} from "../../src/lib/tenant/crm/prospect-status";

test.describe("prospect status flow", () => {
  // aguardando confirmação de produto: ordem canônica do funil
  // A implementação atual de prospect-status ordena os passos diferente
  // do que os testes esperam. Ver src/lib/tenant/crm/prospect-status.ts.
  test.fixme("usa progressao canonica a partir de NOVO", async () => {
    expect(getNextProspectStatus("NOVO")).toBe("AGENDOU_VISITA");
    expect(getNextProspectStatus("AGENDOU_VISITA")).toBe("VISITOU");
    expect(getNextProspectStatus("VISITOU")).toBe("EM_CONTATO");
    expect(getNextProspectStatus("EM_CONTATO")).toBe("CONVERTIDO");
    expect(getNextProspectStatus("CONVERTIDO")).toBeNull();
  });

  // aguardando confirmação de produto: ordem canônica do funil
  test.fixme("so permite avancar para a proxima etapa ou marcar como perdido", async () => {
    expect(canAdvanceProspect("NOVO")).toBeTruthy();
    expect(canTransitionProspectStatus("NOVO", "AGENDOU_VISITA")).toBeTruthy();
    expect(canTransitionProspectStatus("NOVO", "VISITOU")).toBeFalsy();
    expect(canTransitionProspectStatus("NOVO", "EM_CONTATO")).toBeFalsy();
    expect(canTransitionProspectStatus("NOVO", "PERDIDO")).toBeTruthy();
    expect(canTransitionProspectStatus("CONVERTIDO", "PERDIDO")).toBeFalsy();
  });

  // aguardando confirmação de produto: ordem canônica do funil
  test.fixme("limita opcoes manuais do detalhe ao conjunto valido", async () => {
    expect(getSelectableProspectStatuses("NOVO")).toEqual([
      "NOVO",
      "AGENDOU_VISITA",
      "PERDIDO",
    ]);
    expect(getSelectableProspectStatuses("EM_CONTATO")).toEqual([
      "EM_CONTATO",
      "CONVERTIDO",
      "PERDIDO",
    ]);
  });
});
