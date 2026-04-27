import { describe, expect, it } from "vitest";
import { normalizeStorefrontResolvePayload } from "@/proxy";

describe("normalizeStorefrontResolvePayload", () => {
  it("aceita o contrato atual do backend com tenantIds e academiaSlug", () => {
    const result = normalizeStorefrontResolvePayload("race", {
      academiaSlug: "race",
      tenantIds: ["tenant-race-1", "tenant-race-2"],
      nome: "Race Academia",
    });

    expect(result).toEqual({
      tenantId: "tenant-race-1",
      tenantSlug: "Race Academia",
      academiaSlug: "race",
    });
  });

  it("mantem compatibilidade com o contrato legado com tenantId e slug", () => {
    const result = normalizeStorefrontResolvePayload("race", {
      tenantId: "tenant-race-1",
      slug: "race",
    });

    expect(result).toEqual({
      tenantId: "tenant-race-1",
      tenantSlug: "race",
      academiaSlug: "race",
    });
  });

  it("retorna null quando nao consegue resolver tenant", () => {
    const result = normalizeStorefrontResolvePayload("race", {
      academiaSlug: "race",
      tenantIds: [],
    });

    expect(result).toBeNull();
  });
});
