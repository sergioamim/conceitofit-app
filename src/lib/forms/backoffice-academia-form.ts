import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

const optionalFormString = z.string().trim().default("");

const optionalEmailString = z
  .string()
  .trim()
  .default("")
  .refine((value) => value.length === 0 || z.string().email().safeParse(value).success, {
    message: "Informe um e-mail válido.",
  });

export const backofficeAcademiaCreateSchema = z.object({
  nome: requiredTrimmedString("Informe o nome da academia."),
  documento: optionalFormString,
});

export const backofficeAcademiaDetailSchema = z.object({
  nome: requiredTrimmedString("Informe o nome da academia."),
  razaoSocial: optionalFormString,
  documento: optionalFormString,
  email: optionalEmailString,
  telefone: optionalFormString,
  ativo: z.enum(["ATIVA", "INATIVA"]),
});

export type BackofficeAcademiaCreateForm = z.infer<typeof backofficeAcademiaCreateSchema>;
export type BackofficeAcademiaDetailForm = z.infer<typeof backofficeAcademiaDetailSchema>;

export function buildBackofficeAcademiaCreateDefaults(): BackofficeAcademiaCreateForm {
  return {
    nome: "",
    documento: "",
  };
}

export function buildBackofficeAcademiaDetailDefaults(): BackofficeAcademiaDetailForm {
  return {
    nome: "",
    razaoSocial: "",
    documento: "",
    email: "",
    telefone: "",
    ativo: "ATIVA",
  };
}
