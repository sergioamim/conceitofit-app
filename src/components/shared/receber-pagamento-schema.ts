import { z } from "zod";

export const receberPagamentoSchema = z.object({
  dataPagamento: z.string().min(1, "Informe a data do pagamento."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"]),
  codigoTransacao: z.string().trim().optional().default(""),
  observacoes: z.string().trim().optional().default(""),
}).superRefine((values, ctx) => {
  if (values.formaPagamento === "CARTAO_CREDITO" && !values.codigoTransacao?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["codigoTransacao"],
      message: "Informe o código da transação do cupom da maquininha.",
    });
  }
});

export type ReceberPagamentoFormValues = z.infer<typeof receberPagamentoSchema>;
