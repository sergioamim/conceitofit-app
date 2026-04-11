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
    } as unknown as NodeJS.ProcessEnv);

    expect(env.BACKEND_PROXY_TARGET).toBe("http://localhost:8080");
    expect(env.BACKEND_PROXY_MAX_BODY_SIZE).toBe(200);
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
  });

  it("falha com mensagem clara quando BACKEND_PROXY_TARGET não está definido", () => {
    expect(() => parseAppEnv({} as unknown as NodeJS.ProcessEnv)).toThrow(
      "Variáveis de ambiente inválidas. Revise o log acima antes de subir o Next.js."
    );
    expect(errorSpy).toHaveBeenCalledWith("[env] Falha na validação das variáveis de ambiente:");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("BACKEND_PROXY_TARGET"));
  });

  it("rejeita URL inválida em BACKEND_PROXY_TARGET", () => {
    expect(() =>
      parseAppEnv({ BACKEND_PROXY_TARGET: "nao-url" } as unknown as NodeJS.ProcessEnv),
    ).toThrow(/Variáveis de ambiente inválidas/);
  });

  it("aplica default 150 em BACKEND_PROXY_MAX_BODY_SIZE quando ausente", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "https://api.example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.BACKEND_PROXY_MAX_BODY_SIZE).toBe(150);
  });

  it("converte strings vazias em undefined para URLs opcionais", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "https://api.example.com",
      NEXT_PUBLIC_API_BASE_URL: "",
      NEXT_PUBLIC_SENTRY_DSN: "   ",
      NEXT_PUBLIC_CDN_URL: "",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBeUndefined();
    expect(env.NEXT_PUBLIC_CDN_URL).toBeUndefined();
  });

  it("aceita URLs opcionais válidas", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "https://api.example.com",
      NEXT_PUBLIC_API_BASE_URL: "https://api.foo.com",
      NEXT_PUBLIC_SENTRY_DSN: "https://sentry.io/123",
      NEXT_PUBLIC_CDN_URL: "https://cdn.foo.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.NEXT_PUBLIC_API_BASE_URL).toBe("https://api.foo.com");
    expect(env.NEXT_PUBLIC_SENTRY_DSN).toBe("https://sentry.io/123");
    expect(env.NEXT_PUBLIC_CDN_URL).toBe("https://cdn.foo.com");
  });

  it("valida enums de debug flags (true/false)", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "https://api.example.com",
      NEXT_PUBLIC_DEBUG_REACT_SCAN: "true",
      NEXT_PUBLIC_DEBUG_QUERY_DEVTOOLS: "false",
      NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS: "true",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.NEXT_PUBLIC_DEBUG_REACT_SCAN).toBe("true");
    expect(env.NEXT_PUBLIC_DEBUG_QUERY_DEVTOOLS).toBe("false");
    expect(env.NEXT_PUBLIC_DEBUG_SESSION_DEVTOOLS).toBe("true");
  });

  it("rejeita valor inválido em debug flag", () => {
    expect(() =>
      parseAppEnv({
        BACKEND_PROXY_TARGET: "https://api.example.com",
        NEXT_PUBLIC_DEBUG_REACT_SCAN: "maybe",
      } as unknown as NodeJS.ProcessEnv),
    ).toThrow();
  });

  it("trima STOREFRONT_ROOT_HOSTS", () => {
    const env = parseAppEnv({
      BACKEND_PROXY_TARGET: "https://api.example.com",
      STOREFRONT_ROOT_HOSTS: "  conceitofit.com.br  ",
    } as unknown as NodeJS.ProcessEnv);
    expect(env.STOREFRONT_ROOT_HOSTS).toBe("conceitofit.com.br");
  });
});
