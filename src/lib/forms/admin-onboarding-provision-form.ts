import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import { isValidCnpj, normalizeCnpjDigits } from "@/lib/utils/cnpj";

function hasValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export const adminOnboardingProvisionFormSchema = z.object({
  academiaNome: requiredTrimmedString("Informe o nome da academia.").min(3, "Informe o nome da academia."),
  cnpj: requiredTrimmedString("Informe um CNPJ válido.").refine(isValidCnpj, "Informe um CNPJ válido."),
  unidadePrincipalNome: requiredTrimmedString("Informe o nome da unidade principal.").min(3, "Informe o nome da unidade principal."),
  adminNome: requiredTrimmedString("Informe o nome do administrador.").min(3, "Informe o nome do administrador."),
  adminEmail: requiredTrimmedString("Informe um e-mail válido.").email("Informe um e-mail válido."),
  telefone: requiredTrimmedString("Informe um telefone válido.").refine(hasValidPhone, "Informe um telefone válido."),
});

export type AdminOnboardingProvisionFormValues = z.infer<typeof adminOnboardingProvisionFormSchema>;

export function normalizeProvisionPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function buildAdminOnboardingProvisionPayload(values: AdminOnboardingProvisionFormValues) {
  return {
    nomeAcademia: values.academiaNome.trim(),
    cnpj: normalizeCnpjDigits(values.cnpj),
    nomeUnidadePrincipal: values.unidadePrincipalNome.trim(),
    nomeAdministrador: values.adminNome.trim(),
    emailAdministrador: values.adminEmail.trim(),
    telefone: normalizeProvisionPhone(values.telefone),
  };
}
