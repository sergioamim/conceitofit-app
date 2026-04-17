import { describe, expect, it } from "vitest";
import {
  buildTenantThemeCssVars,
  parseTenantThemeCookiePayload,
  serializeTenantThemeCookiePayload,
  TENANT_THEME_PRESETS,
} from "@/lib/tenant/tenant-theme";

describe("tenant theme helpers", () => {
  it("serializa e parseia payload escopado por tenant", () => {
    const encoded = serializeTenantThemeCookiePayload({
      scopeKey: "tenant:tenant-123",
      appName: "Academia Sergio Amim",
      theme: TENANT_THEME_PRESETS.MENTA_MODERNA,
    });

    expect(parseTenantThemeCookiePayload(encoded)).toEqual({
      scopeKey: "tenant:tenant-123",
      appName: "Academia Sergio Amim",
      theme: TENANT_THEME_PRESETS.MENTA_MODERNA,
    });
  });

  it("continua aceitando o formato legado com apenas o objeto do tema", () => {
    const legacy = encodeURIComponent(JSON.stringify(TENANT_THEME_PRESETS.CONCEITO_DARK));

    expect(parseTenantThemeCookiePayload(legacy)).toEqual({
      theme: TENANT_THEME_PRESETS.CONCEITO_DARK,
    });
  });

  it("gera css crítico completo com variáveis derivadas", () => {
    const css = buildTenantThemeCssVars(TENANT_THEME_PRESETS.AREIA_SOLAR);

    expect(css).toContain("--primary:#f59e0b;");
    expect(css).toContain("--primary-foreground:#f8f2e7;");
    expect(css).toContain("--accent-foreground:#3f2d1b;");
    expect(css).toContain("--chart-2:#0f766e;");
  });
});
