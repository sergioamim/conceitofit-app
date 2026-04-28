import { describe, expect, it } from "vitest";
import {
  buildUnidadePayload,
  mapUnidadeFieldError,
  unidadeFormSchema,
} from "@/app/(portal)/administrativo/unidades/unidade-form";
import {
  backofficeAcademiaCreateSchema,
  backofficeAcademiaDetailSchema,
  buildBackofficeAcademiaCreateDefaults,
  buildBackofficeAcademiaDetailDefaults,
} from "@/lib/forms/backoffice-academia-form";
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

  it("bloqueia nome vazio no create e email inválido no detalhe da academia", () => {
    const createResult = backofficeAcademiaCreateSchema.safeParse({
      nome: "   ",
      documento: "",
    });
    const detailResult = backofficeAcademiaDetailSchema.safeParse({
      nome: "Academia Central",
      razaoSocial: "",
      documento: "",
      email: "academia",
      telefone: "",
      ativo: "ATIVA",
    });

    expect(createResult.success).toBe(false);
    expect(detailResult.success).toBe(false);
    expect(createResult.error?.flatten().fieldErrors.nome).toContain("Informe o nome da academia.");
    expect(detailResult.error?.flatten().fieldErrors.email).toContain("Informe um e-mail válido.");
  });

  it("trima valores válidos da academia e expõe defaults estáveis do backoffice", () => {
    const result = backofficeAcademiaDetailSchema.safeParse({
      nome: " Academia Central ",
      razaoSocial: " Razão Social LTDA ",
      documento: " 46.208.771/0001-70 ",
      email: " financeiro@academia.com ",
      telefone: " (11) 98888-7777 ",
      ativo: "ATIVA",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toMatchObject({
      nome: "Academia Central",
      razaoSocial: "Razão Social LTDA",
      documento: "46.208.771/0001-70",
      email: "financeiro@academia.com",
      telefone: "(11) 98888-7777",
      ativo: "ATIVA",
    });
    expect(buildBackofficeAcademiaCreateDefaults()).toEqual({
      nome: "",
      documento: "",
    });
    expect(buildBackofficeAcademiaDetailDefaults()).toEqual({
      nome: "",
      razaoSocial: "",
      documento: "",
      email: "",
      telefone: "",
      ativo: "ATIVA",
    });
  });
});
