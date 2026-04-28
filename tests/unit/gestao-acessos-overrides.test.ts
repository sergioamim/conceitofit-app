import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { atualizarOverridesUsuario } from "../../src/lib/api/gestao-acessos";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  saveAuthSession({
    token: "token-rbac",
    refreshToken: "refresh-rbac",
    activeTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
  });
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

describe("gestao acessos overrides", () => {
  test("atualizarOverridesUsuario usa PATCH no endpoint bulk de overrides do usuario", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          userId: 42,
          tenantId: "tenant-centro",
          perfilId: "perfil-gerente",
          perfilNome: "Gerente",
          overrides: [
            {
              capacidadeKey: "financeiro.caixa.fechar",
              tipo: "DENY",
              motivo: "Restrição operacional",
            },
          ],
        },
      },
    ]);

    try {
      const response = await atualizarOverridesUsuario(42, "tenant-centro", [
        {
          capacidadeKey: "financeiro.caixa.fechar",
          state: "DENY",
          motivo: "Restrição operacional",
        },
        {
          capacidadeKey: "crm.cliente.editar",
          state: "INHERIT",
        },
      ]);

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain(
        "/api/v1/auth/gestao-acessos/usuarios-perfil/42/tenant/tenant-centro/overrides",
      );
      expect(calls[0]?.method).toBe("PATCH");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        changes: [
          {
            capacidadeKey: "financeiro.caixa.fechar",
            state: "DENY",
            motivo: "Restrição operacional",
          },
          {
            capacidadeKey: "crm.cliente.editar",
            state: "INHERIT",
          },
        ],
      });
      expect(response.overrides).toHaveLength(1);
      expect(response.overrides[0]).toEqual({
        capacidadeKey: "financeiro.caixa.fechar",
        tipo: "DENY",
        motivo: "Restrição operacional",
      });
    } finally {
      restore();
    }
  });
});
