import { z } from "zod";
import type { PublicSignupDraft, PublicTrialInput } from "@/lib/public/services";
import { buildZodFieldErrors, optionalTrimmedString, requiredTrimmedString } from "@/lib/forms/zod-helpers";

function hasValidEmail(value: string) {
  return value.includes("@");
}

function hasValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

function hasValidCpf(value: string) {
  return value.replace(/\D/g, "").length === 11;
}

const signupBaseSchema = z.object({
  nome: requiredTrimmedString("Informe o nome completo.").min(3, "Informe o nome completo."),
  email: requiredTrimmedString("Informe um e-mail válido.").refine(hasValidEmail, "Informe um e-mail válido."),
  telefone: requiredTrimmedString("Informe um telefone válido.").refine(hasValidPhone, "Informe um telefone válido."),
  cpf: requiredTrimmedString("CPF deve conter 11 dígitos.").refine(hasValidCpf, "CPF deve conter 11 dígitos."),
  dataNascimento: requiredTrimmedString("Informe a data de nascimento."),
  sexo: z.enum(["M", "F", "OUTRO", "NAO_INFORMADO"]).catch("F"),
  cidade: optionalTrimmedString().default(""),
  objetivo: optionalTrimmedString().default(""),
});

export const publicTrialFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome completo.").min(3, "Informe o nome completo."),
  email: requiredTrimmedString("Informe um e-mail válido.").refine(hasValidEmail, "Informe um e-mail válido."),
  telefone: requiredTrimmedString("Informe um telefone válido.").refine(hasValidPhone, "Informe um telefone válido."),
  objetivo: optionalTrimmedString().default(""),
});

export const publicSignupSchema = signupBaseSchema;

export const publicSignupFormSchema = signupBaseSchema.extend({
  planId: requiredTrimmedString("Selecione um plano para continuar."),
});

export const publicCheckoutFormSchema = z.object({
  planId: requiredTrimmedString("Selecione um plano para concluir a adesão."),
  formaPagamento: requiredTrimmedString("Selecione a forma de pagamento."),
  parcelas: z.string().default("1"),
  aceitarTermos: z.boolean(),
}).superRefine((values, ctx) => {
  if (!values.aceitarTermos) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["aceitarTermos"],
      message: "Aceite os termos da adesão para continuar.",
    });
  }

  if (values.formaPagamento === "CARTAO_CREDITO") {
    const parcelas = Number.parseInt(values.parcelas, 10);
    if (!Number.isFinite(parcelas) || parcelas < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parcelas"],
        message: "Informe ao menos uma parcela.",
      });
    }
  }
});

export function validateTrialInputWithSchema(input: PublicTrialInput): Record<string, string> {
  const result = publicTrialFormSchema.safeParse(input);
  return result.success ? {} : buildZodFieldErrors(result.error);
}

export function validateSignupDraftWithSchema(input: PublicSignupDraft): Record<string, string> {
  const result = publicSignupSchema.safeParse(input);
  return result.success ? {} : buildZodFieldErrors(result.error);
}
