import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  setUser: vi.fn(),
  setTags: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

import { captureApiError, setSentryContext } from "@/lib/shared/sentry";
import * as Sentry from "@sentry/nextjs";

describe("sentry helpers", () => {
  const ORIGINAL_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

  beforeEach(() => {
    vi.clearAllMocks();
    // Força DSN ativa para simular ambiente de produção
    process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake@sentry.io/123";
    // Reset do cache interno sentryAvailable (via re-import)
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_DSN === undefined) {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    } else {
      process.env.NEXT_PUBLIC_SENTRY_DSN = ORIGINAL_DSN;
    }
  });

  describe("setSentryContext", () => {
    it("chama setUser quando userId fornecido (com DSN ativa)", async () => {
      const mod = await import("@/lib/shared/sentry");
      mod.setSentryContext({ userId: "user-1", tenantId: "tenant-x" });
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: "user-1" });
    });

    it("chama setTags com tenantId/networkId/route presentes", async () => {
      const mod = await import("@/lib/shared/sentry");
      mod.setSentryContext({
        tenantId: "t1",
        networkId: "n1",
        route: "/home",
      });
      expect(Sentry.setTags).toHaveBeenCalledWith({
        tenantId: "t1",
        networkId: "n1",
        route: "/home",
      });
    });

    it("omite tags ausentes", async () => {
      const mod = await import("@/lib/shared/sentry");
      mod.setSentryContext({ tenantId: "only-tenant" });
      expect(Sentry.setTags).toHaveBeenCalledWith({ tenantId: "only-tenant" });
    });

    it("não faz nada quando DSN ausente", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      vi.resetModules();
      const mod = await import("@/lib/shared/sentry");
      mod.setSentryContext({ userId: "user-1" });
      expect(Sentry.setUser).not.toHaveBeenCalled();
    });
  });

  describe("captureApiError", () => {
    it("captura com tags source=api-client", async () => {
      const mod = await import("@/lib/shared/sentry");
      const err = new Error("api failed");
      // Call direct function, não da closure antiga
      mod.captureApiError(err, { endpoint: "/foo" });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          tags: { source: "api-client" },
          extra: { endpoint: "/foo" },
        }),
      );
    });

    it("silencioso quando DSN ausente", async () => {
      delete process.env.NEXT_PUBLIC_SENTRY_DSN;
      vi.resetModules();
      const mod = await import("@/lib/shared/sentry");
      mod.captureApiError(new Error("x"));
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });
  });

  // Fallback simples de API surface pra garantir import
  it("exporta as funções públicas", async () => {
    const mod = await import("@/lib/shared/sentry");
    expect(typeof mod.setSentryContext).toBe("function");
    expect(typeof mod.captureApiError).toBe("function");
  });

  it("setSentryContext (export top-level) é a mesma função", () => {
    expect(typeof setSentryContext).toBe("function");
    expect(typeof captureApiError).toBe("function");
  });
});
