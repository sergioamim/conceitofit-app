import { expect, test } from "@playwright/test";
import { queryKeys } from "../../src/lib/query/keys";
import { getQueryClient, makeQueryClient } from "../../src/lib/query/query-client";

test.describe("query hooks contracts", () => {
  test("gera query keys determinísticas e sem colisão entre parâmetros", async () => {
    expect(queryKeys.dashboard("tn-1", "2026-03-31")).toEqual(["dashboard", "tn-1", "2026-03-31", "FULL"]);
    expect(queryKeys.dashboard("tn-1", "2026-03-31")).toEqual(queryKeys.dashboard("tn-1", "2026-03-31"));
    expect(queryKeys.dashboard("tn-1", "2026-03-31")).not.toEqual(queryKeys.dashboard("tn-2", "2026-03-31"));
    expect(queryKeys.dashboard("tn-1", "2026-03-31", "CLIENTES")).not.toEqual(
      queryKeys.dashboard("tn-1", "2026-03-31", "FINANCEIRO"),
    );
    expect(queryKeys.clientes.list("tn-1", { page: 0, size: 20 })).not.toEqual(
      queryKeys.clientes.list("tn-1", { page: 1, size: 20 }),
    );
    expect(queryKeys.contratos.creditosDias("tn-1", "contrato-1")).toEqual(
      ["matriculas", "tn-1", "creditos-dias", "contrato-1"],
    );
    expect(queryKeys.recebimentos.list("tn-1", { startDate: "2026-03-01", endDate: "2026-03-31" })).not.toEqual(
      queryKeys.pagamentos.list("tn-1", { startDate: "2026-03-01", endDate: "2026-03-31" }),
    );
    expect(queryKeys.admin.seguranca.overview()).not.toEqual(queryKeys.admin.seguranca.reviewBoard());
  });

  test("instancia QueryClient com defaults estáveis", async () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions();

    expect(defaults.queries?.staleTime).toBe(5 * 60 * 1000);
    expect(defaults.queries?.retry).toBe(2);
    expect(defaults.queries?.refetchOnWindowFocus).toBeFalsy();
  });

  test("reutiliza singleton no browser e cria instâncias novas no servidor", async () => {
    const originalWindow = globalThis.window;

    try {
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        writable: true,
        value: {} as Window & typeof globalThis,
      });
      const browserClientA = getQueryClient();
      const browserClientB = getQueryClient();
      expect(browserClientA).toBe(browserClientB);
    } finally {
      if (originalWindow === undefined) {
        Reflect.deleteProperty(globalThis, "window");
      } else {
        Object.defineProperty(globalThis, "window", {
          configurable: true,
          writable: true,
          value: originalWindow,
        });
      }
    }

    const serverClientA = getQueryClient();
    const serverClientB = getQueryClient();
    expect(serverClientA).not.toBe(serverClientB);
  });
});
