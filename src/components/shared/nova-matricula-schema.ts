import { z } from "zod";

export const novaMatriculaSchema = z.object({
  alunoId: z.string().min(1, "Selecione o cliente."),
  planoId: z.string().min(1, "Selecione o plano."),
  dataInicio: z.string().min(1, "Informe a data de início."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"]),
  desconto: z.string().default("0"),
  motivoDesconto: z.string().trim().optional().default(""),
  renovacao: z.boolean().default(false),
  convenioId: z.string().default(""),
  parcelasAnuidade: z.string().default("1"),
  pagamentoPendente: z.boolean().default(false),
});

export type NovaMatriculaFormValues = z.infer<typeof novaMatriculaSchema>;
