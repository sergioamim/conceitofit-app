import { expect, test } from "@playwright/test";
import { buildLoginHref, resolvePostLoginPath } from "../../src/lib/shared/auth-redirect";
import { hasClientDeleteCapability, hasElevatedAccess, normalizeRoles } from "../../src/lib/shared/access-control";

const envSnapshot = {
  contextualNetworkAccess: process.env.NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED,
};

test.afterEach(() => {
  process.env.NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED = envSnapshot.contextualNetworkAccess;
});

test.describe("session context helpers", () => {
  test("resolvePostLoginPath aceita apenas caminhos internos seguros", async () => {
    expect(resolvePostLoginPath("/administrativo/contas-bancarias")).toBe("/administrativo/contas-bancarias");
    expect(resolvePostLoginPath("/clientes?q=ana")).toBe("/clientes?q=ana");
    expect(resolvePostLoginPath("https://malicioso.com")).toBe("/dashboard");
    expect(resolvePostLoginPath("//malicioso.com")).toBe("/dashboard");
    expect(resolvePostLoginPath("/login")).toBe("/dashboard");
    expect(resolvePostLoginPath("/app/rede-norte/login")).toBe("/dashboard");
    expect(resolvePostLoginPath("/acesso/rede-norte/autenticacao")).toBe("/dashboard");
    expect(resolvePostLoginPath("")).toBe("/dashboard");
  });

  test("buildLoginHref preserva next apenas para rotas válidas", async () => {
    process.env.NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED = "true";
    expect(buildLoginHref("/administrativo/maquininhas")).toBe(
      "/login?next=%2Fadministrativo%2Fmaquininhas"
    );
    expect(buildLoginHref("/dashboard")).toBe("/login");
    expect(buildLoginHref("https://malicioso.com")).toBe("/login");
    expect(buildLoginHref("/clientes", "rede-norte")).toBe(
      "/acesso/rede-norte/autenticacao?next=%2Fclientes"
    );
    expect(buildLoginHref("/dashboard", "rede-norte")).toBe("/acesso/rede-norte/autenticacao");
  });

  test("buildLoginHref volta para login legado quando a flag contextual estiver desligada", async () => {
    process.env.NEXT_PUBLIC_CONTEXTUAL_NETWORK_ACCESS_ENABLED = "false";
    expect(buildLoginHref("/clientes", "rede-norte")).toBe("/login?next=%2Fclientes");
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
