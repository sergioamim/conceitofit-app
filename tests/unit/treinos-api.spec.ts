import { expect, test } from "@playwright/test";
import { assignTreinoTemplateApi, listTreinoTemplatesApi } from "../../src/lib/api/treinos";
import { clearAuthSession } from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence, seedTestSession } from "./support/test-runtime";

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
  seedTestSession({
    token: "access-token",
    refreshToken: "refresh-token",
    activeTenantId: "tenant-treinos",
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

test.describe("treinos api contracts", () => {
  test("listTreinoTemplatesApi usa o endpoint canônico com tenantId e headers de contexto", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          items: [
            {
              id: "tpl-1",
              nome: "Template Base",
              professorId: "prof-1",
              professorNome: "Paula Lima",
              status: "PUBLICADO",
              versaoTemplate: 3,
              precisaRevisao: false,
              pendenciasAbertas: 0,
              atualizadoEm: "2026-03-14T22:33:28.692Z",
            },
          ],
          page: 0,
          size: 12,
          total: 1,
          hasNext: false,
          totais: {
            totalTemplates: 1,
            publicados: 1,
            emRevisao: 0,
            comPendencias: 0,
          },
        },
      },
    ]);

    try {
      const response = await listTreinoTemplatesApi({
        tenantId: "tenant-treinos",
        search: "Base",
        page: 0,
        size: 12,
      });

      expect(response.items).toHaveLength(1);
      expect(response.totais.totalTemplates).toBe(1);
      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("GET");
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates");
      expect(calls[0].url).toContain("tenantId=tenant-treinos");
      expect(calls[0].url).toContain("page=0");
      expect(calls[0].url).toContain("size=12");
      expect(calls[0].url).not.toContain("tipoTreino=PRE_MONTADO");
      // Task 458: Authorization header removido — backend autentica via cookies HttpOnly.
      expect(calls[0].headers.get("X-Context-Id")).toBeTruthy();
    } finally {
      restore();
    }
  });

  test("assignTreinoTemplateApi usa a rota canônica de templates", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          id: "trn-1",
          tenantId: "tenant-treinos",
          clienteId: "cli-1",
          nome: "Treino atribuído",
          templateNome: "Template Base",
          tipoTreino: "CUSTOMIZADO",
          ativo: true,
        },
      },
    ]);

    try {
      await assignTreinoTemplateApi({
        tenantId: "tenant-treinos",
        id: "tpl-1",
        data: {
          destinoTipo: "CLIENTE",
          clienteId: "cli-1",
          dataInicio: "2026-03-14",
          dataFim: "2026-04-11",
        },
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].method).toBe("POST");
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates/tpl-1/atribuir");
    } finally {
      restore();
    }
  });

  test("assignTreinoTemplateApi faz fallback para a rota legada quando a canônica retorna 404", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          timestamp: "2026-03-14T22:33:28.692+00:00",
          status: 404,
          error: "Not Found",
          path: "/api/v1/treinos/templates/tpl-1/atribuir",
        },
        status: 404,
      },
      {
        body: {
          id: "trn-2",
          tenantId: "tenant-treinos",
          clienteId: "cli-1",
          nome: "Treino atribuído",
          templateNome: "Template Base",
          tipoTreino: "CUSTOMIZADO",
          ativo: true,
        },
      },
    ]);

    try {
      await assignTreinoTemplateApi({
        tenantId: "tenant-treinos",
        id: "tpl-1",
        data: {
          destinoTipo: "CLIENTE",
          clienteId: "cli-1",
        },
      });

      expect(calls).toHaveLength(2);
      expect(calls[0].url).toContain("/backend/api/v1/treinos/templates/tpl-1/atribuir");
      expect(calls[1].url).toContain("/backend/api/v1/treinos/tpl-1/atribuir");
    } finally {
      restore();
    }
  });
});
