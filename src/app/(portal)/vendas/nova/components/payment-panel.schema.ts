import { z } from "zod";

/**
 * Schema do formulário do PaymentPanel (VUN-3.2).
 *
 * Regras:
 * - formaPagamento: restrito aos cinco métodos suportados pelo painel (PRD §8.1).
 * - parcelas: 1–12, obrigatório apenas quando relevante.
 * - autorizacao (NSU / RN-005): obrigatório com ≥4 dígitos numéricos APENAS para
 *   CARTAO_CREDITO e CARTAO_DEBITO. Para PIX/DINHEIRO/RECORRENTE, ausência é OK.
 *
 * Observação: mantemos os valores canônicos do projeto (`CARTAO_CREDITO`,
 * `CARTAO_DEBITO`) ao invés de `CREDITO`/`DEBITO` citados na story, para
 * compatibilidade direta com `TipoFormaPagamento` em `src/lib/shared/types/pagamento.ts`.
 */
export const PAYMENT_PANEL_METODOS = [
  "DINHEIRO",
  "CARTAO_CREDITO",
  "CARTAO_DEBITO",
  "PIX",
  "RECORRENTE",
] as const;

export type PaymentPanelMetodo = (typeof PAYMENT_PANEL_METODOS)[number];

export const NSU_REGEX = /^\d{4,}$/;

export const paymentPanelSchema = z
  .object({
    formaPagamento: z.enum(PAYMENT_PANEL_METODOS),
    parcelas: z
      .number()
      .int("Parcelas deve ser inteiro")
      .min(1, "Mínimo 1 parcela")
      .max(12, "Máximo 12 parcelas"),
    autorizacao: z.string().optional().default(""),
  })
  .superRefine((data, ctx) => {
    const requiresNsu =
      data.formaPagamento === "CARTAO_CREDITO" ||
      data.formaPagamento === "CARTAO_DEBITO";

    if (requiresNsu) {
      const value = (data.autorizacao ?? "").trim();
      if (!NSU_REGEX.test(value)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["autorizacao"],
          message: "NSU obrigatório com pelo menos 4 dígitos para crédito/débito.",
        });
      }
    }

    if (data.formaPagamento !== "CARTAO_CREDITO" && data.parcelas !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["parcelas"],
        message: "Parcelamento disponível apenas para cartão de crédito.",
      });
    }
  });

export type PaymentPanelFormValues = z.infer<typeof paymentPanelSchema>;
