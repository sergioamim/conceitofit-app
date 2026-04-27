import { beforeEach, afterEach, describe, expect, test } from "vitest";
import { adminEntrarComoUnidadeApi } from "../../src/lib/api/auth";
import { clearAuthSession, getSessionModeFromSession } from "../../src/lib/api/session";
import { installMockBrowser, mockFetchWithSequence, seedTestSession } from "./support/test-runtime";

let browser: ReturnType<typeof installMockBrowser> | undefined;

function buildJwt(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    Buffer.from(JSON.stringify(value), "utf-8").toString("base64url");
  return `${encode({ alg: "HS256", typ: "JWT" })}.${encode(payload)}.signature`;
}

describe("auth network handoff", () => {
  beforeEach(() => {
    browser = installMockBrowser();
    clearAuthSession();
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
  });

  afterEach(() => {
    clearAuthSession();
    browser?.restore();
  });

  test("adminEntrarComoUnidadeApi força handoff operacional quando a resposta imediata ainda não traz sessionMode", async () => {
    seedTestSession({
      token: buildJwt({
        sub: "user-admin",
        scope: "GLOBAL",
        session_mode: "BACKOFFICE_ADMIN",
      }),
      refreshToken: "refresh-admin",
      userId: "user-admin",
      activeTenantId: "tenant-admin",
      sessionMode: "BACKOFFICE_ADMIN",
      availableScopes: ["GLOBAL"],
    });

    const { restore } = mockFetchWithSequence([
      {
        body: {
          refreshToken: "refresh-admin-unidade",
          userId: "user-admin",
          activeTenantId: "tenant-centro",
        },
      },
    ]);

    try {
      const session = await adminEntrarComoUnidadeApi({
        academiaId: "academia-norte",
        tenantId: "tenant-centro",
      });

      expect(session.activeTenantId).toBe("tenant-centro");
      expect(session.sessionMode).toBe("BACKOFFICE_TO_OPERATIONAL");
      expect(getSessionModeFromSession()).toBe("BACKOFFICE_TO_OPERATIONAL");
    } finally {
      restore();
    }
  });
});
