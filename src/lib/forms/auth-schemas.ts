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
