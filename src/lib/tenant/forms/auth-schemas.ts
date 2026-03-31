import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

export const networkLoginFormSchema = z.object({
  identifier: requiredTrimmedString("Informe seu identificador."),
  password: requiredTrimmedString("Informe sua senha."),
});

export const networkCredentialFormSchema = z.object({
  identifier: requiredTrimmedString("Informe seu identificador."),
});

export const tenantStepFormSchema = z.object({
  tenantId: requiredTrimmedString("Selecione a unidade ativa para continuar."),
});

export const legacyLoginFormSchema = z.object({
  username: requiredTrimmedString("Informe o usuário."),
  password: requiredTrimmedString("Informe a senha."),
});

export const legacyTenantStepFormSchema = z.object({
  tenantId: requiredTrimmedString("Selecione a unidade prioritária."),
});

export const forcedPasswordChangeFormSchema = z
  .object({
    newPassword: requiredTrimmedString("Informe a nova senha.")
      .min(8, "A nova senha deve ter pelo menos 8 caracteres.")
      .regex(/[A-Za-z]/, "A nova senha deve conter pelo menos uma letra.")
      .regex(/\d/, "A nova senha deve conter pelo menos um número."),
    confirmNewPassword: requiredTrimmedString("Confirme a nova senha."),
  })
  .refine((values) => values.newPassword === values.confirmNewPassword, {
    message: "A confirmação da senha deve ser idêntica à nova senha.",
    path: ["confirmNewPassword"],
  });
