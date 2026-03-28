import { describe, expect, it } from "vitest";
import { dedupeTenants } from "@/lib/tenant-context";
import type { Tenant } from "@/lib/types";

function makeTenant(id: string, nome: string): Tenant {
  return { id, nome, ativo: true };
}

describe("dedupeTenants", () => {
  it("removes duplicate tenants by id", () => {
    const tenants = [
      makeTenant("t1", "Unidade A"),
      makeTenant("t1", "Unidade A duplicada"),
      makeTenant("t2", "Unidade B"),
    ];
    const result = dedupeTenants(tenants);
    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe("Unidade A");
    expect(result[1].nome).toBe("Unidade B");
  });

  it("returns empty array for empty input", () => {
    expect(dedupeTenants([])).toEqual([]);
  });

  it("handles single tenant", () => {
    const result = dedupeTenants([makeTenant("t1", "Única")]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("t1");
  });
});
