import { describe, expect, it } from "vitest";
import {
  adminOnboardingProvisionFormSchema,
  buildAdminOnboardingProvisionPayload,
  normalizeProvisionPhone,
} from "@/lib/forms/admin-onboarding-provision-form";
import { buildZodFieldErrors } from "@/lib/forms/zod-helpers";

describe("adminOnboardingProvisionFormSchema", () => {
  it("rejeita cnpj, email e telefone inválidos", () => {
    const tooShortPhone = adminOnboardingProvisionFormSchema.safeParse({
      academiaNome: "Academia Central",
      cnpj: "11.111.111/1111-11",
      unidadePrincipalNome: "Unidade Centro",
      adminNome: "Administrador",
      adminEmail: "admin",
      telefone: "12345",
    });

    expect(tooShortPhone.success).toBe(false);
    if (tooShortPhone.success) {
      return;
    }

    const messages = buildZodFieldErrors(tooShortPhone.error);
    expect(messages.cnpj).toContain("Informe um CNPJ válido.");
    expect(messages.adminEmail).toContain("Informe um e-mail válido.");
    expect(messages.telefone).toContain("Informe um telefone válido.");

    const tooLongPhone = adminOnboardingProvisionFormSchema.safeParse({
      academiaNome: "Academia Central",
      cnpj: "46.208.771/0001-70",
      unidadePrincipalNome: "Unidade Centro",
      adminNome: "Administrador",
      adminEmail: "admin@academia.com",
      telefone: "1199999999999999",
    });

    expect(tooLongPhone.success).toBe(false);
    if (tooLongPhone.success) {
      return;
    }

    expect(buildZodFieldErrors(tooLongPhone.error).telefone).toContain("Informe um telefone válido.");
  });

  it("aceita dados válidos e aplica trim nos campos de texto", () => {
    const result = adminOnboardingProvisionFormSchema.safeParse({
      academiaNome: " Academia Central ",
      cnpj: "46.208.771/0001-70",
      unidadePrincipalNome: " Unidade Centro ",
      adminNome: " Maria Admin ",
      adminEmail: " maria@academia.com ",
      telefone: " (11) 99876-5432 ",
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.data).toEqual({
      academiaNome: "Academia Central",
      cnpj: "46.208.771/0001-70",
      unidadePrincipalNome: "Unidade Centro",
      adminNome: "Maria Admin",
      adminEmail: "maria@academia.com",
      telefone: "(11) 99876-5432",
    });
  });

  it("normaliza telefone e payload de provisionamento", () => {
    expect(normalizeProvisionPhone(" (11) 99876-5432 ")).toBe("11998765432");

    const payload = buildAdminOnboardingProvisionPayload({
      academiaNome: " Academia Central ",
      cnpj: "46.208.771/0001-70",
      unidadePrincipalNome: " Unidade Centro ",
      adminNome: " Maria Admin ",
      adminEmail: " maria@academia.com ",
      telefone: " (11) 99876-5432 ",
    });

    expect(payload).toEqual({
      nomeAcademia: "Academia Central",
      cnpj: "46208771000170",
      nomeUnidadePrincipal: "Unidade Centro",
      nomeAdministrador: "Maria Admin",
      emailAdministrador: "maria@academia.com",
      telefone: "11998765432",
    });
  });
});
