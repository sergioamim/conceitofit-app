import { describe, expect, it } from "vitest";
import { academiaThemeFormSchema } from "@/app/(portal)/administrativo/academia/academia-form-schema";

describe("academiaThemeFormSchema", () => {
  it("aceita payload válido e trima campos textuais", () => {
    const result = academiaThemeFormSchema.parse({
      nome: "  Rede Conceito  ",
      razaoSocial: "  Conceito Fit LTDA  ",
      documento: "",
      email: "  rede@conceitofit.com.br  ",
      telefone: " 11999999999 ",
      endereco: {
        cep: " 01001-000 ",
        logradouro: " Avenida Brasil ",
        numero: "100",
        complemento: "",
        bairro: " Centro ",
        cidade: " São Paulo ",
        estado: " SP ",
      },
      branding: {
        appName: "  Conceito Fit  ",
        logoUrl: " https://cdn/logo.png ",
        themePreset: "LUMEN_FINANCE",
        useCustomColors: true,
        colors: {
          accent: "#6DA512",
          primary: "#5F8E10",
          secondary: "#E7EAEF",
          background: "#F8F9FB",
          surface: "#FFFFFF",
          border: "#DDE1E7",
          foreground: "#1A1D24",
          mutedForeground: "#6E7381",
          danger: "#D64545",
          warning: "#D88B1A",
          teal: "#1EA06A",
        },
      },
    });

    expect(result.nome).toBe("Rede Conceito");
    expect(result.razaoSocial).toBe("Conceito Fit LTDA");
    expect(result.email).toBe("rede@conceitofit.com.br");
    expect(result.endereco.logradouro).toBe("Avenida Brasil");
    expect(result.branding.logoUrl).toBe("https://cdn/logo.png");
  });

  it("rejeita cor customizada fora do formato #RRGGBB", () => {
    const result = academiaThemeFormSchema.safeParse({
      nome: "Rede Conceito",
      razaoSocial: "",
      documento: "",
      email: "",
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
          accent: "#12345",
          primary: "",
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
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path.join(".") === "branding.colors.accent")).toBe(true);
    }
  });
});
