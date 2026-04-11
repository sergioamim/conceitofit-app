import { describe, expect, it } from "vitest";
import {
  buildTenantAccessFromEligibility,
  normalizeOperationalAccess,
} from "@/lib/tenant/tenant-operational-access";
import type { TenantOperationalEligibility } from "@/lib/types";

describe("tenant-operational-access", () => {
  describe("normalizeOperationalAccess", () => {
    it("retorna undefined quando input null", () => {
      expect(normalizeOperationalAccess(null)).toBeUndefined();
      expect(normalizeOperationalAccess(undefined)).toBeUndefined();
    });

    it("normaliza shape completo", () => {
      const result = normalizeOperationalAccess({
        blocked: false,
        message: "  ok  ",
        eligibleTenants: [
          {
            tenantId: "t1",
            tenantNome: " Unidade A ",
            defaultTenant: true,
            blockedReasons: [],
          },
          {
            tenantId: "  ", // ignorado
            tenantNome: "x",
          },
        ],
        blockedTenants: [
          {
            tenantId: "t2",
            tenantNome: "Unidade B",
            blockedReasons: [
              { code: "DEBITO", message: "Aluno devedor" },
              { code: "", message: "ignored" }, // ignorado
              { code: "X", message: "  " }, // ignorado
            ],
          },
        ],
      });
      expect(result?.blocked).toBe(false);
      expect(result?.message).toBe("ok");
      expect(result?.eligibleTenants).toHaveLength(1);
      expect(result?.eligibleTenants[0].tenantId).toBe("t1");
      expect(result?.eligibleTenants[0].tenantName).toBe("Unidade A");
      expect(result?.blockedTenants).toHaveLength(1);
      expect(result?.blockedTenants[0].blockedReasons).toHaveLength(1);
      expect(result?.blockedTenants[0].blockedReasons[0].code).toBe("DEBITO");
    });

    it("message vazio/whitespace → undefined", () => {
      const result = normalizeOperationalAccess({
        blocked: true,
        message: "   ",
      });
      expect(result?.message).toBeUndefined();
      expect(result?.blocked).toBe(true);
    });

    it("listas null viram arrays vazios", () => {
      const result = normalizeOperationalAccess({
        blocked: false,
        eligibleTenants: null,
        blockedTenants: null,
      });
      expect(result?.eligibleTenants).toEqual([]);
      expect(result?.blockedTenants).toEqual([]);
    });

    it("defaultTenant coercido para boolean", () => {
      const result = normalizeOperationalAccess({
        blocked: false,
        eligibleTenants: [
          {
            tenantId: "t1",
            defaultTenant: null,
          },
        ],
      });
      expect(result?.eligibleTenants[0].defaultTenant).toBe(false);
    });
  });

  describe("buildTenantAccessFromEligibility", () => {
    it("filtra não-elegíveis", () => {
      const items: TenantOperationalEligibility[] = [
        {
          tenantId: "t1",
          tenantName: "A",
          eligible: true,
          defaultTenant: true,
          blockedReasons: [],
        },
        {
          tenantId: "t2",
          tenantName: "B",
          eligible: false,
          defaultTenant: false,
          blockedReasons: [],
        },
      ];
      const result = buildTenantAccessFromEligibility(items);
      expect(result).toHaveLength(1);
      expect(result[0].tenantId).toBe("t1");
    });

    it("primeiro tenant sem defaultTenant vira default", () => {
      const items: TenantOperationalEligibility[] = [
        {
          tenantId: "t1",
          eligible: true,
          defaultTenant: false,
          blockedReasons: [],
        },
        {
          tenantId: "t2",
          eligible: true,
          defaultTenant: false,
          blockedReasons: [],
        },
      ];
      const result = buildTenantAccessFromEligibility(items);
      expect(result[0].defaultTenant).toBe(true);
      expect(result[1].defaultTenant).toBe(false);
    });

    it("preserva defaultTenant explícito", () => {
      const items: TenantOperationalEligibility[] = [
        {
          tenantId: "t1",
          eligible: true,
          defaultTenant: false,
          blockedReasons: [],
        },
        {
          tenantId: "t2",
          eligible: true,
          defaultTenant: true,
          blockedReasons: [],
        },
      ];
      const result = buildTenantAccessFromEligibility(items);
      // primeiro index=0 vira default mesmo sem flag
      expect(result[0].defaultTenant).toBe(true);
      expect(result[1].defaultTenant).toBe(true);
    });

    it("array vazio", () => {
      expect(buildTenantAccessFromEligibility([])).toEqual([]);
    });
  });
});
