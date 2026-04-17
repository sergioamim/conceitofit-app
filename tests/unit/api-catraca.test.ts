import { afterEach, describe, expect, it, vi } from "vitest";
import {
  gerarCatracaCredencialApi,
  liberarAcessoCatracaApi,
  listarAcessosCatracaDashboardApi,
  listarCatracaWsStatusApi,
  obterAdminCatracaIntegracaoApi,
  obterCatracaWsStatusPorTenantApi,
  salvarAdminCatracaDispositivoApi,
  sincronizarAdminCatracaFacesApi,
  syncCatracaFacesApi,
} from "@/lib/api/catraca";
import * as http from "@/lib/api/http";

describe("api/catraca", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("gerarCatracaCredencialApi", () => {
    it("POST /integracoes/catraca/credenciais com X-Admin-Token", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        keyId: "k1",
        secret: "s1",
        bearerPlain: "b",
        bearerBase64: "b64",
        tenantId: "t1",
        createdAt: "2026-04-10",
      } as never);
      await gerarCatracaCredencialApi({
        tenantId: "t1",
        adminToken: "admin-123",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/integracoes/catraca/credenciais",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].headers?.["X-Admin-Token"]).toBe("admin-123");
      expect(spy.mock.calls[0][0].body).toEqual({ tenantId: "t1" });
    });
  });

  describe("listarCatracaWsStatusApi", () => {
    it("GET /ws/status com tenants array", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalConnectedAgents: 2,
        tenants: [
          {
            tenantId: "t1",
            connectedAgents: 2,
            agents: [
              {
                agentId: "agent-1",
                sessionId: "s1",
                awaitingPingAck: true,
              },
              {
                agentId: "agent-2",
              },
            ],
          },
        ],
      } as never);
      const result = await listarCatracaWsStatusApi({ tenantId: "t1" });
      expect(result.totalConnectedAgents).toBe(2);
      expect(result.tenants[0].agents).toHaveLength(2);
      expect(result.tenants[0].agents?.[0].agentId).toBe("agent-1");
      expect(result.tenants[0].agents?.[0].awaitingPingAck).toBe(true);
    });

    it("ignora agents com agentId vazio", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenants: [
          {
            tenantId: "t1",
            connectedAgents: 0,
            agents: [
              { agentId: "" },
              { agentId: "valid" },
              null,
              "string",
            ],
          },
        ],
      } as never);
      const result = await listarCatracaWsStatusApi();
      expect(result.tenants[0].agents).toHaveLength(1);
    });

    it("payload sem tenants array mas com tenantId → single tenant", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
        connectedAgents: 1,
        agents: [{ agentId: "a1" }],
      } as never);
      const result = await listarCatracaWsStatusApi();
      expect(result.tenants).toHaveLength(1);
      expect(result.tenants[0].tenantId).toBe("t1");
      expect(result.totalConnectedAgents).toBe(1);
    });

    it("payload vazio → totalConnectedAgents 0", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      const result = await listarCatracaWsStatusApi();
      expect(result.totalConnectedAgents).toBe(0);
      expect(result.tenants).toEqual([]);
    });

    it("totalConnectedAgents calculado via sum quando ausente", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenants: [
          { tenantId: "t1", connectedAgents: 2 },
          { tenantId: "t2", connectedAgents: 3 },
        ],
      } as never);
      const result = await listarCatracaWsStatusApi();
      expect(result.totalConnectedAgents).toBe(5);
    });
  });

  describe("obterCatracaWsStatusPorTenantApi", () => {
    it("GET /ws/status/{tenantId}", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
        connectedAgents: 0,
      } as never);
      await obterCatracaWsStatusPorTenantApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/integracoes/catraca/ws/status/t1",
      );
    });
  });

  describe("liberarAcessoCatracaApi", () => {
    it("POST /ws/commands/grant com body", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        requestId: "req-1",
      } as never);
      await liberarAcessoCatracaApi({
        agentId: "a1",
        memberId: "m1",
        reason: "teste",
        issuedBy: "user-1",
        requestId: "custom-req",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/integracoes/catraca/ws/commands/grant",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        agentId: "a1",
        memberId: "m1",
        reason: "teste",
      });
    });
  });

  describe("syncCatracaFacesApi", () => {
    it("POST /faces/sync", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        sincronizados: 10,
        total: 10,
        status: "OK",
      } as never);
      await syncCatracaFacesApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/integracoes/catraca/faces/sync",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].query?.tenantId).toBe("t1");
    });
  });

  describe("integração administrativa de catraca", () => {
    it("GET /admin/unidades/{tenantId}/catraca/integracao", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
        activeMembers: 12,
        membersWithPhoto: 10,
        devices: [],
        agents: [],
      } as never);
      await obterAdminCatracaIntegracaoApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/admin/unidades/t1/catraca/integracao",
      );
    });

    it("POST /admin/unidades/{tenantId}/catraca/dispositivos", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        deviceId: "idface-1",
        fabricante: "CONTROL_ID_IDFACE",
        ativo: true,
        operationMode: "EMBEDDED_FACE",
        supportsEmbeddedFace: true,
        supportsEdgeFace: false,
        supportsFingerprint: false,
        supportsQrCode: false,
        supportsFaceTemplateSync: true,
      } as never);
      await salvarAdminCatracaDispositivoApi({
        tenantId: "t1",
        data: {
          deviceId: "idface-1",
          agentId: "agent-1",
          fabricante: "CONTROL_ID_IDFACE",
          maxFaces: 3000,
          reservedFacesStaff: 100,
        },
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/admin/unidades/t1/catraca/dispositivos",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toMatchObject({
        deviceId: "idface-1",
        agentId: "agent-1",
        maxFaces: 3000,
        reservedFacesStaff: 100,
      });
    });

    it("POST /admin/unidades/{tenantId}/catraca/dispositivos/{deviceId}/sync-faces", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        tenantId: "t1",
        deviceId: "idface-1",
        queuedPreloads: 10,
        queuedInvalidations: 1,
      } as never);
      await sincronizarAdminCatracaFacesApi({
        tenantId: "t1",
        deviceId: "idface-1",
        agentId: "agent-1",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/admin/unidades/t1/catraca/dispositivos/idface-1/sync-faces",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({ agentId: "agent-1" });
    });
  });

  describe("listarAcessosCatracaDashboardApi", () => {
    it("normaliza dashboard com itens, resumo, serieDiaria, ranking", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({
        lista: {
          items: [
            {
              id: "acc-1",
              memberId: "m1",
              nome: "João",
              status: "LIBERADO",
              tipoLiberacao: "MANUAL",
              createdAt: "2026-04-10T10:00:00Z",
              issuedBy: "user-admin",
            },
          ],
          total: 1,
          page: 0,
          size: 20,
        },
        resumo: {
          entradas: 100,
          entradasManuais: 20,
          bloqueados: 5,
          frequenciaMediaPorCliente: 8.5,
        },
        serieDiaria: [
          { date: "2026-04-10", entradas: 10, manuais: 2, bloqueados: 0 },
          { date: "2026-04-11", entradas: 12 },
        ],
        rankingFrequencia: [
          {
            posicao: 1,
            nome: "João",
            frequencia: 20,
          },
          {
            nome: "Maria",
            frequencia: 18,
          },
        ],
      } as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/gerencial/catraca/acessos/dashboard",
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].memberNome).toBe("João");
      expect(result.items[0].releaseType).toBe("MANUAL");
      expect(result.resumo?.entradas).toBe(100);
      expect(result.serieDiaria).toHaveLength(2);
      expect(result.rankingFrequencia).toHaveLength(2);
      expect(result.rankingFrequencia?.[1].posicao).toBe(2);
    });

    it("page/size com clamping", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
        page: -5,
        size: 500,
      });
      expect(spy.mock.calls[0][0].query?.page).toBe(0);
      expect(spy.mock.calls[0][0].query?.size).toBe(200);
    });

    it("size mínimo 1", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
        size: 0,
      });
      expect(spy.mock.calls[0][0].query?.size).toBe(1);
    });

    it("resposta array direto → normaliza sem dashboard extras", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "acc-1", nome: "João", status: "LIBERADO" },
        null,
        { id: "acc-2", memberNome: "Maria" },
      ] as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.items).toHaveLength(2);
    });

    it("resposta não-objeto vira items vazio", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue("string" as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.items).toEqual([]);
    });

    it("infere releaseType MANUAL de issuedBy não sistêmico", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [
          {
            id: "acc-1",
            nome: "João",
            issuedBy: "operator-1",
          },
        ],
      } as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.items[0].releaseType).toBe("MANUAL");
    });

    it("infere releaseType AUTOMATICA de issuedBy sistêmico", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [
          {
            id: "acc-1",
            nome: "João",
            issuedBy: "sistema",
          },
        ],
      } as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.items[0].releaseType).toBe("AUTOMATICA");
    });

    it("manualFlag boolean → MANUAL/AUTOMATICA", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "1", nome: "a", manual: true }],
      } as never);
      const r1 = await listarAcessosCatracaDashboardApi({ tenantId: "t1" });
      expect(r1.items[0].releaseType).toBe("MANUAL");

      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [{ id: "1", nome: "a", manual: false }],
      } as never);
      const r2 = await listarAcessosCatracaDashboardApi({ tenantId: "t1" });
      expect(r2.items[0].releaseType).toBe("AUTOMATICA");
    });

    it("envelope com content + page/size/total calculam hasNext", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        content: [{ id: "acc-1", nome: "a" }],
        page: 0,
        size: 10,
        total: 25,
      } as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.hasNext).toBe(true);
      expect(result.total).toBe(25);
    });

    it("hasNext boolean preservado", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        items: [],
        hasNext: false,
      } as never);
      const result = await listarAcessosCatracaDashboardApi({
        tenantId: "t1",
      });
      expect(result.hasNext).toBe(false);
    });
  });
});
