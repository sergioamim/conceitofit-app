import { expect, test } from "@playwright/test";
import { buildLoginHref, resolvePostLoginPath } from "../../src/lib/auth-redirect";
import { hasClientDeleteCapability, hasElevatedAccess, normalizeRoles } from "../../src/lib/access-control";

test.describe("session context helpers", () => {
  test("resolvePostLoginPath aceita apenas caminhos internos seguros", async () => {
    expect(resolvePostLoginPath("/administrativo/contas-bancarias")).toBe("/administrativo/contas-bancarias");
    expect(resolvePostLoginPath("/clientes?q=ana")).toBe("/clientes?q=ana");
    expect(resolvePostLoginPath("https://malicioso.com")).toBe("/dashboard");
    expect(resolvePostLoginPath("//malicioso.com")).toBe("/dashboard");
    expect(resolvePostLoginPath("/login")).toBe("/dashboard");
    expect(resolvePostLoginPath("")).toBe("/dashboard");
  });

  test("buildLoginHref preserva next apenas para rotas válidas", async () => {
    expect(buildLoginHref("/administrativo/maquininhas")).toBe(
      "/login?next=%2Fadministrativo%2Fmaquininhas"
    );
    expect(buildLoginHref("/dashboard")).toBe("/login");
    expect(buildLoginHref("https://malicioso.com")).toBe("/login");
  });

  test("normalizeRoles e hasElevatedAccess tratam perfis administrativos", async () => {
    expect(normalizeRoles([" admin ", "financeiro"])).toEqual(["ADMIN", "FINANCEIRO"]);
    expect(hasElevatedAccess(["ADMIN"])).toBeTruthy();
    expect(hasElevatedAccess(["tenant_admin"])).toBeTruthy();
    expect(hasElevatedAccess(["recepcao"])).toBeFalsy();
    expect(hasElevatedAccess([])).toBeFalsy();
  });

  test("hasClientDeleteCapability respeita contrato ALTO/CLIENT_DELETE", async () => {
    expect(hasClientDeleteCapability([" alto "])).toBeTruthy();
    expect(hasClientDeleteCapability(["CLIENT_DELETE"])).toBeTruthy();
    expect(hasClientDeleteCapability(["ADMIN"])).toBeFalsy();
    expect(hasClientDeleteCapability(["recepcao"])).toBeFalsy();
  });
});
