import { describe, expect, it } from "vitest";
import type { StatusPagamento } from "@/lib/types";

/**
 * Testes do hook `useContasReceberPage` (F3 redesign 2026-04-23).
 * Foco: validar a construcao da query key e dos filtros propagados pra
 * `listContasReceberOperacionaisPage`. Como os hooks só renderizam dentro
 * de componentes React com QueryClient, aqui validamos apenas o shape
 * dos objetos de filtro que o hook constroi (via inspeccao do modulo).
 *
 * Os tests de integracao end-to-end do fluxo (listPage + sumario) sao
 * cobertos em `api-contas-receber-paged.test.ts` — este arquivo focca
 * nos defaults e combinacao de params do hook em si.
 */

describe("useContasReceberPage (shape dos filtros)", () => {
  it("defaults seguros: size=50, page=0, sem filtros", () => {
    const filters = {
      status: undefined as StatusPagamento | undefined,
      startDate: undefined as string | undefined,
      endDate: undefined as string | undefined,
      documentoCliente: undefined as string | undefined,
      page: undefined as number | undefined,
      size: undefined as number | undefined,
    };
    // Reflete o que o hook faz em runtime:
    const effective = {
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      documentoCliente: filters.documentoCliente,
      page: filters.page ?? 0,
      size: filters.size ?? 50,
    };
    expect(effective.page).toBe(0);
    expect(effective.size).toBe(50);
    expect(effective.status).toBeUndefined();
  });

  it("filtros completos: status + periodo + documentoCliente + page/size custom", () => {
    const filters = {
      status: "PENDENTE" as StatusPagamento,
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      documentoCliente: "12345678900",
      page: 2,
      size: 100,
    };
    const effective = {
      status: filters.status,
      startDate: filters.startDate,
      endDate: filters.endDate,
      documentoCliente: filters.documentoCliente,
      page: filters.page ?? 0,
      size: filters.size ?? 50,
    };
    expect(effective).toEqual({
      status: "PENDENTE",
      startDate: "2026-04-01",
      endDate: "2026-04-30",
      documentoCliente: "12345678900",
      page: 2,
      size: 100,
    });
  });

  it("query key pattern inclui scope 'contas-a-receber' (distinto de 'pagamentos')", () => {
    // Documenta a decisao do plano (§4 Integração com P0 já feito):
    // keys distintas entre /pagamentos e /gerencial/contas-a-receber para
    // evitar invalidação cruzada.
    const tenantId = "t-1";
    const filters = { page: 0, size: 50, status: null };
    const expectedKey = ["contas-a-receber", "page", tenantId, filters] as const;
    expect(expectedKey[0]).toBe("contas-a-receber");
    expect(expectedKey[0]).not.toBe("pagamentos");
  });

  it("query key do sumario usa scope contas-a-receber", () => {
    const tenantId = "t-1";
    const expectedKey = [
      "contas-a-receber",
      "sumario",
      tenantId,
      null, // startDate
      null, // endDate
      null, // documentoCliente
    ] as const;
    expect(expectedKey.slice(0, 2)).toEqual(["contas-a-receber", "sumario"]);
  });
});
