import { expect, test } from "@playwright/test";
import {
  buildPublicContractPreview,
  buildPublicJourneyHref,
  getPublicJourneyContext,
  getPublicPlanQuote,
  resolvePublicNextAction,
  validateSignupDraft,
} from "../../src/lib/public/services";

test.describe("public journey helpers", () => {
  test("buildPublicJourneyHref preserva tenant, plano e checkout", async () => {
    expect(
      buildPublicJourneyHref("/adesao/pendencias", {
        tenantRef: "mananciais-s1",
        planId: "pln-s1-001",
        checkoutId: "ck-001",
      })
    ).toBe("/adesao/pendencias?tenant=mananciais-s1&plan=pln-s1-001&checkout=ck-001");
  });

  test("validateSignupDraft exige campos mínimos do cadastro", async () => {
    expect(
      validateSignupDraft({
        nome: "A",
        email: "email-invalido",
        telefone: "123",
        cpf: "123",
        dataNascimento: "",
        sexo: "F",
      })
    ).toEqual({
      nome: "Informe o nome completo.",
      email: "Informe um e-mail válido.",
      telefone: "Informe um telefone válido.",
      cpf: "CPF deve conter 11 dígitos.",
      dataNascimento: "Informe a data de nascimento.",
    });
  });

  test("resolvePublicNextAction prioriza pagamento e assinatura", async () => {
    expect(resolvePublicNextAction({ pagamentoStatus: "PENDENTE", contratoStatus: "ASSINADO" })).toBe("PAGAR");
    expect(resolvePublicNextAction({ pagamentoStatus: "PAGO", contratoStatus: "PENDENTE_ASSINATURA" })).toBe("ASSINAR_CONTRATO");
    expect(resolvePublicNextAction({ pagamentoStatus: "PAGO", contratoStatus: "ASSINADO" })).toBe("CONCLUIDO");
  });

  test("getPublicPlanQuote soma plano, matrícula e anuidade", async () => {
    const context = await getPublicJourneyContext("mananciais-s1");
    const plan = context.planos.find((item) => item.id === "pln-s1-001");
    expect(plan).not.toBeNull();
    const quote = getPublicPlanQuote(plan!);
    expect(quote.total).toBeCloseTo(319.9, 2);
    expect(quote.items).toHaveLength(3);
  });

  test("buildPublicContractPreview hidrata placeholders do tenant e do cliente", async () => {
    const context = await getPublicJourneyContext("mananciais-s1");
    const plan = context.planos.find((item) => item.id === "pln-s1-001");
    expect(plan).not.toBeNull();
    const preview = buildPublicContractPreview({
      plano: plan!,
      signup: {
        nome: "Mariana Costa",
        email: "mariana@email.com",
        telefone: "(11) 99999-9999",
        cpf: "123.456.789-00",
        dataNascimento: "1993-02-10",
        sexo: "F",
      },
      tenant: context.tenant,
      academia: context.academia,
    });

    expect(preview).toContain("Contrato Mensal S1");
    expect(preview).toContain("Mariana Costa");
    expect(preview).toContain("12345678900");
    expect(preview).toContain("MANANCIAIS - S1");
  });
});
