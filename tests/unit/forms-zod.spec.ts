import { expect, test } from "@playwright/test";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import {
  publicCheckoutFormSchema,
  publicSignupFormSchema,
} from "../../src/lib/forms/public-journey-schemas";

test.describe("zod resolver forms", () => {
  test("integra schema válido ao contrato do react-hook-form", async () => {
    const resolver = zodResolver(publicSignupFormSchema);
    const result = await resolver(
      {
        nome: "Mariana Costa",
        email: "mariana@email.com",
        telefone: "(21) 99999-9999",
        cpf: "123.456.789-00",
        dataNascimento: "1993-02-10",
        sexo: "F",
        cidade: "Rio de Janeiro",
        objetivo: "Condicionamento",
        planId: "plano-1",
      },
      {},
      {} as never
    );

    expect(result.errors).toEqual({});
    expect(result.values.planId).toBe("plano-1");
  });

  test("propaga mensagens do schema quando o valor é inválido", async () => {
    const resolver = zodResolver(publicCheckoutFormSchema);
    await expect(async () => resolver(
      {
        planId: "",
        formaPagamento: "CARTAO_CREDITO",
        parcelas: "0",
        observacoes: "",
        renovacaoAutomatica: false,
        aceitarContratoAgora: true,
        aceitarTermos: false,
      },
      {},
      {} as never
    )).rejects.toMatchObject<Partial<ZodError>>({
      issues: expect.arrayContaining([
        expect.objectContaining({
          path: ["planId"],
          message: "Selecione um plano para concluir a adesão.",
        }),
        expect.objectContaining({
          path: ["parcelas"],
          message: "Informe ao menos uma parcela.",
        }),
        expect.objectContaining({
          path: ["aceitarTermos"],
          message: "Aceite os termos da adesão para continuar.",
        }),
      ]),
    });
  });
});
