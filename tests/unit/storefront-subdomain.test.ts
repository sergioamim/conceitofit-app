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

  it("retorna undefined para host vazio ou whitespace", () => {
    expect(extractSubdomain("", rootHosts)).toBeUndefined();
    expect(extractSubdomain("   ", rootHosts)).toBeUndefined();
  });

  it("retorna undefined para 'www.exemplo.com'", () => {
    expect(extractSubdomain("www.conceitofit.com.br", rootHosts)).toBeUndefined();
  });

  it("normaliza case (uppercase host)", () => {
    expect(extractSubdomain("ALPHA.CONCEITOFIT.COM.BR", rootHosts)).toBe("alpha");
  });

  it("retorna undefined para rootHost com case diferente", () => {
    expect(extractSubdomain("CONCEITOFIT.COM.BR", rootHosts)).toBeUndefined();
  });

  it("rejeita domínios com menos de 3 partes", () => {
    expect(extractSubdomain("example.com", rootHosts)).toBeUndefined();
  });

  it("retorna primeira parte como subdomínio em domínio com 3+ partes", () => {
    expect(extractSubdomain("foo.bar.baz.com", rootHosts)).toBe("foo");
  });

  it("ignora label vazio (ex: .localhost só)", () => {
    expect(extractSubdomain(".localhost", rootHosts)).toBeUndefined();
  });

  it("aceita IPv6 entre brackets e retorna undefined", () => {
    expect(extractSubdomain("[2001:db8::1]:8080", rootHosts)).toBeUndefined();
  });

  it("aceita IPv4 puro", () => {
    expect(extractSubdomain("192.168.1.1", rootHosts)).toBeUndefined();
  });

  it("rejeita IPv4 com segmentos fora do range", () => {
    // 999 não é IPv4 válido, mas 3 partes → volta ao cálculo de subdomain
    expect(extractSubdomain("999.168.1.1", rootHosts)).toBe("999");
  });
});
