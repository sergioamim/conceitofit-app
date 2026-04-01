import { describe, expect, it } from "vitest";
import { extractSubdomain } from "@/lib/storefront/subdomain";

describe("extractSubdomain", () => {
  const rootHosts = new Set(["localhost", "conceitofit.com.br"]);

  it("ignora hosts locais e enderecos IP", () => {
    expect(extractSubdomain("localhost:3000", rootHosts)).toBeUndefined();
    expect(extractSubdomain("127.0.0.1:3000", rootHosts)).toBeUndefined();
    expect(extractSubdomain("[::1]:3000", rootHosts)).toBeUndefined();
  });

  it("resolve subdominio em localhost para desenvolvimento", () => {
    expect(extractSubdomain("demo.localhost:3000", rootHosts)).toBe("demo");
  });

  it("resolve subdominio em dominio publico conhecido", () => {
    expect(extractSubdomain("alpha.conceitofit.com.br", rootHosts)).toBe("alpha");
  });
});
