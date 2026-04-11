import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @sentry/nextjs antes de importar logger
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

import { logger } from "@/lib/shared/logger";
import * as Sentry from "@sentry/nextjs";

describe("logger", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("info", () => {
    it("chama console.log com tag + message", () => {
      logger.info("hello");
      expect(logSpy).toHaveBeenCalledTimes(1);
      const [tag, msg] = logSpy.mock.calls[0];
      expect(String(tag)).toContain("INFO");
      expect(msg).toBe("hello");
    });

    it("inclui module na tag quando presente", () => {
      logger.info("hello", { module: "auth" });
      const [tag] = logSpy.mock.calls[0];
      expect(String(tag)).toContain("[auth]");
    });

    it("inclui requestId na tag quando presente", () => {
      logger.info("hello", { requestId: "req-123" });
      const [tag] = logSpy.mock.calls[0];
      expect(String(tag)).toContain("[req:req-123]");
    });

    it("passa extras como terceiro argumento", () => {
      logger.info("hello", { module: "auth", userId: 42, ip: "1.1.1.1" });
      const call = logSpy.mock.calls[0];
      expect(call[2]).toEqual({ userId: 42, ip: "1.1.1.1" });
    });

    it("não envia info para Sentry", () => {
      logger.info("hello");
      expect(Sentry.captureException).not.toHaveBeenCalled();
      expect(Sentry.addBreadcrumb).not.toHaveBeenCalled();
    });
  });

  describe("warn", () => {
    it("chama console.warn", () => {
      logger.warn("atenção");
      expect(warnSpy).toHaveBeenCalled();
    });

    it("adiciona breadcrumb no Sentry", () => {
      logger.warn("atenção", { module: "billing" });
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({
          category: "billing",
          message: "atenção",
          level: "warning",
        }),
      );
    });

    it("usa 'app' como category default quando module ausente", () => {
      logger.warn("atenção");
      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith(
        expect.objectContaining({ category: "app" }),
      );
    });
  });

  describe("error", () => {
    it("chama console.error", () => {
      logger.error("falhou");
      expect(errorSpy).toHaveBeenCalled();
    });

    it("captura exception no Sentry com o Error real quando presente", () => {
      const err = new Error("falha critica");
      logger.error("wrapper", { module: "auth", error: err });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        err,
        expect.objectContaining({
          tags: expect.objectContaining({ module: "auth", handled: "false" }),
          extra: expect.objectContaining({ error: err }),
        }),
      );
    });

    it("cria um novo Error quando meta.error não é uma Error instance", () => {
      logger.error("mensagem sem Error", { module: "billing" });
      expect(Sentry.captureException).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          tags: expect.objectContaining({ module: "billing", handled: "false" }),
        }),
      );
      const [errArg] = (Sentry.captureException as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(errArg.message).toBe("mensagem sem Error");
    });
  });
});
