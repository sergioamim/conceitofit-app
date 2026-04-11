import { describe, expect, it } from "vitest";
import {
  canAdvanceProspect,
  canTransitionProspectStatus,
  getNextProspectStatus,
  getSelectableProspectStatuses,
} from "@/lib/tenant/crm/prospect-status";

/**
 * Fluxo canônico do funil (espelha CRM_STAGE_PRESETS em workspace.ts):
 *   NOVO → EM_CONTATO → AGENDOU_VISITA → VISITOU → CONVERTIDO
 * PERDIDO é terminal permitido a partir de qualquer status ativo.
 */
describe("prospect-status", () => {
  describe("getNextProspectStatus", () => {
    it("avança NOVO → EM_CONTATO", () => {
      expect(getNextProspectStatus("NOVO")).toBe("EM_CONTATO");
    });

    it("avança EM_CONTATO → AGENDOU_VISITA", () => {
      expect(getNextProspectStatus("EM_CONTATO")).toBe("AGENDOU_VISITA");
    });

    it("avança AGENDOU_VISITA → VISITOU", () => {
      expect(getNextProspectStatus("AGENDOU_VISITA")).toBe("VISITOU");
    });

    it("avança VISITOU → CONVERTIDO", () => {
      expect(getNextProspectStatus("VISITOU")).toBe("CONVERTIDO");
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
      expect(canAdvanceProspect("EM_CONTATO")).toBe(true);
      expect(canAdvanceProspect("AGENDOU_VISITA")).toBe(true);
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
      expect(canTransitionProspectStatus("EM_CONTATO", "EM_CONTATO")).toBe(true);
    });

    it("permite avançar um passo no fluxo canônico", () => {
      expect(canTransitionProspectStatus("NOVO", "EM_CONTATO")).toBe(true);
      expect(canTransitionProspectStatus("EM_CONTATO", "AGENDOU_VISITA")).toBe(true);
      expect(canTransitionProspectStatus("AGENDOU_VISITA", "VISITOU")).toBe(true);
      expect(canTransitionProspectStatus("VISITOU", "CONVERTIDO")).toBe(true);
    });

    it("não permite pular passos", () => {
      expect(canTransitionProspectStatus("NOVO", "AGENDOU_VISITA")).toBe(false);
      expect(canTransitionProspectStatus("NOVO", "VISITOU")).toBe(false);
      expect(canTransitionProspectStatus("NOVO", "CONVERTIDO")).toBe(false);
      expect(canTransitionProspectStatus("EM_CONTATO", "VISITOU")).toBe(false);
      expect(canTransitionProspectStatus("EM_CONTATO", "CONVERTIDO")).toBe(false);
    });

    it("permite ir para PERDIDO de qualquer status ativo", () => {
      expect(canTransitionProspectStatus("NOVO", "PERDIDO")).toBe(true);
      expect(canTransitionProspectStatus("EM_CONTATO", "PERDIDO")).toBe(true);
      expect(canTransitionProspectStatus("AGENDOU_VISITA", "PERDIDO")).toBe(true);
      expect(canTransitionProspectStatus("VISITOU", "PERDIDO")).toBe(true);
    });

    it("não permite ir para PERDIDO de CONVERTIDO", () => {
      expect(canTransitionProspectStatus("CONVERTIDO", "PERDIDO")).toBe(false);
    });

    it("idempotente: PERDIDO → PERDIDO é permitido (mesmo status)", () => {
      expect(canTransitionProspectStatus("PERDIDO", "PERDIDO")).toBe(true);
    });

    it("não permite voltar no fluxo", () => {
      expect(canTransitionProspectStatus("EM_CONTATO", "NOVO")).toBe(false);
      expect(canTransitionProspectStatus("AGENDOU_VISITA", "EM_CONTATO")).toBe(false);
      expect(canTransitionProspectStatus("VISITOU", "AGENDOU_VISITA")).toBe(false);
      expect(canTransitionProspectStatus("CONVERTIDO", "VISITOU")).toBe(false);
    });
  });

  describe("getSelectableProspectStatuses", () => {
    it("retorna current + next + PERDIDO para NOVO", () => {
      const opts = getSelectableProspectStatuses("NOVO");
      expect(opts).toContain("NOVO");
      expect(opts).toContain("EM_CONTATO");
      expect(opts).toContain("PERDIDO");
      expect(opts).toHaveLength(3);
    });

    it("retorna current + next + PERDIDO para EM_CONTATO", () => {
      const opts = getSelectableProspectStatuses("EM_CONTATO");
      expect(opts).toContain("EM_CONTATO");
      expect(opts).toContain("AGENDOU_VISITA");
      expect(opts).toContain("PERDIDO");
    });

    it("retorna current + CONVERTIDO + PERDIDO para VISITOU", () => {
      const opts = getSelectableProspectStatuses("VISITOU");
      expect(opts).toContain("VISITOU");
      expect(opts).toContain("CONVERTIDO");
      expect(opts).toContain("PERDIDO");
    });

    it("retorna apenas CONVERTIDO (sem next, sem PERDIDO) para CONVERTIDO", () => {
      const opts = getSelectableProspectStatuses("CONVERTIDO");
      expect(opts).toEqual(["CONVERTIDO"]);
    });

    it("retorna apenas PERDIDO para PERDIDO", () => {
      const opts = getSelectableProspectStatuses("PERDIDO");
      expect(opts).toEqual(["PERDIDO"]);
    });
  });
});
