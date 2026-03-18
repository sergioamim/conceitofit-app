import { expect, test } from "@playwright/test";
import {
  createAtividadeApi,
  listAtividadesApi,
  updateAtividadeApi,
} from "../../src/lib/api/administrativo";
import { clearAuthSession, saveAuthSession } from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence } from "./support/test-runtime";

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

const runtimeSnapshot = {
  forceLocalMode: (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__,
};

let browser: ReturnType<typeof installMockBrowser> | undefined;

test.beforeEach(() => {
  browser = installMockBrowser();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  (
    globalThis as typeof globalThis & {
      __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
    }
  ).__ACADEMIA_FORCE_LOCAL_MODE__ = true;
  clearAuthSession();
  saveAuthSession({
    token: "access-token",
    refreshToken: "refresh-token",
    activeTenantId: "tenant-atividade",
    availableTenants: [{ tenantId: "tenant-atividade", defaultTenant: true }],
  });
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
  process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  if (runtimeSnapshot.forceLocalMode === undefined) {
    delete (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__;
  } else {
    (
      globalThis as typeof globalThis & {
        __ACADEMIA_FORCE_LOCAL_MODE__?: boolean;
      }
    ).__ACADEMIA_FORCE_LOCAL_MODE__ = runtimeSnapshot.forceLocalMode;
  }
});

test.describe("administrativo api - atividades", () => {
  test("listAtividadesApi normaliza flags de check-in e envia filtros do contrato", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: [
          {
            id: "atividade-1",
            tenantId: "tenant-atividade",
            nome: "Yoga Flow",
            categoria: "COLETIVA",
            cor: "#22cc88",
            permiteCheckin: "0",
            checkinObrigatorio: "1",
            ativo: "true",
          },
        ],
      },
    ]);

    try {
      const atividades = await listAtividadesApi({
        tenantId: "tenant-atividade",
        apenasAtivas: true,
        categoria: "COLETIVA",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/administrativo/atividades");
      expect(calls[0]?.url).toContain("apenasAtivas=true");
      expect(calls[0]?.url).toContain("categoria=COLETIVA");
      expect(atividades).toEqual([
        expect.objectContaining({
          id: "atividade-1",
          tenantId: "tenant-atividade",
          nome: "Yoga Flow",
          categoria: "COLETIVA",
          permiteCheckin: false,
          checkinObrigatorio: false,
          ativo: true,
        }),
      ]);
    } finally {
      restore();
    }
  });

  test("createAtividadeApi e updateAtividadeApi persistem os campos novos de check-in", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        status: 201,
        body: {
          id: "atividade-2",
          tenantId: "tenant-atividade",
          nome: "Pilates Solo",
          categoria: "COLETIVA",
          ativo: true,
        },
      },
      {
        body: {
          id: "atividade-2",
          tenantId: "tenant-atividade",
          nome: "Pilates Solo",
          categoria: "COLETIVA",
          permiteCheckin: "true",
          checkinObrigatorio: "true",
          ativo: true,
        },
      },
    ]);

    try {
      const created = await createAtividadeApi({
        tenantId: "tenant-atividade",
        data: {
          nome: " Pilates Solo ",
          descricao: " Alongamento guiado ",
          categoria: "COLETIVA",
          icone: "lotus",
          cor: "#22cc88",
          permiteCheckin: false,
          checkinObrigatorio: false,
        },
      });

      const updated = await updateAtividadeApi({
        tenantId: "tenant-atividade",
        id: "atividade-2",
        data: {
          nome: "Pilates Solo",
          descricao: "Alongamento guiado",
          categoria: "COLETIVA",
          icone: "lotus",
          cor: "#22cc88",
          permiteCheckin: true,
          checkinObrigatorio: true,
          ativo: true,
        },
      });

      expect(calls).toHaveLength(2);
      expect(calls[0]?.method).toBe("POST");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        tenantId: "tenant-atividade",
        nome: "Pilates Solo",
        descricao: "Alongamento guiado",
        categoria: "COLETIVA",
        icone: "lotus",
        cor: "#22cc88",
        permiteCheckin: false,
        checkinObrigatorio: false,
      });
      expect(calls[1]?.method).toBe("PUT");
      expect(JSON.parse(calls[1]?.body ?? "{}")).toEqual({
        tenantId: "tenant-atividade",
        nome: "Pilates Solo",
        descricao: "Alongamento guiado",
        categoria: "COLETIVA",
        icone: "lotus",
        cor: "#22cc88",
        permiteCheckin: true,
        checkinObrigatorio: true,
      });

      expect(created.permiteCheckin).toBe(false);
      expect(created.checkinObrigatorio).toBe(false);
      expect(updated.permiteCheckin).toBe(true);
      expect(updated.checkinObrigatorio).toBe(true);
    } finally {
      restore();
    }
  });
});
