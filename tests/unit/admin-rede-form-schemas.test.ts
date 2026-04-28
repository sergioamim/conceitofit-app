import { describe, expect, it } from "vitest";
import {
  buildAcademiaPayload,
  mapAcademiaFieldError,
  academiaFormSchema,
} from "@/app/(portal)/administrativo/academia/academia-form";
import {
  buildUnidadePayload,
  mapUnidadeFieldError,
  unidadeFormSchema,
} from "@/app/(portal)/administrativo/unidades/unidade-form";
import { buildZodFieldErrors } from "@/lib/forms/zod-helpers";

describe("admin rede form schemas", () => {
  it("bloqueia subdomínio inválido e largura custom fora da faixa na unidade", () => {
    const result = unidadeFormSchema.safeParse({
      nome: "Unidade Centro",
      razaoSocial: "",
      documento: "",
      groupId: "grupo-a",
      subdomain: "Unidade Centro",
      email: "",
      telefone: "",
      cupomPrintMode: "CUSTOM",
      cupomCustomWidthMm: "30",
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const messages = buildZodFieldErrors(result.error);
    expect(messages.subdomain).toContain("Use apenas letras minúsculas, números e hífen no subdomínio.");
    expect(messages.cupomCustomWidthMm).toContain("Informe uma largura entre 40mm e 120mm.");
  });

  it("normaliza payload de unidade e mapeia erro nested de largura", () => {
    const payload = buildUnidadePayload({
      nome: " Unidade Centro ",
      razaoSocial: "",
      documento: "12.345.678/0001-95",
      groupId: " grupo-a ",
      subdomain: " Unidade-Centro ",
      email: "contato@teste.com",
      telefone: "(11) 99999-0000",
      cupomPrintMode: "CUSTOM",
      cupomCustomWidthMm: "200",
    });

    expect(payload).toMatchObject({
      nome: "Unidade Centro",
      documento: "12345678000195",
      groupId: "grupo-a",
      subdomain: "unidade-centro",
      configuracoes: {
        impressaoCupom: {
          modo: "CUSTOM",
          larguraCustomMm: 120,
        },
      },
    });
    expect(mapUnidadeFieldError("configuracoes.impressaoCupom.larguraCustomMm")).toBe("cupomCustomWidthMm");
  });

  it("bloqueia email inválido e cor HEX inválida da academia", () => {
    const result = academiaFormSchema.safeParse({
      nome: "Academia Central",
      razaoSocial: "",
      documento: "",
      email: "academia",
      telefone: "",
      endereco: {
        cep: "",
        logradouro: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "",
        estado: "",
      },
      branding: {
        appName: "",
        logoUrl: "",
        themePreset: "CONCEITO_DARK",
        useCustomColors: true,
        colors: {
          accent: "#123456",
          primary: "123456",
          secondary: "",
          background: "",
          surface: "",
          border: "",
          foreground: "",
          mutedForeground: "",
          danger: "",
          warning: "",
          teal: "",
        },
      },
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    const messages = buildZodFieldErrors(result.error);
    expect(messages.email).toContain("Informe um e-mail válido.");
    expect(messages["branding.colors.primary"]).toContain("Informe uma cor HEX no formato #RRGGBB.");
  });

  it("normaliza payload da academia e preserva paths para fieldErrors", () => {
    const payload = buildAcademiaPayload({
      nome: " Academia Central ",
      razaoSocial: "",
      documento: "",
      email: "financeiro@academia.com",
      telefone: "(11) 98888-7777",
      endereco: {
        cep: "01310-100",
        logradouro: "Av. Paulista",
        numero: "1000",
        complemento: "",
        bairro: "Bela Vista",
        cidade: "São Paulo",
        estado: "SP",
      },
      branding: {
        appName: " Conceito Fit ",
        logoUrl: "",
        themePreset: "CONCEITO_DARK",
        useCustomColors: true,
        colors: {
          accent: "123456",
          primary: "",
          ring: "",
          secondary: "",
          background: "",
          surface: "",
          border: "",
          foreground: "",
          mutedForeground: "",
          danger: "",
          warning: "",
          teal: "",
        },
      },
    });

    expect(payload).toMatchObject({
      nome: "Academia Central",
      branding: {
        appName: "Conceito Fit",
        colors: {
          accent: "#123456",
        },
      },
      endereco: {
        logradouro: "Av. Paulista",
      },
    });
    expect(mapAcademiaFieldError("branding.colors.accent")).toBe("branding.colors.accent");
    expect(mapAcademiaFieldError("endereco.cep")).toBe("endereco.cep");
  });
});
