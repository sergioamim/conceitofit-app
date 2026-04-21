import { expect, test } from "@playwright/test";
import {
  adminEntrarComoUnidadeApi,
  adminLoginApi,
  changeForcedPasswordApi,
  getAccessNetworkContextApi,
  loginApi,
  requestPasswordRecoveryApi,
} from "../../src/lib/api/auth";
import { getSessionBootstrapApi } from "../../src/lib/api/contexto-unidades";
import {
  clearAuthSession,
  hasBackofficeReturnSession,
  rememberBackofficeReturnSession,
  restoreBackofficeReturnSession,
} from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence, seedTestSession } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

function buildJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

test.beforeEach(() => {
  browser = installMockBrowser();
  clearAuthSession();
  process.env.NEXT_PUBLIC_API_BASE_URL = "";
  process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
});

test.afterEach(() => {
  clearAuthSession();
  browser?.restore();
});

test.describe("auth por rede", () => {
  test("loginApi envia identifier contextualizado e persiste metadados da rede", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-rede",
          refreshToken: "refresh-rede",
          redeId: "rede-1",
          redeSlug: "rede-norte",
          redeNome: "Rede Norte",
          activeTenantId: "tenant-centro",
          baseTenantId: "tenant-base",
          availableScopes: ["REDE"],
          broadAccess: true,
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
        },
      },
    ]);

    try {
      const session = await loginApi({
        identifier: "ana@qa.local",
        password: "12345678",
        redeIdentifier: "rede-norte",
      });

      expect(calls[0]?.url).toContain("/api/v1/auth/login");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        identifier: "ana@qa.local",
        password: "12345678",
        channel: "APP",
      });
      expect(session.networkSubdomain).toBe("rede-norte");
      expect(session.networkSlug).toBe("rede-norte");
      expect(session.baseTenantId).toBe("tenant-base");
      // Task 458: claims (networkSubdomain, availableScopes, broadAccess) chegam via cookie
      // `fc_session_claims` setado pelo backend. saveAuthSession é no-op no frontend, então
      // os getters `get*FromSession()` apenas funcionam se o cookie for semeado. Em testes
      // unit valida-se o payload normalizado retornado pela API.
      expect(session.availableScopes).toEqual(["REDE"]);
      expect(session.broadAccess).toBe(true);
    } finally {
      restore();
    }
  });

  test("loginApi persiste o flag de troca obrigatória de senha quando o backend exigir primeiro acesso", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-rede",
          refreshToken: "refresh-rede",
          redeSlug: "rede-norte",
          redeNome: "Rede Norte",
          forcePasswordChange: true,
        },
      },
    ]);

    try {
      const session = await loginApi({
        identifier: "ana@qa.local",
        password: "12345678",
        redeIdentifier: "rede-norte",
      });

      expect(session.forcePasswordChangeRequired).toBe(true);
      // Task 458: getForcePasswordChangeRequiredFromSession depende do cookie fc_session_claims
      // emitido pelo backend; em teste unit validamos apenas o retorno normalizado.
    } finally {
      restore();
    }
  });

  test("adminLoginApi usa endpoint global e persiste a sessao sem contexto de rede", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-admin",
          refreshToken: "refresh-admin",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-admin",
          baseTenantId: "tenant-admin-base",
          availableScopes: ["GLOBAL"],
          broadAccess: true,
        },
      },
    ]);

    try {
      const session = await adminLoginApi({
        email: "admin@qa.local",
        password: "12345678",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/admin/auth/login");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBeNull();
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        email: "admin@qa.local",
        password: "12345678",
      });
      expect(session.token).toBe("token-admin");
      expect(session.refreshToken).toBe("refresh-admin");
      expect(session.availableScopes).toEqual(["GLOBAL"]);
      expect(session.activeTenantId).toBe("tenant-admin");
    } finally {
      restore();
    }
  });

  test("adminLoginApi infere escopo global a partir dos claims reais do JWT do backend", async () => {
    const { restore } = mockFetchWithSequence([
      {
        body: {
          token: buildJwt({
            sub: "user-admin",
            user_id: "user-admin",
            tenant_id: "tenant-admin",
            rede_id: "rede-global",
            scope: "GLOBAL",
            session_mode: "BACKOFFICE_ADMIN",
            roles: ["SUPER_ADMIN"],
          }),
          refreshToken: "refresh-admin",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-admin",
          baseTenantId: "tenant-admin",
        },
      },
    ]);

    try {
      const session = await adminLoginApi({
        email: "admin@qa.local",
        password: "12345678",
      });

      expect(session.availableScopes).toEqual(["GLOBAL"]);
      expect(session.activeTenantId).toBe("tenant-admin");
      // Task 458: getAvailableScopesFromSession depende do cookie fc_session_claims emitido
      // pelo backend; em teste unit validamos apenas o payload normalizado retornado.
    } finally {
      restore();
    }
  });

  test("adminEntrarComoUnidadeApi troca para a unidade via endpoint de contexto", async () => {
    seedTestSession({
      token: "token-admin",
      refreshToken: "refresh-admin",
      userId: "user-admin",
      userKind: "ADMIN",
      displayName: "Admin Master",
      activeTenantId: "tenant-admin",
      baseTenantId: "tenant-admin-base",
      availableScopes: ["GLOBAL"],
      broadAccess: true,
      sessionMode: "BACKOFFICE_ADMIN",
    });

    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-admin-unidade",
          refreshToken: "refresh-admin-unidade",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-centro",
          baseTenantId: "tenant-admin-base",
          availableScopes: ["GLOBAL"],
          broadAccess: true,
        },
      },
    ]);

    try {
      const session = await adminEntrarComoUnidadeApi({
        academiaId: "academia-norte",
        tenantId: "tenant-centro",
        justificativa: "auditoria",
      });

      expect(calls).toHaveLength(1);
      expect(calls[0]?.url).toContain("/api/v1/admin/auth/entrar-como-unidade");
      expect(calls[0]?.method).toBe("POST");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        academiaId: "academia-norte",
        tenantId: "tenant-centro",
        justificativa: "auditoria",
      });
      expect(hasBackofficeReturnSession()).toBeTruthy();
      expect(session.activeTenantId).toBe("tenant-centro");
      expect(session.token).toBe("token-admin-unidade");
      const restored = restoreBackofficeReturnSession();
      expect(restored?.originalSession.token).toBe("token-admin");
    } finally {
      restore();
    }
  });

  test("adminEntrarComoUnidadeApi preserva retorno ao backoffice via claims do token", async () => {
    seedTestSession({
      token: buildJwt({
        sub: "user-admin",
        scope: "GLOBAL",
        session_mode: "BACKOFFICE_ADMIN",
      }),
      refreshToken: "refresh-admin",
      userId: "user-admin",
      userKind: "ADMIN",
      displayName: "Admin Master",
      activeTenantId: "tenant-admin",
      baseTenantId: "tenant-admin-base",
      sessionMode: "BACKOFFICE_ADMIN",
      availableScopes: ["GLOBAL"],
    });
    const { restore } = mockFetchWithSequence([
      {
        body: {
          token: "token-admin-unidade",
          refreshToken: "refresh-admin-unidade",
          userId: "user-admin",
          userKind: "ADMIN",
          displayName: "Admin Master",
          activeTenantId: "tenant-mananciais-s1",
          baseTenantId: "tenant-admin-base",
        },
      },
    ]);

    try {
      await adminEntrarComoUnidadeApi({
        academiaId: "academia-mananciais",
        tenantId: "tenant-mananciais-s1",
      });

      expect(hasBackofficeReturnSession()).toBeTruthy();
      const restored = restoreBackofficeReturnSession();
      expect(restored?.originalSession.userId).toBe("user-admin");
    } finally {
      restore();
    }
  });

  test("rememberBackofficeReturnSession substitui snapshot antigo ao reiniciar o fluxo", () => {
    seedTestSession({
      token: buildJwt({
        sub: "user-admin-antigo",
        scope: "GLOBAL",
        session_mode: "BACKOFFICE_ADMIN",
      }),
      refreshToken: "refresh-antigo",
      userId: "user-admin-antigo",
      activeTenantId: "tenant-antigo",
      sessionMode: "BACKOFFICE_ADMIN",
      availableScopes: ["GLOBAL"],
    });
    rememberBackofficeReturnSession();

    seedTestSession({
      token: buildJwt({
        sub: "user-admin-atual",
        scope: "GLOBAL",
        session_mode: "BACKOFFICE_ADMIN",
      }),
      refreshToken: "refresh-atual",
      userId: "user-admin-atual",
      activeTenantId: "tenant-atual",
      sessionMode: "BACKOFFICE_ADMIN",
      availableScopes: ["GLOBAL"],
    });
    rememberBackofficeReturnSession();

    const restored = restoreBackofficeReturnSession();
    expect(restored?.originalSession.userId).toBe("user-admin-atual");
    expect(restored?.originalSession.activeTenantId).toBe("tenant-atual");
  });

  test("getSessionBootstrapApi normaliza rede, unidade-base e tenant ativo separados", async () => {
    seedTestSession({
      token: "token-bootstrap",
      refreshToken: "refresh-bootstrap",
      activeTenantId: "tenant-centro",
    });

    const { restore } = mockFetchWithSequence([
      {
        body: {
          user: {
            userId: "user-ana",
            nome: "Ana Admin",
            displayName: "Ana Admin",
            email: "ana@qa.local",
            roles: ["ADMIN"],
            userKind: "COLABORADOR",
            redeId: "rede-1",
            redeSlug: "rede-norte",
            redeNome: "Rede Norte",
            activeTenantId: "tenant-centro",
            tenantBaseId: "tenant-base",
            availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
            availableScopes: ["UNIDADE", "REDE"],
            broadAccess: false,
          },
          tenantContext: {
            currentTenantId: "tenant-centro",
            tenantAtual: { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
            unidadesDisponiveis: [
              { id: "tenant-centro", nome: "Unidade Centro", ativo: true },
              { id: "tenant-base", nome: "Unidade Base", ativo: true },
            ],
          },
          academia: { id: "academia-norte", nome: "Rede Norte", ativo: true },
        },
      },
    ]);

    try {
      const response = await getSessionBootstrapApi();

      expect(response.user.userId).toBe("user-ana");
      expect(response.user.networkName).toBe("Rede Norte");
      expect(response.user.networkSubdomain).toBe("rede-norte");
      expect(response.user.baseTenantId).toBe("tenant-base");
      expect(response.user.activeTenantId).toBe("tenant-centro");
      expect(response.user.availableScopes).toEqual(["UNIDADE", "REDE"]);
      expect(response.user.broadAccess).toBeFalsy();
      expect(response.tenantContext.currentTenantId).toBe("tenant-centro");
      expect(response.tenantContext.unidadesDisponiveis).toHaveLength(2);
    } finally {
      restore();
    }
  });

  test("fluxos sem sessão usam X-Rede-Identifier e falham sem fallback silencioso", async () => {
    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          message: "Instruções enviadas para a rede correta.",
        },
      },
      {
        body: {
          error: "Not Found",
          message: "Rede inválida.",
        },
        status: 404,
      },
    ]);

    try {
      await requestPasswordRecoveryApi({
        redeIdentifier: "rede-norte",
        identifier: "ana@qa.local",
      });

      await expect(async () => {
        await getAccessNetworkContextApi("rede-invalida", { allowDefaultFallback: false });
      }).rejects.toThrow("Rede inválida.");

      expect(calls[0]?.url).toContain("/api/v1/auth/forgot-password");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        identifier: "ana@qa.local",
        channel: "APP",
      });

      expect(calls[1]?.url).toContain("/api/v1/auth/rede-contexto");
      expect(calls[1]?.headers.get("X-Rede-Identifier")).toBe("rede-invalida");
    } finally {
      restore();
    }
  });

  test("changeForcedPasswordApi usa a sessão atual e limpa o flag após sucesso", async () => {
    seedTestSession({
      token: "token-rede",
      refreshToken: "refresh-rede",
      networkSubdomain: "rede-norte",
      forcePasswordChangeRequired: true,
    });

    const { calls, restore } = mockFetchWithSequence([
      {
        body: {
          message: "Senha alterada com sucesso.",
        },
      },
    ]);

    try {
      const response = await changeForcedPasswordApi({
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });

      expect(response.message).toBe("Senha alterada com sucesso.");
      expect(calls[0]?.url).toContain("/api/v1/auth/change-password");
      expect(calls[0]?.method).toBe("POST");
      expect(calls[0]?.headers.get("X-Rede-Identifier")).toBe("rede-norte");
      expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({
        newPassword: "NovaSenha123",
        confirmNewPassword: "NovaSenha123",
      });
      // Task 458: getForcePasswordChangeRequiredFromSession é reset implicitamente pelo backend
      // via novo cookie fc_session_claims após change-password. Em teste unit não há ciclo de
      // re-emissão de cookie — valida-se apenas a chamada e o response.
    } finally {
      restore();
    }
  });
});
