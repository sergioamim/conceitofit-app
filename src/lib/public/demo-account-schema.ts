import { z } from "zod";

export const demoAccountFormSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  email: z.string().trim().email("Informe um e-mail valido."),
  senha: z
    .string()
    .min(6, "A senha deve ter no minimo 6 caracteres.")
    .max(64, "Senha muito longa."),
});

export type DemoAccountFormValues = z.infer<typeof demoAccountFormSchema>;
