import { afterEach, describe, expect, it, vi } from "vitest";
import { parseAppEnv } from "@/lib/env";

describe("parseAppEnv", () => {
  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

  afterEach(() => {
    errorSpy.mockClear();
  });

  it("faz o parse com sucesso quando BACKEND_PROXY_TARGET está definido", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "http://localhost:8080",
      BACKEND_PROXY_MAX_BODY_SIZE: "200",
      NEXT_PUBLIC_SENTRY_DSN: "",
    });

    expect(env.BACKEND_PROXY_TARGET).toBe("http://localhost:8080");
    expect(env.BACKEND_PROXY_MAX_BODY_SIZE).toBe(200);
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
  });

  it("falha com mensagem clara quando BACKEND_PROXY_TARGET não está definido", () => {
    expect(() => parseAppEnv({})).toThrow(
      "Variáveis de ambiente inválidas. Revise o log acima antes de subir o Next.js."
    );
    expect(errorSpy).toHaveBeenCalledWith("[env] Falha na validação das variáveis de ambiente:");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("BACKEND_PROXY_TARGET"));
  });
});
