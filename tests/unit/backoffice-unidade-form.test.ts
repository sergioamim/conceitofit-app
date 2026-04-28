import { describe, expect, it } from "vitest";
import { backofficeUnidadeSchema } from "@/lib/forms/backoffice-unidade-form";

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
});
