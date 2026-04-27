import { expect, test } from "@playwright/test";

import { obterCapacidadesEfetivas } from "../../src/lib/api/gestao-acessos";

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

test.describe("gestao-acessos api", () => {
  test("aceita userId string ao consultar capacidades efetivas", async () => {
    const { calls, restore } = mockFetchWith(["matricula.credito-dias"]);

    try {
      const capacidades = await obterCapacidadesEfetivas("42", "tenant-1");
      expect(capacidades).toEqual(["matricula.credito-dias"]);

      const call = calls.find((item) =>
        item.includes("/api/v1/auth/gestao-acessos/usuarios-perfil/42/tenant/tenant-1/capacidades"),
      );
      expect(call).toBeTruthy();
    } finally {
      restore();
    }
  });
});
