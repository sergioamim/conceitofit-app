import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createBandeiraCartaoApi,
  createCartaoClienteApi,
  deleteBandeiraCartaoApi,
  deleteCartaoClienteApi,
  listBandeirasCartaoApi,
  listCartoesClienteApi,
  setCartaoPadraoApi,
  toggleBandeiraCartaoApi,
  updateBandeiraCartaoApi,
} from "@/lib/api/cartoes";
import * as http from "@/lib/api/http";

describe("api/cartoes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("bandeiras", () => {
    it("listBandeirasCartaoApi passa apenasAtivas default false", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listBandeirasCartaoApi();
      expect(spy.mock.calls[0][0].query).toEqual({ apenasAtivas: false });
    });

    it("listBandeirasCartaoApi aceita apenasAtivas=true", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listBandeirasCartaoApi({ apenasAtivas: true });
      expect(spy.mock.calls[0][0].query).toEqual({ apenasAtivas: true });
    });

    it("listBandeirasCartaoApi normaliza tipos", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "b1", nome: "Visa", taxaPercentual: "2.5", diasRepasse: "30", ativo: "true" },
        { id: "b2", nome: "Master", taxaPercentual: 3, diasRepasse: 15, ativo: true },
        { id: "b3", nome: "Elo", taxaPercentual: "not-number", diasRepasse: -5, ativo: 0 },
      ] as never);

      const result = await listBandeirasCartaoApi();
      expect(result[0]).toMatchObject({ taxaPercentual: 2.5, diasRepasse: 30, ativo: true });
      expect(result[1]).toMatchObject({ taxaPercentual: 3, diasRepasse: 15, ativo: true });
      expect(result[2]).toMatchObject({ taxaPercentual: 0, diasRepasse: 0, ativo: false });
    });

    it("createBandeiraCartaoApi envia POST", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({ id: "x" } as never);
      const result = await createBandeiraCartaoApi({
        nome: "Visa",
        taxaPercentual: 2.5,
        diasRepasse: 30,
      });
      expect(result.id).toBe("x");
    });

    it("updateBandeiraCartaoApi PUT com id no path", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateBandeiraCartaoApi({ id: "b1", nome: "Novo" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/bandeiras-cartao/b1");
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("toggleBandeiraCartaoApi PATCH /toggle", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await toggleBandeiraCartaoApi("b1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/bandeiras-cartao/b1/toggle",
      );
    });

    it("deleteBandeiraCartaoApi DELETE", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue(undefined as never);
      await deleteBandeiraCartaoApi("b1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("cartoes cliente", () => {
    it("listCartoesClienteApi inclui tenantId no query", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listCartoesClienteApi({ alunoId: "a1", tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/alunos/a1/cartoes",
      );
      expect(spy.mock.calls[0][0].query).toEqual({ tenantId: "t1" });
    });

    it("listCartoesClienteApi normaliza padrão/ativo", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "c1", padrao: "sim", ativo: "nao", ultimos4: "1234" },
      ] as never);
      const result = await listCartoesClienteApi({ alunoId: "a1" });
      expect(result[0].padrao).toBe(true);
      expect(result[0].ativo).toBe(false);
    });

    it("createCartaoClienteApi POST com body de dados", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createCartaoClienteApi({
        alunoId: "a1",
        tenantId: "t1",
        data: { bandeiraId: "b1", titular: "João" },
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/alunos/a1/cartoes",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({
        bandeiraId: "b1",
        titular: "João",
      });
    });

    it("setCartaoPadraoApi PATCH /padrao", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue(undefined as never);
      await setCartaoPadraoApi({ id: "c1", tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/comercial/cartoes/c1/padrao");
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });

    it("deleteCartaoClienteApi DELETE", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue(undefined as never);
      await deleteCartaoClienteApi({ id: "c1" });
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });
});
