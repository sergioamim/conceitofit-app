import { describe, expect, test, beforeEach, afterEach } from "vitest";
import {
  buildPublicContractPreview,
  buildPublicJourneyHref,
  getPublicJourneyContext,
  getPublicPlanQuote,
  requestPublicCheckoutContractOtp,
  resolvePublicPlanInstallmentLimit,
  resolvePublicNextAction,
  signPublicCheckoutContract,
  startPublicCheckout,
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
            permiteVendaOnline: true,
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
          {
            id: "fp-debito",
            tenantId: "tn-mananciais-s1",
            nome: "Cartão de débito",
            tipo: "CARTAO_DEBITO",
            parcelasMax: 1,
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

function installPublicCheckoutFetchMock() {
  const previousFetch = global.fetch;
  const calls: string[] = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input), "http://localhost");
    const path = url.pathname.startsWith("/backend/") ? url.pathname.slice("/backend".length) : url.pathname;
    calls.push(`${init?.method ?? "GET"} ${path}`);

    if (path === "/api/v1/unidades") {
      return new Response(
        JSON.stringify([
          {
            id: "tn-mananciais-s1",
            academiaId: "acd-mananciais",
            nome: "MANANCIAIS - S1",
            subdomain: "mananciais-s1",
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
            cobraAnuidade: false,
            parcelasMaxAnuidade: 1,
            permiteRenovacaoAutomatica: true,
            permiteCobrancaRecorrente: true,
            permiteVendaOnline: true,
            contratoAssinatura: "AMBAS",
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
            ativo: true,
          },
          {
            id: "fp-credito",
            tenantId: "tn-mananciais-s1",
            nome: "Cartão de crédito",
            tipo: "CARTAO_CREDITO",
            parcelasMax: 6,
            ativo: true,
          },
          {
            id: "fp-boleto",
            tenantId: "tn-mananciais-s1",
            nome: "Boleto",
            tipo: "BOLETO",
            ativo: true,
          },
        ]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/publico/adesao/cadastros") {
      return new Response(
        JSON.stringify({
          id: "chk-001",
          tokenPublico: "token-publico-001",
          tenantId: "tn-mananciais-s1",
          academiaId: "acd-mananciais",
          planoId: null,
          origem: "CADASTRO_PUBLICO",
          status: "CADASTRO_RECEBIDO",
          candidatoNome: "Mariana Costa",
          candidatoEmail: "mariana@email.com",
          candidatoTelefone: "11999999999",
          candidatoCpf: "12345678900",
          trialDias: null,
          mensagemStatus: null,
          alunoId: "aln-001",
          contratoId: null,
          contratoStatus: null,
          pagamentoId: null,
          pagamentoStatus: null,
          pendencias: [],
          createdAt: "2026-04-26T12:00:00",
          updatedAt: "2026-04-26T12:00:00",
        }),
        { status: 201, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/publico/adesao/chk-001/checkout") {
      return new Response(
        JSON.stringify({
          id: "chk-001",
          tokenPublico: null,
          tenantId: "tn-mananciais-s1",
          academiaId: "acd-mananciais",
          planoId: "pln-s1-001",
          origem: "CADASTRO_PUBLICO",
          status: "AGUARDANDO_CONTRATO",
          candidatoNome: "Mariana Costa",
          candidatoEmail: "mariana@email.com",
          candidatoTelefone: "11999999999",
          candidatoCpf: "12345678900",
          trialDias: null,
          mensagemStatus: "Checkout iniciado",
          alunoId: "aln-001",
          contratoId: "ctr-001",
          contratoStatus: "PENDENTE",
          pagamentoId: "pay-001",
          pagamentoStatus: "CRIADO",
          pendencias: [],
          createdAt: "2026-04-26T12:00:00",
          updatedAt: "2026-04-26T12:05:00",
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/publico/adesao/chk-001/contrato/otp") {
      return new Response(
        JSON.stringify({
          enviadoEm: "2026-04-26T12:06:00",
          otpValidoAte: "2026-04-26T12:16:00",
        }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    if (path === "/api/v1/publico/adesao/chk-001/contrato/assinaturas") {
      const body = init?.body ? JSON.parse(String(init.body)) : {};
      return new Response(
        JSON.stringify({
          id: "chk-001",
          tokenPublico: null,
          tenantId: "tn-mananciais-s1",
          academiaId: "acd-mananciais",
          planoId: "pln-s1-001",
          origem: "CADASTRO_PUBLICO",
          status: "AGUARDANDO_PAGAMENTO",
          candidatoNome: "Mariana Costa",
          candidatoEmail: "mariana@email.com",
          candidatoTelefone: "11999999999",
          candidatoCpf: "12345678900",
          trialDias: null,
          mensagemStatus: `Assinado com ${body.otp}`,
          alunoId: "aln-001",
          contratoId: "ctr-001",
          contratoStatus: "ASSINADO",
          pagamentoId: "pay-001",
          pagamentoStatus: "CRIADO",
          pendencias: [],
          createdAt: "2026-04-26T12:00:00",
          updatedAt: "2026-04-26T12:07:00",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    throw new Error(`Unexpected fetch ${init?.method ?? "GET"} ${url.pathname}${url.search}`);
  }) as typeof global.fetch;

  return {
    calls,
    restore() {
      global.fetch = previousFetch;
    },
  };
}

describe("public journey helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = "";
    process.env.NEXT_PUBLIC_DEV_AUTO_LOGIN = "false";
  });

  afterEach(() => {
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

  test("getPublicJourneyContext expõe apenas PIX e crédito no checkout online", async () => {
    const { restore } = installPublicJourneyFetchMock();
    try {
      const context = await getPublicJourneyContext("mananciais-s1");
      expect(context.formasPagamento).toEqual(["PIX", "CARTAO_CREDITO"]);
      expect(context.cartaoCreditoParcelasMax).toBe(6);
    } finally {
      restore();
    }
  });

  test("resolvePublicPlanInstallmentLimit força 1x para mensal e recorrente", async () => {
    expect(
      resolvePublicPlanInstallmentLimit({
        id: "plano-mensal",
        tenantId: "tenant-1",
        nome: "Mensal",
        tipo: "MENSAL",
        duracaoDias: 30,
        valor: 100,
        valorMatricula: 0,
        cobraAnuidade: false,
        permiteRenovacaoAutomatica: false,
        permiteCobrancaRecorrente: false,
        contratoAssinatura: "AMBAS",
        contratoEnviarAutomaticoEmail: false,
        destaque: false,
        permiteVendaOnline: true,
        ativo: true,
      }, 12)
    ).toBe(1);

    expect(
      resolvePublicPlanInstallmentLimit({
        id: "plano-recorrente",
        tenantId: "tenant-1",
        nome: "Recorrente",
        tipo: "ANUAL",
        duracaoDias: 365,
        valor: 1200,
        valorMatricula: 0,
        cobraAnuidade: false,
        permiteRenovacaoAutomatica: true,
        permiteCobrancaRecorrente: true,
        contratoAssinatura: "AMBAS",
        contratoEnviarAutomaticoEmail: false,
        destaque: false,
        permiteVendaOnline: true,
        ativo: true,
      }, 12)
    ).toBe(1);
  });

  test("startPublicCheckout preserva token público e deixa a assinatura para pendências", async () => {
    const { restore, calls } = installPublicCheckoutFetchMock();
    try {
      const checkout = await startPublicCheckout({
        tenantRef: "mananciais-s1",
        planId: "pln-s1-001",
        signup: {
          nome: "Mariana Costa",
          email: "mariana@email.com",
          telefone: "11999999999",
          cpf: "12345678900",
          dataNascimento: "1993-02-10",
          sexo: "F",
        },
        pagamento: {
          formaPagamento: "PIX",
        },
        aceitarTermos: true,
      });

      expect(checkout.checkoutId).toBe("chk-001");
      expect(checkout.adesaoToken).toBe("token-publico-001");
      expect(checkout.formaPagamento).toBe("PIX");
      expect(calls).not.toContain("POST /api/v1/publico/adesao/chk-001/contrato/otp");
      expect(calls).not.toContain("POST /api/v1/publico/adesao/chk-001/contrato/assinaturas");
    } finally {
      restore();
    }
  });

  test("signPublicCheckoutContract usa o OTP informado pelo usuário", async () => {
    const { restore, calls } = installPublicCheckoutFetchMock();
    try {
      const otp = await requestPublicCheckoutContractOtp({
        checkoutId: "chk-001",
        adesaoToken: "token-publico-001",
        destino: "mariana@email.com",
      });
      expect(otp.otpValidoAte).toBe("2026-04-26T12:16:00");

      const signed = await signPublicCheckoutContract({
        tenantRef: "mananciais-s1",
        checkoutId: "chk-001",
        adesaoToken: "token-publico-001",
        otp: "654321",
      });

      expect(signed.contratoStatus).toBe("ASSINADO");
      expect(signed.adesaoToken).toBe("token-publico-001");
      expect(signed.observacoes).toContain("654321");
      expect(calls).toContain("POST /api/v1/publico/adesao/chk-001/contrato/assinaturas");
    } finally {
      restore();
    }
  });
});
