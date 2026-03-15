import { expect, test } from "@playwright/test";
import {
  buildPublicContractPreview,
  buildPublicJourneyHref,
  getPublicJourneyContext,
  getPublicPlanQuote,
  resolvePublicNextAction,
  validateSignupDraft,
} from "../../src/lib/public/services";

const envSnapshot = {
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  devAutoLogin: process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN,
};

function installPublicJourneyFetchMock() {
  const previousFetch = global.fetch;

  global.fetch = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.startsWith("/backend/") ? url.pathname.slice("/backend".length) : url.pathname;

    if (path === "/api/v1/unidades") {
      return new Response(
        JSON.stringify([
          {
            id: "tn-mananciais-s1",
            academiaId: "acd-mananciais",
            nome: "MANANCIAIS - S1",
            subdomain: "mananciais-s1",
            ativo: true,
            branding: {
              appName: "Fit Mananciais",
              themePreset: "AZUL_OCEANO",
              useCustomColors: false,
            },
          },
          {
            id: "tn-pechincha-s3",
            academiaId: "acd-pechincha",
            nome: "PECHINCHA - S3",
            subdomain: "pechincha-s3",
            ativo: true,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/context/unidade-ativa") {
      return new Response(
        JSON.stringify({
          currentTenantId: "tn-mananciais-s1",
          tenantAtual: {
            id: "tn-mananciais-s1",
            academiaId: "acd-mananciais",
            nome: "MANANCIAIS - S1",
            subdomain: "mananciais-s1",
            ativo: true,
          },
          unidadesDisponiveis: [
            {
              id: "tn-mananciais-s1",
              academiaId: "acd-mananciais",
              nome: "MANANCIAIS - S1",
              subdomain: "mananciais-s1",
              ativo: true,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/academia") {
      return new Response(
        JSON.stringify({
          id: "acd-mananciais",
          nome: "Academia Mananciais",
          razaoSocial: "Academia Mananciais LTDA",
          documento: "11.222.333/0001-44",
          branding: {
            appName: "Fit Mananciais",
            themePreset: "AZUL_OCEANO",
            useCustomColors: false,
          },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/comercial/planos") {
      return new Response(
        JSON.stringify([
          {
            id: "pln-s1-001",
            tenantId: "tn-mananciais-s1",
            nome: "Contrato Mensal S1",
            tipo: "MENSAL",
            duracaoDias: 30,
            valor: 199.9,
            valorMatricula: 90,
            cobraAnuidade: true,
            valorAnuidade: 30,
            parcelasMaxAnuidade: 1,
            permiteRenovacaoAutomatica: true,
            permiteCobrancaRecorrente: true,
            contratoAssinatura: "AMBAS",
            contratoTemplateHtml:
              "<p>{{NOME_PLANO}}</p><p>{{NOME_CLIENTE}}</p><p>{{CPF_CLIENTE}}</p><p>{{NOME_UNIDADE}}</p>",
            ativo: true,
            destaque: true,
            ordem: 1,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/gerencial/financeiro/formas-pagamento") {
      return new Response(
        JSON.stringify([
          {
            id: "fp-pix",
            tenantId: "tn-mananciais-s1",
            nome: "PIX",
            tipo: "PIX",
            parcelasMax: 1,
            emitirAutomaticamente: false,
            ativo: true,
          },
          {
            id: "fp-credito",
            tenantId: "tn-mananciais-s1",
            nome: "Cartão de crédito",
            tipo: "CARTAO_CREDITO",
            parcelasMax: 6,
            emitirAutomaticamente: false,
            ativo: true,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unexpected fetch ${url.pathname}${url.search}`);
  }) as typeof global.fetch;

  return {
    restore() {
      global.fetch = previousFetch;
    },
  };
}

test.describe("public journey helpers", () => {
  test.beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  });

  test.afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = envSnapshot.apiBaseUrl;
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = envSnapshot.devAutoLogin;
  });

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

  test("getPublicPlanQuote soma plano, matrícula e anuidade via contratos reais", async () => {
    const { restore } = installPublicJourneyFetchMock();
    try {
      const context = await getPublicJourneyContext("mananciais-s1");
      const plan = context.planos.find((item) => item.id === "pln-s1-001");
      expect(plan).not.toBeNull();
      const quote = getPublicPlanQuote(plan!);
      expect(quote.total).toBeCloseTo(319.9, 2);
      expect(quote.items).toHaveLength(3);
    } finally {
      restore();
    }
  });

  test("buildPublicContractPreview hidrata placeholders do tenant e do cliente", async () => {
    const { restore } = installPublicJourneyFetchMock();
    try {
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
    } finally {
      restore();
    }
  });
});
