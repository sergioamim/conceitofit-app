import { expect, test } from "@playwright/test";
import {
  buildNetworkAccessHref,
  getNetworkSubdomainFromHost,
  resolveNetworkSubdomain,
} from "../../src/lib/network-subdomain";

test.describe("network subdomain helpers", () => {
  test("resolve subdomínio por rota e por host localhost", () => {
    expect(resolveNetworkSubdomain({ routeSubdomain: "Rede-Norte" })).toBe("rede-norte");
    expect(resolveNetworkSubdomain({ host: "rede-norte.localhost:3000" })).toBe("rede-norte");
    expect(resolveNetworkSubdomain({ routeSubdomain: "rede-sul", host: "rede-norte.localhost:3000" })).toBe("rede-sul");
    expect(getNetworkSubdomainFromHost("localhost:3000")).toBeUndefined();
  });

  test("monta links canônicos de autenticação por subdomínio", () => {
    expect(buildNetworkAccessHref("login", "rede-norte")).toBe("/acesso/rede-norte/autenticacao");
    expect(buildNetworkAccessHref("forgot-password", "rede-norte")).toBe("/acesso/rede-norte/recuperar-senha");
    expect(buildNetworkAccessHref("first-access", "rede-norte")).toBe("/acesso/rede-norte/primeiro-acesso");
  });
});
