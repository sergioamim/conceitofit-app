import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createConvenioApi,
  createVoucherApi,
  deleteConvenioApi,
  listConveniosApi,
  listVoucherCodigosApi,
  listVoucherUsageCountsApi,
  listVouchersApi,
  toggleConvenioApi,
  toggleVoucherApi,
  updateConvenioApi,
  updateVoucherApi,
  validarVoucherCodigoApi,
} from "@/lib/api/beneficios";
import * as http from "@/lib/api/http";

describe("api/beneficios", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("convenios", () => {
    it("listConveniosApi passa apenasAtivos=false por default", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listConveniosApi();
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/administrativo/convenios",
          query: { apenasAtivos: false },
        }),
      );
    });

    it("listConveniosApi aceita apenasAtivos=true", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listConveniosApi(true);
      expect(spy.mock.calls[0][0].query).toEqual({ apenasAtivos: true });
    });

    it("listConveniosApi normaliza descontoPercentual e planoIds", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        {
          id: "c1",
          nome: "Conv",
          descontoPercentual: "15.5",
          planoIds: null,
        },
        {
          id: "c2",
          nome: "Conv2",
          descontoPercentual: 10,
          planoIds: ["p1", "p2"],
        },
      ] as never);

      const result = await listConveniosApi();
      expect(result[0].descontoPercentual).toBe(15.5);
      expect(result[0].planoIds).toEqual([]);
      expect(result[1].descontoPercentual).toBe(10);
      expect(result[1].planoIds).toEqual(["p1", "p2"]);
    });

    it("listConveniosApi trata NaN em desconto como 0", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "c1", descontoPercentual: "not-number", planoIds: [] },
      ] as never);
      const result = await listConveniosApi();
      expect(result[0].descontoPercentual).toBe(0);
    });

    it("createConvenioApi POST com body", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createConvenioApi({ nome: "Test" } as never);
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          path: "/api/v1/administrativo/convenios",
          method: "POST",
          body: { nome: "Test" },
        }),
      );
    });

    it("updateConvenioApi PUT com id no path", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateConvenioApi("abc", { nome: "Novo" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/convenios/abc");
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("toggleConvenioApi PATCH em /{id}/toggle", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await toggleConvenioApi("c1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/convenios/c1/toggle",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });

    it("deleteConvenioApi DELETE", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue(undefined as never);
      await deleteConvenioApi("c1");
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("vouchers", () => {
    it("listVouchersApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listVouchersApi();
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/vouchers");
    });

    it("createVoucherApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createVoucherApi({ codigo: "X" });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({ codigo: "X" });
    });

    it("updateVoucherApi PUT /{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateVoucherApi("v1", { nome: "new" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/administrativo/vouchers/v1");
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });

    it("toggleVoucherApi PATCH /{id}/toggle", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await toggleVoucherApi("v1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/vouchers/v1/toggle",
      );
    });

    it("listVoucherCodigosApi GET /{id}/codigos", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listVoucherCodigosApi("v1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/vouchers/v1/codigos",
      );
    });

    it("validarVoucherCodigoApi POST com body", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await validarVoucherCodigoApi({
        codigo: "ABC",
        tenantId: "t1",
        planoId: "p1",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/comercial/vouchers/validar",
      );
      expect(spy.mock.calls[0][0].body).toEqual({
        codigo: "ABC",
        tenantId: "t1",
        planoId: "p1",
      });
    });

    it("listVoucherUsageCountsApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await listVoucherUsageCountsApi();
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/administrativo/vouchers/usage-counts",
      );
    });
  });
});
