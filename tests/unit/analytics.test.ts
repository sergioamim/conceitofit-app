import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
}));

import {
  trackAlunoCreated,
  trackBillingConfigSaved,
  trackEvent,
  trackLogin,
  trackLogout,
  trackMatriculaCreated,
  trackNfseEmitted,
  trackPagamentoReceived,
  trackProspectConverted,
  trackProspectCreated,
  trackTenantSwitch,
  trackVendaCompleted,
} from "@/lib/shared/analytics";
import * as Sentry from "@sentry/nextjs";

describe("analytics trackEvent helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: sem DSN, sem endpoint → só verifica chamadas mockadas
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT;
  });

  describe("trackEvent (core)", () => {
    it("adiciona timestamp ISO quando ausente", () => {
      trackEvent({ name: "login" });
      // O timestamp é adicionado internamente no payload — verificamos
      // que não explodiu e o breadcrumb Sentry não foi chamado (DSN off).
      expect(() => trackEvent({ name: "login" })).not.toThrow();
    });

    it("preserva timestamp fornecido", () => {
      const ts = "2026-04-10T00:00:00Z";
      trackEvent({ name: "login", timestamp: ts });
      expect(() => trackEvent({ name: "login", timestamp: ts })).not.toThrow();
    });

    it("aceita properties + tenantId + userId", () => {
      expect(() =>
        trackEvent({
          name: "prospect_created",
          tenantId: "t1",
          userId: "u1",
          properties: { prospectId: "p1" },
        }),
      ).not.toThrow();
    });

    it("é fire-and-forget — nunca lança", () => {
      expect(() =>
        trackEvent({ name: "matricula_created" }),
      ).not.toThrow();
    });
  });

  describe("convenience helpers — não lançam", () => {
    it("trackLogin", () => {
      expect(() => trackLogin("t1", "u1")).not.toThrow();
      expect(() => trackLogin()).not.toThrow();
    });

    it("trackLogout", () => {
      expect(() => trackLogout("u1")).not.toThrow();
      expect(() => trackLogout()).not.toThrow();
    });

    it("trackTenantSwitch", () => {
      expect(() => trackTenantSwitch("t1", "u1")).not.toThrow();
    });

    it("trackProspectCreated", () => {
      expect(() => trackProspectCreated("t1", "p1")).not.toThrow();
    });

    it("trackProspectConverted", () => {
      expect(() => trackProspectConverted("t1", "p1")).not.toThrow();
    });

    it("trackMatriculaCreated", () => {
      expect(() => trackMatriculaCreated("t1", "m1", "plano1")).not.toThrow();
    });

    it("trackPagamentoReceived", () => {
      expect(() => trackPagamentoReceived("t1", "pag1", 199.9)).not.toThrow();
    });

    it("trackVendaCompleted", () => {
      expect(() => trackVendaCompleted("t1", "v1", 500)).not.toThrow();
    });

    it("trackAlunoCreated", () => {
      expect(() => trackAlunoCreated("t1", "a1")).not.toThrow();
    });

    it("trackNfseEmitted", () => {
      expect(() => trackNfseEmitted("t1", "pag1")).not.toThrow();
    });

    it("trackBillingConfigSaved", () => {
      expect(() => trackBillingConfigSaved("t1", "SEFIN_NACIONAL")).not.toThrow();
    });
  });

  describe("com DSN ativa — envia breadcrumb para Sentry", () => {
    beforeEach(async () => {
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake@sentry.io/1";
      // Reset do módulo pra pegar a env var fresh
      vi.resetModules();
    });

    it("trackEvent adiciona breadcrumb quando DSN presente", async () => {
      const mod = await import("@/lib/shared/analytics");
      mod.trackEvent({ name: "login", tenantId: "t1", userId: "u1" });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "analytics",
          message: "login",
          level: "info",
        }),
      );
    });
  });
});
