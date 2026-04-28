import { describe, expect, it } from "vitest";
import {
  backofficeUnidadeSchema,
  buildBackofficeUnidadePayload,
  mapBackofficeUnidadeFieldError,
} from "@/lib/forms/backoffice-unidade-form";

describe("backofficeUnidadeSchema", () => {
  it("rejeita campos obrigatórios inválidos", () => {
    const result = backofficeUnidadeSchema.safeParse({
      academiaId: "",
      nome: "  ",
      razaoSocial: "",
      documento: "",
      groupId: "",
      subdomain: "Sub Dominio",
      email: "email-invalido",
      telefone: "",
      ativo: true,
      cupomPrintMode: "80MM",
      cupomCustomWidthMm: "80",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.academiaId).toContain("Selecione a academia.");
    expect(result.error?.flatten().fieldErrors.nome).toContain("Informe o nome da unidade.");
    expect(result.error?.flatten().fieldErrors.documento).toContain("Informe o documento da unidade.");
    expect(result.error?.flatten().fieldErrors.subdomain).toContain("Use apenas letras minúsculas, números e hífen no subdomínio.");
    expect(result.error?.flatten().fieldErrors.email).toContain("Informe um e-mail válido.");
  });

  it("rejeita groupId divergente da academia selecionada", () => {
    const result = backofficeUnidadeSchema.safeParse({
      academiaId: "academia-a",
      nome: "Unidade Centro",
      razaoSocial: "",
      documento: "12345678000195",
      groupId: "academia-b",
      subdomain: "unidade-centro",
      email: "contato@teste.com",
      telefone: "",
      ativo: true,
      cupomPrintMode: "80MM",
      cupomCustomWidthMm: "80",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.groupId).toContain("O groupId deve corresponder à academia selecionada.");
  });

  it("normaliza payload de unidade e mapeia erro nested de largura", () => {
    const payload = buildBackofficeUnidadePayload({
      academiaId: " academia-a ",
      nome: " Unidade Centro ",
      razaoSocial: "",
      documento: "12.345.678/0001-95",
      groupId: "",
      subdomain: " Unidade-Centro ",
      email: "contato@teste.com",
      telefone: "(11) 99999-0000",
      ativo: true,
      cupomPrintMode: "CUSTOM",
      cupomCustomWidthMm: "200",
    });

    expect(payload).toMatchObject({
      academiaId: "academia-a",
      groupId: "academia-a",
      nome: "Unidade Centro",
      documento: "12.345.678/0001-95",
      subdomain: "unidade-centro",
      configuracoes: {
        impressaoCupom: {
          modo: "CUSTOM",
          larguraCustomMm: 120,
        },
      },
    });
    expect(mapBackofficeUnidadeFieldError("configuracoes.impressaoCupom.larguraCustomMm")).toBe("cupomCustomWidthMm");
  });
});
