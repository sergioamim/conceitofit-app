import { afterEach, describe, expect, it, vi } from "vitest";
import {
  saveStorefrontTheme,
  type StorefrontThemePayload,
} from "@/lib/api/storefront-theme";
import * as http from "@/lib/api/http";

/**
 * Regression tests for the StorefrontTheme P0 bug (audit C1, task #550).
 *
 * The Java DTO `StorefrontThemeRequest` uses `@JsonIgnoreProperties(ignoreUnknown=true)`
 * and expects `instagram/facebook/whatsapp` as FLAT fields (or via the `redesSociais` map).
 * The previous FE code sent them nested as `socialLinks: { instagram, ... }`, which
 * Jackson silently discarded — resulting in social links never being saved.
 *
 * These tests lock the payload shape so the bug cannot regress.
 */
describe("saveStorefrontTheme payload contract", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends social fields as flat properties, never as a nested socialLinks object", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue({ id: "t1", academiaId: "a1" } as never);

    const payload: StorefrontThemePayload = {
      heroTitle: "Bem-vindo",
      heroSubtitle: "Treine com a gente",
      instagram: "@conceitofit",
      facebook: "https://facebook.com/conceitofit",
      whatsapp: "5511999999999",
    };

    await saveStorefrontTheme("tenant-xyz", payload);

    expect(spy).toHaveBeenCalledTimes(1);
    const call = spy.mock.calls[0][0] as {
      path: string;
      method?: string;
      query?: Record<string, unknown>;
      body?: Record<string, unknown>;
    };

    expect(call.path).toBe("/api/v1/storefront/theme");
    expect(call.method).toBe("PUT");
    expect(call.query).toEqual({ tenantId: "tenant-xyz" });

    const body = call.body!;
    expect(body.instagram).toBe("@conceitofit");
    expect(body.facebook).toBe("https://facebook.com/conceitofit");
    expect(body.whatsapp).toBe("5511999999999");
    // The nested socialLinks was the silent-drop bug — must NEVER be sent.
    expect(body).not.toHaveProperty("socialLinks");
  });

  it("preserves legacy hero/color fields the BE still accepts and merges", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue({ id: "t1" } as never);

    const payload: StorefrontThemePayload = {
      heroImageUrl: "https://cdn/hero.jpg",
      heroTitle: "Título",
      heroSubtitle: "Subtítulo",
      useCustomColors: true,
      colors: {
        primary: "#c8f135",
        background: "#16181c",
      },
      footerText: "© 2026",
    };

    await saveStorefrontTheme("tenant-xyz", payload);

    const body = spy.mock.calls[0][0].body as Record<string, unknown>;
    expect(body.heroImageUrl).toBe("https://cdn/hero.jpg");
    expect(body.heroTitle).toBe("Título");
    expect(body.heroSubtitle).toBe("Subtítulo");
    expect(body.useCustomColors).toBe(true);
    expect(body.colors).toEqual({ primary: "#c8f135", background: "#16181c" });
    expect(body.footerText).toBe("© 2026");
  });

  it("accepts the new BE-native schema fields (titulo, bannerUrl, corPrimaria, etc.)", async () => {
    const spy = vi
      .spyOn(http, "apiRequest")
      .mockResolvedValue({ id: "t1" } as never);

    const payload: StorefrontThemePayload = {
      titulo: "Bem-vindo",
      subtitulo: "Subtítulo",
      descricao: "Descrição longa",
      bannerUrl: "https://cdn/banner.jpg",
      corPrimaria: "#c8f135",
      corSecundaria: "#3de8a0",
      corFundo: "#16181c",
      corTexto: "#ffffff",
      galeriaUrls: ["https://cdn/1.jpg", "https://cdn/2.jpg"],
      redesSociais: { instagram: "@conceitofit", tiktok: "@conceitofit" },
      customCssVars: { "--brand-font": "Syne" },
      ativo: true,
    };

    await saveStorefrontTheme("tenant-xyz", payload);

    const body = spy.mock.calls[0][0].body as Record<string, unknown>;
    expect(body.titulo).toBe("Bem-vindo");
    expect(body.bannerUrl).toBe("https://cdn/banner.jpg");
    expect(body.corPrimaria).toBe("#c8f135");
    expect(body.galeriaUrls).toEqual(["https://cdn/1.jpg", "https://cdn/2.jpg"]);
    expect(body.redesSociais).toEqual({
      instagram: "@conceitofit",
      tiktok: "@conceitofit",
    });
    expect(body.customCssVars).toEqual({ "--brand-font": "Syne" });
    expect(body.ativo).toBe(true);
  });
});
