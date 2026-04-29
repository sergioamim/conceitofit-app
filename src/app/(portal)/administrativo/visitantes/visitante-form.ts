import { z } from "zod";

function defaultValidoAte(): string {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function hasValidOptionalPhone(value: string) {
  const digits = digitsOnly(value);
  return !digits || (digits.length >= 10 && digits.length <= 15);
}

function hasFutureDateTime(value: string) {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.getTime() > Date.now();
}

export const visitanteFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do visitante.").max(120, "Nome muito longo."),
  documento: z.string().trim().max(30, "Documento muito longo.").optional(),
  telefone: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").or(z.literal("")).optional(),
  tipo: z.enum(["DAY_USE", "AULA_EXPERIMENTAL", "CONVIDADO"]),
  validoAte: z.string().min(1, "Informe a data/hora de validade."),
  maxEntradas: z.coerce.number().int().positive("Informe uma quantidade válida.").max(10, "Máximo de 10 entradas.").optional(),
  valorCobrado: z.coerce.number().nonnegative("Informe um valor maior ou igual a zero.").optional(),
  observacoes: z.string().trim().max(500, "Observações muito longas.").optional(),
}).superRefine((values, ctx) => {
  if (!hasValidOptionalPhone(values.telefone ?? "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["telefone"],
      message: "Informe um telefone com 10 a 15 dígitos.",
    });
  }

  if (!hasFutureDateTime(values.validoAte)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["validoAte"],
      message: "Informe uma data/hora futura para a validade.",
    });
  }
});

export type RegistrarVisitanteFormValues = z.infer<typeof visitanteFormSchema>;

export function createVisitanteFormDefaults(): RegistrarVisitanteFormValues {
  return {
    nome: "",
    documento: "",
    telefone: "",
    email: "",
    tipo: "DAY_USE",
    validoAte: defaultValidoAte(),
    maxEntradas: 1,
    valorCobrado: undefined,
    observacoes: "",
  };
}
