import { describe, expect, it } from "vitest";
import {
  canAdvanceProspect,
  canTransitionProspectStatus,
  getNextProspectStatus,
  getSelectableProspectStatuses,
} from "@/lib/tenant/crm/prospect-status";

describe("prospect-status", () => {
  describe("getNextProspectStatus", () => {
    it("avança NOVO → AGENDOU_VISITA", () => {
      expect(getNextProspectStatus("NOVO")).toBe("AGENDOU_VISITA");
    });

    it("avança AGENDOU_VISITA → VISITOU", () => {
      expect(getNextProspectStatus("AGENDOU_VISITA")).toBe("VISITOU");
    });

    it("avança VISITOU → EM_CONTATO", () => {
      expect(getNextProspectStatus("VISITOU")).toBe("EM_CONTATO");
    });

    it("avança EM_CONTATO → CONVERTIDO", () => {
      expect(getNextProspectStatus("EM_CONTATO")).toBe("CONVERTIDO");
    });

    it("retorna null para CONVERTIDO (fim do fluxo)", () => {
      expect(getNextProspectStatus("CONVERTIDO")).toBeNull();
    });

    it("retorna null para PERDIDO (fora do fluxo)", () => {
      expect(getNextProspectStatus("PERDIDO")).toBeNull();
    });
  });

  describe("canAdvanceProspect", () => {
    it("true para status com próximo passo", () => {
      expect(canAdvanceProspect("NOVO")).toBe(true);
      expect(canAdvanceProspect("VISITOU")).toBe(true);
    });

    it("false para CONVERTIDO e PERDIDO", () => {
      expect(canAdvanceProspect("CONVERTIDO")).toBe(false);
      expect(canAdvanceProspect("PERDIDO")).toBe(false);
    });
  });

  describe("canTransitionProspectStatus", () => {
    it("permite manter o mesmo status", () => {
      expect(canTransitionProspectStatus("NOVO", "NOVO")).toBe(true);
    });

    it("permite avançar um passo no fluxo", () => {
      expect(canTransitionProspectStatus("NOVO", "AGENDOU_VISITA")).toBe(true);
      expect(canTransitionProspectStatus("VISITOU", "EM_CONTATO")).toBe(true);
    });

    it("não permite pular passos", () => {
      expect(canTransitionProspectStatus("NOVO", "VISITOU")).toBe(false);
      expect(canTransitionProspectStatus("NOVO", "CONVERTIDO")).toBe(false);
    });

    it("permite ir para PERDIDO de qualquer status não-final", () => {
      expect(canTransitionProspectStatus("NOVO", "PERDIDO")).toBe(true);
      expect(canTransitionProspectStatus("VISITOU", "PERDIDO")).toBe(true);
      expect(canTransitionProspectStatus("EM_CONTATO", "PERDIDO")).toBe(true);
    });

    it("não permite ir para PERDIDO de CONVERTIDO ou PERDIDO", () => {
      expect(canTransitionProspectStatus("CONVERTIDO", "PERDIDO")).toBe(false);
      expect(canTransitionProspectStatus("PERDIDO", "PERDIDO")).toBe(true); // mesmo status
    });

    it("não permite voltar status", () => {
      expect(canTransitionProspectStatus("VISITOU", "NOVO")).toBe(false);
    });
  });

  describe("getSelectableProspectStatuses", () => {
    it("retorna current + next + PERDIDO para status normal", () => {
      const opts = getSelectableProspectStatuses("NOVO");
      expect(opts).toContain("NOVO");
      expect(opts).toContain("AGENDOU_VISITA");
      expect(opts).toContain("PERDIDO");
    });

    it("não inclui PERDIDO para CONVERTIDO", () => {
      const opts = getSelectableProspectStatuses("CONVERTIDO");
      expect(opts).not.toContain("PERDIDO");
      expect(opts).toContain("CONVERTIDO");
    });

    it("não inclui PERDIDO para PERDIDO", () => {
      const opts = getSelectableProspectStatuses("PERDIDO");
      expect(opts).toEqual(["PERDIDO"]);
    });

    it("não inclui next quando não existe (CONVERTIDO)", () => {
      const opts = getSelectableProspectStatuses("CONVERTIDO");
      expect(opts).toEqual(["CONVERTIDO"]);
    });
  });
});
