import { expect, test } from "@playwright/test";
import { listPerfisApi } from "../../src/lib/api/rbac";
import { listPerfisService, saveGrantService } from "../../src/lib/rbac/services";

function mockFetchWith(body: unknown, status = 200) {
  const calls: string[] = [];
  const previousFetch = global.fetch;
  global.fetch = ((input: RequestInfo | URL) => {
    calls.push(String(input));
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }) as typeof global.fetch;
  return {
    calls,
    restore: () => {
      global.fetch = previousFetch;
    },
  };
}

test.describe("RBAC services (unit)", () => {
  test("lista perfis converte paginação do envelope de resposta", async () => {
    const payload = {
      items: [
        {
          id: "perfil-admin",
          tenantId: "tenant-1",
          roleName: "ADMIN",
          displayName: "Administrador",
          active: true,
        },
      ],
      page: 2,
      size: 5,
      hasNext: true,
      total: 13,
    };

    const { calls, restore } = mockFetchWith(payload);
    try {
      const response = await listPerfisService({
        tenantId: "tenant-1",
        includeInactive: true,
        page: 2,
        size: 5,
      });

      expect(response.page).toBe(2);
      expect(response.size).toBe(5);
      expect(response.hasNext).toBe(true);
      expect(response.total).toBe(13);
      expect(response.items).toHaveLength(1);
      expect(calls).toHaveLength(1);
      expect(calls[0]).toContain("/api/v1/auth/perfis");
      expect(calls[0]).toContain("includeInactive=true");
      expect(calls[0]).toContain("page=2");
      expect(calls[0]).toContain("size=5");
      expect(calls[0]).toContain("envelope=true");
    } finally {
      restore();
    }
  });

  test("salva grant com contrato padrão do serviço", async () => {
    const { calls, restore } = mockFetchWith({
      roleName: "ADMIN",
      featureKey: "feature.treinos",
      permission: "VIEW",
      allowed: true,
    }, 201);
    try {
      const created = await saveGrantService({
        tenantId: "tenant-1",
        perfilRoleName: "ADMIN",
        featureKey: "feature.treinos",
        permission: "VIEW",
        allowed: true,
      });
      expect(created.roleName).toBe("ADMIN");
      expect(created.featureKey).toBe("feature.treinos");
      expect(calls).toHaveLength(1);
      expect(calls[0]).toContain("/api/v1/auth/features/grants");
    } finally {
      restore();
    }
  });

  test("propaga erro de validação do contrato", async () => {
    const { restore } = mockFetchWith({ message: "Validation error", fieldErrors: { roleName: "obrigatório" } }, 400);
    try {
      await expect(async () => listPerfisApi({ tenantId: "tenant-1", includeInactive: false })).rejects.toBeTruthy();
    } finally {
      restore();
    }
  });
});
