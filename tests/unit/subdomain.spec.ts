import { expect, test } from "@playwright/test";
import { normalizeSubdomain } from "../../src/lib/utils/subdomain";

test.describe("subdomain utils", () => {
  test("normaliza nomes livres em slug de subdominio", () => {
    expect(normalizeSubdomain("ACADEMIA SERGIO AMIM - S6")).toBe("academia-sergio-amim-s6");
    expect(normalizeSubdomain("  Unidade São João  ")).toBe("unidade-sao-joao");
  });

  test("remove caracteres invalidos e evita vazio acidental", () => {
    expect(normalizeSubdomain("Loja @ Centro #1")).toBe("loja-centro-1");
    expect(normalizeSubdomain("---")).toBe("");
  });
});
