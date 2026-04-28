import { describe, expect, it } from "vitest";
import {
  backofficeAcademiaCreateSchema,
  backofficeAcademiaDetailSchema,
} from "@/lib/forms/backoffice-academia-form";

describe("backofficeAcademiaCreateSchema", () => {
  it("rejeita nome vazio", () => {
    const result = backofficeAcademiaCreateSchema.safeParse({
      nome: "   ",
      documento: "",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.nome).toContain("Informe o nome da academia.");
  });
});

describe("backofficeAcademiaDetailSchema", () => {
  it("rejeita e-mail inválido", () => {
    const result = backofficeAcademiaDetailSchema.safeParse({
      nome: "Academia Central",
      razaoSocial: "",
      documento: "",
      email: "email-invalido",
      telefone: "",
      ativo: "ATIVA",
    });

    expect(result.success).toBe(false);
    expect(result.error?.flatten().fieldErrors.email).toContain("Informe um e-mail válido.");
  });
});
