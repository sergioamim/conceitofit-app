import { z } from "zod";
import type { TipoFormaPagamento } from "@/lib/types";

const FORMAS_PAGAMENTO: [TipoFormaPagamento, ...TipoFormaPagamento[]] = [
  "DINHEIRO",
  "PIX",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "BOLETO",
  "RECORRENTE",
];

export const pagarContaSchema = z.object({
  dataPagamento: z.string().min(1, "Informe a data de pagamento."),
  formaPagamento: z.enum(FORMAS_PAGAMENTO, {
    errorMap: () => ({ message: "Selecione a forma de pagamento." }),
  }),
  valorPago: z.string().optional().default(""),
  observacoes: z.string().trim().optional().default(""),
});

export type PagarContaFormValues = z.infer<typeof pagarContaSchema>;
