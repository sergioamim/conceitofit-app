import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWhatsAppTemplateApi,
  deleteWhatsAppTemplateApi,
  getWhatsAppConfigApi,
  getWhatsAppMessageStatusApi,
  getWhatsAppStatsApi,
  listWhatsAppLogsApi,
  listWhatsAppTemplatesApi,
  saveWhatsAppConfigApi,
  sendWhatsAppMessageApi,
  testWhatsAppConnectionApi,
  updateWhatsAppTemplateApi,
} from "@/lib/api/whatsapp";
import * as http from "@/lib/api/http";

describe("api/whatsapp", () => {
  beforeEach(() => {
    // Flag default OFF → testar caminhos feature-flagged
    delete process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED;
  });

  describe("getWhatsAppConfigApi", () => {
    it("retorna null quando flag OFF", async () => {
      const result = await getWhatsAppConfigApi({ tenantId: "t1" });
      expect(result).toBeNull();
    });

    it("retorna null em erro", async () => {
      process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED = "true";
      vi.spyOn(http, "apiRequest").mockRejectedValue(new Error("404"));
      const result = await getWhatsAppConfigApi({ tenantId: "t1" });
      expect(result).toBeNull();
    });

    it("retorna config quando flag ON", async () => {
      process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED = "true";
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "c1",
      } as never);
      const result = await getWhatsAppConfigApi({ tenantId: "t1" });
      expect(result).toBeTruthy();
    });
  });

  describe("saveWhatsAppConfigApi", () => {
    it("lança erro quando flag OFF", async () => {
      await expect(
        saveWhatsAppConfigApi({ tenantId: "t1", data: {} }),
      ).rejects.toThrow(/desabilitada/i);
    });

    it("PUT quando flag ON", async () => {
      process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED = "true";
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await saveWhatsAppConfigApi({ tenantId: "t1", data: { ativo: true } });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/whatsapp/config");
    });
  });

  describe("testWhatsAppConnectionApi", () => {
    it("POST /config/test", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({ success: true } as never);
      await testWhatsAppConnectionApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/whatsapp/config/test");
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });
  });

  describe("listWhatsAppTemplatesApi", () => {
    it("array direto", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "tmp1" },
      ] as never);
      const result = await listWhatsAppTemplatesApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("envelope data", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        data: [{ id: "tmp1" }],
      } as never);
      const result = await listWhatsAppTemplatesApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("envelope items", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "tmp1" }],
      } as never);
      const result = await listWhatsAppTemplatesApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("envelope sem list → []", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      const result = await listWhatsAppTemplatesApi({ tenantId: "t1" });
      expect(result).toEqual([]);
    });
  });

  describe("createWhatsAppTemplateApi / update / delete", () => {
    it("POST", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await createWhatsAppTemplateApi({
        tenantId: "t1",
        data: { nome: "T" } as never,
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("PUT /{id}", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await updateWhatsAppTemplateApi({
        tenantId: "t1",
        id: "t1",
        data: { nome: "E" },
      });
      expect(spy.mock.calls[0][0].method).toBe("PUT");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/whatsapp/templates/t1");
    });

    it("DELETE", async () => {
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue(undefined as never);
      await deleteWhatsAppTemplateApi({ tenantId: "t1", id: "t1" });
      expect(spy.mock.calls[0][0].method).toBe("DELETE");
    });
  });

  describe("listWhatsAppLogsApi", () => {
    it("array", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "l1" },
      ] as never);
      const result = await listWhatsAppLogsApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });

    it("envelope data", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        data: [{ id: "l1" }],
      } as never);
      const result = await listWhatsAppLogsApi({ tenantId: "t1" });
      expect(result).toHaveLength(1);
    });
  });

  describe("sendWhatsAppMessageApi", () => {
    it("lança quando flag OFF", async () => {
      await expect(
        sendWhatsAppMessageApi({
          tenantId: "t1",
          data: { evento: "e", destinatario: "11" },
        }),
      ).rejects.toThrow(/desabilitado/i);
    });

    it("POST quando flag ON", async () => {
      process.env.NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED = "true";
      const spy = vi
        .spyOn(http, "apiRequest")
        .mockResolvedValue({} as never);
      await sendWhatsAppMessageApi({
        tenantId: "t1",
        data: { evento: "e", destinatario: "11" },
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/whatsapp/send");
    });
  });

  describe("getWhatsAppMessageStatusApi", () => {
    it("GET /status/{id}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        id: "m1",
        status: "ENVIADA",
      } as never);
      await getWhatsAppMessageStatusApi({
        tenantId: "t1",
        messageId: "m1",
      });
      expect(spy.mock.calls[0][0].path).toBe("/api/v1/whatsapp/status/m1");
    });
  });

  describe("getWhatsAppStatsApi", () => {
    it("retorna stats do backend quando disponível", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        total: 100,
        enviadas: 30,
        entregues: 40,
        lidas: 20,
        falhas: 10,
        taxaEntrega: 60,
        taxaLeitura: 20,
      } as never);
      const result = await getWhatsAppStatsApi({ tenantId: "t1" });
      expect(result.total).toBe(100);
    });

    it("fallback calcula via logs quando /stats falha", async () => {
      vi.spyOn(http, "apiRequest")
        .mockRejectedValueOnce(new Error("404"))
        .mockResolvedValueOnce([
          { id: "l1", status: "ENVIADA" },
          { id: "l2", status: "ENTREGUE" },
          { id: "l3", status: "LIDA" },
          { id: "l4", status: "FALHA" },
        ] as never);
      const result = await getWhatsAppStatsApi({ tenantId: "t1" });
      expect(result.total).toBe(4);
      expect(result.enviadas).toBe(1);
      expect(result.entregues).toBe(1);
      expect(result.lidas).toBe(1);
      expect(result.falhas).toBe(1);
      expect(result.taxaEntrega).toBe(50); // (entregues + lidas) / total * 100
      expect(result.taxaLeitura).toBe(25);
    });

    it("fallback total 0 → taxas 0", async () => {
      vi.spyOn(http, "apiRequest")
        .mockRejectedValueOnce(new Error("404"))
        .mockResolvedValueOnce([] as never);
      const result = await getWhatsAppStatsApi({ tenantId: "t1" });
      expect(result.taxaEntrega).toBe(0);
      expect(result.taxaLeitura).toBe(0);
    });
  });
});
