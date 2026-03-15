import { expect, test } from "@playwright/test";
import {
  gerarCatracaCredencialApi,
  liberarAcessoCatracaApi,
  listarAcessosCatracaApi,
  listarAcessosCatracaDashboardApi,
  listarCatracaWsStatusApi,
  obterCatracaWsStatusPorTenantApi,
} from "../../src/lib/api/catraca";
import { mockFetchWithSequence } from "./support/test-runtime";

const envSnapshot = {
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
  acessosPath: process.env.NEXT_PUBLIC_CATRACA_ACESSOS_PATH,
};

test.beforeEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  process.env.NEXT_PUBLIC_CATRACA_ACESSOS_PATH = "/api/v1/custom/catraca/acessos";
});

test.afterEach(() => {
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  process.env.NEXT_PUBLIC_CATRACA_ACESSOS_PATH = envSnapshot.acessosPath;
});

test.describe("catraca api", () => {
  test("normaliza status websocket e usa rotas canonicas de credencial e grant", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          keyId: "key-1",
          secret: "secret",
          bearerPlain: "plain",
          bearerBase64: "base64",
          tenantId: "tenant-1",
          createdAt: "2026-03-14T10:00:00Z",
        },
      },
      {
        body: {
          totalConnectedAgents: "4",
          tenants: [
            {
              tenantId: "tenant-1",
              connectedAgents: "2",
              agents: [
                {
                  agentId: " agent-1 ",
                  sessionId: "sess-1",
                  integrationKeyId: "int-1",
                  tenantId: "tenant-1",
                  lastAckAt: "2026-03-14T10:00:00Z",
                  lastPendingRequestSentAt: "2026-03-14T10:01:00Z",
                  lastPendingRequestId: "req-1",
                  awaitingPingAck: true,
                },
                {
                  agentId: " ",
                },
              ],
            },
            {
              tenantId: "tenant-2",
              connectedAgents: 2,
              agents: "invalid",
            },
          ],
        },
      },
      {
        body: {
          tenantId: "tenant-1",
          connectedAgents: 1,
          agents: [{ agentId: "agent-9" }],
        },
      },
      {
        body: {
          requestId: "grant-1",
        },
      },
    ]);

    try {
      const credential = await gerarCatracaCredencialApi({
        tenantId: "tenant-1",
        adminToken: "admin-token",
      });
      expect(credential.keyId).toBe("key-1");

      const status = await listarCatracaWsStatusApi({ tenantId: "tenant-1" });
      expect(status.totalConnectedAgents).toBe(4);
      expect(status.tenants[0]?.agents?.[0]).toEqual({
        agentId: "agent-1",
        sessionId: "sess-1",
        integrationKeyId: "int-1",
        tenantId: "tenant-1",
        lastAckAt: "2026-03-14T10:00:00Z",
        lastPendingRequestSentAt: "2026-03-14T10:01:00Z",
        lastPendingRequestId: "req-1",
        awaitingPingAck: true,
      });
      expect(status.tenants[1]?.agents).toEqual([]);

      const singleTenant = await obterCatracaWsStatusPorTenantApi({ tenantId: "tenant-1" });
      expect(singleTenant.tenants).toEqual([
        {
          tenantId: "tenant-1",
          connectedAgents: 1,
          agents: [{ agentId: "agent-9" }],
        },
      ]);

      const grant = await liberarAcessoCatracaApi({
        agentId: "agent-9",
        memberId: "member-1",
        reason: "Liberacao manual",
        issuedBy: "frontend",
        requestId: "req-manual",
      });
      expect(grant.requestId).toBe("grant-1");

      expect(calls[0].url).toContain("/api/v1/integracoes/catraca/credenciais");
      expect(calls[0].headers.get("X-Admin-Token")).toBe("admin-token");
      expect(calls[1].url).toContain("/api/v1/integracoes/catraca/ws/status");
      expect(calls[1].url).toContain("tenantId=tenant-1");
      expect(calls[2].url).toContain("/api/v1/integracoes/catraca/ws/status/tenant-1");
      expect(calls[3].url).toContain("/api/v1/integracoes/catraca/ws/commands/grant");
      expect(calls[3].method).toBe("POST");
      expect(calls[3].body).toContain("\"requestId\":\"req-manual\"");
    } finally {
      restore();
    }
  });

  test("normaliza acessos, dashboard e ranking com payloads heterogeneos", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: [
          {
            tenantId: "tenant-1",
            memberId: "member-1",
            memberName: "Ana",
            status: "LIBERADO",
            gateName: "Entrada",
            metadata: {
              issuedBy: "Operador",
              reason: "Liberacao manual",
            },
            manual: "true",
            createdAt: "2026-03-14T09:00:00Z",
          },
          {
            id: "acc-2",
            tenantId: "tenant-1",
            clienteId: "member-2",
            clienteNome: "Bruno",
            result: "BLOQUEADO",
            mode: "system-policy",
            created_by: "motor",
            dataHora: "2026-03-14T09:05:00Z",
          },
        ],
      },
      {
        body: {
          lista: {
            items: [
              {
                id: "acc-3",
                tenantId: "tenant-1",
                alunoId: "member-3",
                alunoNome: "Carla",
                resultado: "LIBERADO",
                tipoLiberacao: "manual",
                justificativa: "Checklist",
                data: "2026-03-14T09:10:00Z",
              },
            ],
            page: "2",
            size: "10",
            total: "25",
          },
          resumo: {
            entradas: "12",
            manuais: "3",
            bloqueados: "1",
            frequenciaMedia: "2.4",
          },
          serieDiaria: [
            {
              dia: "2026-03-13",
              entrada: "4",
              manuais: "1",
              bloqueados: "0",
            },
          ],
          rankingFrequencia: [
            {
              nome: "Carla",
              clienteId: "member-3",
              foto: "https://img.test/carla.png",
              plano: "Premium",
              status: "ATIVO",
              frequencia: "7",
            },
          ],
        },
      },
    ]);

    try {
      const list = await listarAcessosCatracaApi({
        tenantId: "tenant-1",
        page: -1,
        size: 999,
        startDate: "2026-03-01",
        endDate: "2026-03-14",
        memberId: "member-1",
      });
      expect(list.page).toBe(0);
      expect(list.size).toBe(200);
      expect(list.hasNext).toBe(false);
      expect(list.items[0]?.releaseType).toBe("MANUAL");
      expect(list.items[0]?.issuedBy).toBe("Operador");
      expect(list.items[0]?.reason).toBe("Liberacao manual");
      expect(list.items[0]?.id).toContain("acesso-0-");
      expect(list.items[1]?.releaseType).toBe("AUTOMATICA");

      const dashboard = await listarAcessosCatracaDashboardApi({
        tenantId: "tenant-1",
        page: 1,
        size: 10,
        tipoLiberacao: "MANUAL",
        status: "LIBERADO",
        uniqueWindowMinutes: 30,
        timezone: "America/Sao_Paulo",
      });
      expect(dashboard.page).toBe(2);
      expect(dashboard.size).toBe(10);
      expect(dashboard.total).toBe(25);
      expect(dashboard.resumo).toEqual({
        entradas: 12,
        entradasManuais: 3,
        bloqueados: 1,
        frequenciaMediaPorCliente: 2.4,
      });
      expect(dashboard.serieDiaria).toEqual([
        {
          date: "2026-03-13",
          entradas: 4,
          manuais: 1,
          bloqueados: 0,
        },
      ]);
      expect(dashboard.rankingFrequencia).toEqual([
        {
          posicao: 1,
          memberId: "member-3",
          nome: "Carla",
          fotoUrl: "https://img.test/carla.png",
          contrato: "Premium",
          statusCliente: "ATIVO",
          frequencia: 7,
        },
      ]);

      expect(calls[0].url).toContain("/api/v1/custom/catraca/acessos");
      expect(calls[0].url).toContain("tenantId=tenant-1");
      expect(calls[0].url).toContain("page=0");
      expect(calls[0].url).toContain("size=200");
      expect(calls[1].url).toContain("/api/v1/gerencial/catraca/acessos/dashboard");
      expect(calls[1].url).toContain("tipoLiberacao=MANUAL");
      expect(calls[1].url).toContain("status=LIBERADO");
      expect(calls[1].url).toContain("uniqueWindowMinutes=30");
    } finally {
      restore();
    }
  });
});
