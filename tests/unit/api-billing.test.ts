import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelarAssinaturaApi,
  createAssinaturaApi,
  getBillingConfigApi,
  saveBillingConfigApi,
  testBillingConnectionApi,
} from "@/lib/api/billing";
import * as http from "@/lib/api/http";

describe("api/billing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getBillingConfigApi", () => {
    it("GET /billing/config e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        tenantId: "t1",
        provedorAtivo: "PAGARME",
        chaveApi: "key",
        ambiente: "PRODUCAO",
        statusConexao: "ONLINE",
        ativo: true,
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/billing/config");
      expect(result?.provedorAtivo).toBe("PAGARME");
      expect(result?.ambiente).toBe("PRODUCAO");
      expect(result?.statusConexao).toBe("ONLINE");
    });

    it("retorna null em erro (endpoint fantasma)", async () => {
      vi.spyOn(http, "apiRequest").mockRejectedValue(new Error("404"));
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result).toBeNull();
    });

    it("provedor inválido → OUTRO", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        provedorAtivo: "INVALID",
        chaveApi: "k",
        ativo: true,
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result?.provedorAtivo).toBe("OUTRO");
    });

    it("ambiente padrão SANDBOX", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        chaveApi: "k",
        ativo: true,
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result?.ambiente).toBe("SANDBOX");
    });

    it("statusConexao desconhecido → NAO_CONFIGURADO", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        statusConexao: "WEIRD",
        ativo: true,
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result?.statusConexao).toBe("NAO_CONFIGURADO");
    });

    it("ativo string 'true' → boolean true", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        ativo: "true",
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result?.ativo).toBe(true);
    });

    it("ativo string 'false' → boolean false", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        ativo: "false",
      } as never);
      const result = await getBillingConfigApi({ tenantId: "t1" });
      expect(result?.ativo).toBe(false);
    });
  });

  describe("saveBillingConfigApi", () => {
    it("PUT /billing/config com body", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "cfg-1",
        provedorAtivo: "STRIPE",
        chaveApi: "key",
        ambiente: "SANDBOX",
        ativo: true,
      } as never);
      const result = await saveBillingConfigApi({
        tenantId: "t1",
        data: {
          provedorAtivo: "STRIPE",
          chaveApi: "key",
          ambiente: "SANDBOX",
          ativo: true,
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(result.provedorAtivo).toBe("STRIPE");
    });
  });

  describe("testBillingConnectionApi", () => {
    it("POST /billing/config/test", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        success: true,
        message: "OK",
      } as never);
      const result = await testBillingConnectionApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/billing/config/test");
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(result.success).toBe(true);
    });
  });

  describe("createAssinaturaApi", () => {
    it("POST /billing/assinaturas e normaliza", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        tenantId: "t1",
        alunoId: "al1",
        planoId: "p1",
        status: "ATIVA",
        ciclo: "MENSAL",
        valor: 100,
        dataInicio: "2026-04-10",
      } as never);
      const result = await createAssinaturaApi({
        tenantId: "t1",
        data: {
          alunoId: "al1",
          planoId: "p1",
          dataInicio: "2026-04-10",
        },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(result.status).toBe("ATIVA");
      expect(result.ciclo).toBe("MENSAL");
      expect(result.valor).toBe(100);
    });

    it("status inválido → PENDENTE (fallback)", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "WEIRD",
        ciclo: "WEIRD_CICLO",
      } as never);
      const result = await createAssinaturaApi({
        tenantId: "t1",
        data: { alunoId: "al1", planoId: "p1", dataInicio: "2026-04-10" },
      });
      expect(result.status).toBe("PENDENTE");
      expect(result.ciclo).toBe("MENSAL");
    });
  });

  describe("cancelarAssinaturaApi", () => {
    it("PATCH /billing/assinaturas/{id}/cancelar", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "a1",
        status: "CANCELADA",
      } as never);
      await cancelarAssinaturaApi({ tenantId: "t1", id: "a1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/billing/assinaturas/a1/cancelar",
      );
      expect(spy.mock.calls[0][0].method).toBe("PATCH");
    });
  });
});
