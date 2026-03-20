import { expect, test } from "@playwright/test";
import { resolveTenantTheme, TENANT_THEME_OPTIONS, TENANT_THEME_PRESETS } from "../../src/lib/tenant-theme";

test.describe("tenant theme presets", () => {
  test("expõe o catálogo ampliado com presets claros e Dracula", async () => {
    expect(TENANT_THEME_OPTIONS).toHaveLength(12);
    expect(TENANT_THEME_OPTIONS.map((item) => item.id)).toEqual(
      expect.arrayContaining([
        "DRACULA",
        "AREIA_SOLAR",
        "NUVEM_CLARA",
        "ROSA_EDITORIAL",
        "COBALTO_NOTURNO",
        "AURORA_BOREAL",
        "TERRACOTA_SUAVE",
        "MENTA_MODERNA",
      ])
    );
  });

  test("resolveTenantTheme aplica corretamente presets novos claros e escuros", async () => {
    expect(
      resolveTenantTheme({
        id: "acd-dracula",
        nome: "Academia Dracula",
        ativo: true,
        branding: {
          themePreset: "DRACULA",
          useCustomColors: false,
        },
      })
    ).toEqual(TENANT_THEME_PRESETS.DRACULA);

    expect(
      resolveTenantTheme({
        id: "acd-menta",
        nome: "Academia Menta",
        ativo: true,
        branding: {
          themePreset: "MENTA_MODERNA",
          useCustomColors: false,
        },
      })
    ).toEqual(TENANT_THEME_PRESETS.MENTA_MODERNA);
  });
});
