import { describe, expect, it } from "vitest";
import {
  parseServerSessionClaimsCookie,
  resolveServerActiveTenantIdFromCookies,
} from "@/lib/shared/server-session";

describe("server session helpers", () => {
  it("prioriza activeTenantId do cookie fc_session_claims", () => {
    const claimsCookie = encodeURIComponent(JSON.stringify({ activeTenantId: "tenant-claims" }));

    const tenantId = resolveServerActiveTenantIdFromCookies({
      sessionClaimsCookie: claimsCookie,
      legacyActiveTenantCookie: "tenant-legado",
    });

    expect(tenantId).toBe("tenant-claims");
  });

  it("usa cookie legado quando claims não tem tenant ativo", () => {
    const claimsCookie = encodeURIComponent(JSON.stringify({ displayName: "Operador" }));

    const tenantId = resolveServerActiveTenantIdFromCookies({
      sessionClaimsCookie: claimsCookie,
      legacyActiveTenantCookie: "tenant-legado",
    });

    expect(tenantId).toBe("tenant-legado");
  });

  it("ignora claims inválido sem quebrar o SSR", () => {
    expect(parseServerSessionClaimsCookie("%7BactiveTenantId")).toBeNull();

    const tenantId = resolveServerActiveTenantIdFromCookies({
      sessionClaimsCookie: "%7BactiveTenantId",
      legacyActiveTenantCookie: "tenant-legado",
    });

    expect(tenantId).toBe("tenant-legado");
  });
});
