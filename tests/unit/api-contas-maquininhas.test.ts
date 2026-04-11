import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createContaBancariaApi,
  listContasBancariasApi,
  toggleContaBancariaApi,
  updateContaBancariaApi,
} from "@/lib/api/contas-bancarias";
import {
  createMaquininhaApi,
  listMaquininhasApi,
  toggleMaquininhaApi,
  updateMaquininhaApi,
} from "@/lib/api/maquininhas";
import * as http from "@/lib/api/http";

describe("api/contas-bancarias", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listContasBancariasApi GET", async () => {
    vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "1",
        tenantId: "t1",
        apelido: "Main",
        banco: "Itau",
        agencia: "123",
        conta: "456",
        digito: "7",
        tipo: "CORRENTE",
        titular: "Test",
        pixChave: null,
        pixTipo: null,
        statusCadastro: null,
      },
    ] as never);
    const result = await listContasBancariasApi({ tenantId: "t1" });
    expect(result[0]).toMatchObject({
      id: "1",
      pixChave: "",
      pixTipo: "CPF",
      statusCadastro: "ATIVA",
    });
  });

  it("createContaBancariaApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "1",
      tenantId: "t1",
      apelido: "New",
      banco: "Santander",
      agencia: "001",
      conta: "999",
      digito: "0",
      tipo: "CORRENTE",
      titular: "Test",
    } as never);
    await createContaBancariaApi({
      tenantId: "t1",
      data: { apelido: "New" } as never,
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
    expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
  });

  it("updateContaBancariaApi PUT com id", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateContaBancariaApi({ id: "1", tenantId: "t1", data: {} });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/contas-bancarias/1",
    );
    expect(spy.mock.calls[0][0].method).toBe("PUT");
  });

  it("toggleContaBancariaApi PATCH /toggle", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await toggleContaBancariaApi({ id: "1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/contas-bancarias/1/toggle",
    );
    expect(spy.mock.calls[0][0].method).toBe("PATCH");
  });
});

describe("api/maquininhas", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("listMaquininhasApi GET", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([
      {
        id: "m1",
        tenantId: "t1",
        nome: "Stone 1",
        adquirente: "STONE",
        terminal: "TERM1",
        contaBancariaId: "cb1",
        statusCadastro: null,
      },
    ] as never);
    const result = await listMaquininhasApi({ tenantId: "t1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/maquininhas",
    );
    expect(result[0].statusCadastro).toBe("ATIVA");
  });

  it("createMaquininhaApi POST", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
      id: "m1",
      tenantId: "t1",
      nome: "New",
      adquirente: "STONE",
      terminal: "T1",
      contaBancariaId: "cb1",
    } as never);
    await createMaquininhaApi({
      tenantId: "t1",
      data: {
        nome: "New",
        adquirente: "STONE",
        terminal: "T1",
        contaBancariaId: "cb1",
      },
    });
    expect(spy.mock.calls[0][0].method).toBe("POST");
  });

  it("updateMaquininhaApi PUT", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await updateMaquininhaApi({ id: "m1", data: {} });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/maquininhas/m1",
    );
  });

  it("toggleMaquininhaApi PATCH /toggle", async () => {
    const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
    await toggleMaquininhaApi({ id: "m1" });
    expect(spy.mock.calls[0][0].path).toBe(
      "/api/v1/gerencial/financeiro/maquininhas/m1/toggle",
    );
  });
});
