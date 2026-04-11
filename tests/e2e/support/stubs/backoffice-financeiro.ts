import type { Page, Request } from "@playwright/test";
import { installBackofficeGlobalSession } from "../backoffice-global-session";
import { fulfillJson } from "../protected-shell-mocks";

type AcademiaSeed = {
  id: string;
  nome: string;
  ativo: boolean;
  documento?: string;
};

type PlanoSeed = {
  id: string;
  nome: string;
  descricao?: string;
  precoMensal: number;
  precoAnual?: number;
  ciclo: "MENSAL" | "ANUAL";
  maxUnidades?: number;
  maxAlunos?: number;
  featuresIncluidas: string[];
  ativo: boolean;
};

type ContratoSeed = {
  id: string;
  academiaId: string;
  academiaNome: string;
  planoId: string;
  planoNome: string;
  dataInicio: string;
  dataFim?: string;
  ciclo: "MENSAL" | "ANUAL";
  valorMensal: number;
  status: "ATIVO" | "TRIAL" | "SUSPENSO" | "CANCELADO";
  motivoSuspensao?: string;
  historicoPlanosIds: string[];
};

type CobrancaSeed = {
  id: string;
  contratoId: string;
  academiaId: string;
  academiaNome: string;
  valor: number;
  dataVencimento: string;
  dataPagamento?: string;
  status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
  formaPagamento?: "BOLETO" | "PIX" | "DINHEIRO" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "RECORRENTE";
  multa?: number;
  juros?: number;
  observacoes?: string;
};

type GatewaySeed = {
  id: string;
  nome: string;
  provedor: "PAGARME" | "STRIPE" | "MERCADO_PAGO" | "CIELO_ECOMMERCE" | "ASAAS" | "OUTRO";
  chaveApi: string;
  ambiente: "SANDBOX" | "PRODUCAO";
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
};

type SaasMetricsSeed = {
  geradoEm: string;
  totalAcademias: number;
  academiasAtivas: number;
  academiasDemo: number;
  totalTenants: number;
  tenantsAtivos: number;
  totalAlunosAtivos: number;
  academiasNovas30d: number;
  leadsB2bNovos30d: number;
  leadsB2bConvertidos: number;
  mrr: number;
  churnRate: number;
  ticketMedio: number;
};

type SaasSeriesSeed = {
  metrica: string;
  periodo: string;
  pontos: Array<{ data: string; valor: number }>;
};

type SaasOnboardingSeed = {
  academias: Array<{
    academiaId: string;
    nome: string;
    subdominio: string;
    demo: boolean;
    ativa: boolean;
    dataOnboarding: string;
    dataCriacao: string;
    totalAlunos: number;
    totalTenants: number;
  }>;
  total: number;
};

export type BackofficeFinanceiroState = {
  academias: AcademiaSeed[];
  planos: PlanoSeed[];
  contratos: ContratoSeed[];
  cobrancas: CobrancaSeed[];
  gateways: GatewaySeed[];
  saasMetrics: SaasMetricsSeed;
  saasSeries: SaasSeriesSeed;
  saasOnboarding: SaasOnboardingSeed;
};

export const BACKOFFICE_FINANCEIRO_TODAY = "2026-04-11";

export const BACKOFFICE_FINANCEIRO_BASE_STATE: BackofficeFinanceiroState = {
  academias: [
    {
      id: "academia-rede-norte",
      nome: "Rede Norte Fitness",
      ativo: true,
      documento: "12.345.678/0001-10",
    },
    {
      id: "academia-rede-sul",
      nome: "Rede Sul Performance",
      ativo: true,
      documento: "98.765.432/0001-10",
    },
    {
      id: "academia-demo",
      nome: "Demo Velocity",
      ativo: false,
      documento: "22.333.444/0001-55",
    },
  ],
  planos: [
    {
      id: "plano-starter",
      nome: "Starter",
      descricao: "Operacao enxuta para redes em fase inicial.",
      precoMensal: 299,
      precoAnual: 3190,
      ciclo: "MENSAL",
      maxUnidades: 2,
      maxAlunos: 400,
      featuresIncluidas: ["Portal web", "Financeiro", "Relatorios"],
      ativo: true,
    },
    {
      id: "plano-growth",
      nome: "Growth",
      descricao: "Expansao com governanca multiunidade.",
      precoMensal: 599,
      precoAnual: 6490,
      ciclo: "MENSAL",
      maxUnidades: 8,
      maxAlunos: 1500,
      featuresIncluidas: ["Portal web", "App aluno", "CRM", "BI"],
      ativo: true,
    },
    {
      id: "plano-enterprise",
      nome: "Enterprise",
      descricao: "Suite completa para grandes redes.",
      precoMensal: 1299,
      precoAnual: 13990,
      ciclo: "ANUAL",
      maxUnidades: 30,
      maxAlunos: 5000,
      featuresIncluidas: ["Portal web", "App aluno", "CRM", "BI", "SSO"],
      ativo: false,
    },
  ],
  contratos: [
    {
      id: "contrato-norte-growth",
      academiaId: "academia-rede-norte",
      academiaNome: "Rede Norte Fitness",
      planoId: "plano-growth",
      planoNome: "Growth",
      dataInicio: "2026-01-01",
      dataFim: "2026-12-31",
      ciclo: "MENSAL",
      valorMensal: 579,
      status: "ATIVO",
      historicoPlanosIds: ["plano-starter"],
    },
    {
      id: "contrato-sul-enterprise",
      academiaId: "academia-rede-sul",
      academiaNome: "Rede Sul Performance",
      planoId: "plano-enterprise",
      planoNome: "Enterprise",
      dataInicio: "2025-11-01",
      dataFim: "2026-10-31",
      ciclo: "ANUAL",
      valorMensal: 1199,
      status: "TRIAL",
      historicoPlanosIds: [],
    },
    {
      id: "contrato-demo-starter",
      academiaId: "academia-demo",
      academiaNome: "Demo Velocity",
      planoId: "plano-starter",
      planoNome: "Starter",
      dataInicio: "2026-02-01",
      dataFim: "2026-05-31",
      ciclo: "MENSAL",
      valorMensal: 249,
      status: "SUSPENSO",
      motivoSuspensao: "Pendencia de implantacao",
      historicoPlanosIds: [],
    },
  ],
  cobrancas: [
    {
      id: "cobranca-001",
      contratoId: "contrato-norte-growth",
      academiaId: "academia-rede-norte",
      academiaNome: "Rede Norte Fitness",
      valor: 579,
      dataVencimento: "2026-04-18",
      status: "PENDENTE",
      formaPagamento: "BOLETO",
      multa: 15,
      juros: 4,
    },
    {
      id: "cobranca-002",
      contratoId: "contrato-sul-enterprise",
      academiaId: "academia-rede-sul",
      academiaNome: "Rede Sul Performance",
      valor: 1199,
      dataVencimento: "2026-04-05",
      dataPagamento: "2026-04-06",
      status: "PAGO",
      formaPagamento: "PIX",
    },
    {
      id: "cobranca-003",
      contratoId: "contrato-demo-starter",
      academiaId: "academia-demo",
      academiaNome: "Demo Velocity",
      valor: 249,
      dataVencimento: "2026-03-25",
      status: "VENCIDO",
      formaPagamento: "BOLETO",
    },
  ],
  gateways: [
    {
      id: "gateway-stripe",
      nome: "Stripe Principal",
      provedor: "STRIPE",
      chaveApi: "sk_live_stripe_principal_1234",
      ambiente: "PRODUCAO",
      ativo: true,
      criadoEm: "2026-01-10T09:00:00Z",
      atualizadoEm: "2026-03-01T09:00:00Z",
    },
    {
      id: "gateway-pagarme",
      nome: "Pagar.me Backup",
      provedor: "PAGARME",
      chaveApi: "pk_test_pagarme_backup_9876",
      ambiente: "SANDBOX",
      ativo: false,
      criadoEm: "2026-02-15T09:00:00Z",
      atualizadoEm: "2026-03-02T09:00:00Z",
    },
  ],
  saasMetrics: {
    geradoEm: "2026-04-11T09:00:00Z",
    totalAcademias: 18,
    academiasAtivas: 15,
    academiasDemo: 3,
    totalTenants: 47,
    tenantsAtivos: 42,
    totalAlunosAtivos: 8610,
    academiasNovas30d: 4,
    leadsB2bNovos30d: 29,
    leadsB2bConvertidos: 9,
    mrr: 18250,
    churnRate: 2.4,
    ticketMedio: 1216.67,
  },
  saasSeries: {
    metrica: "MRR",
    periodo: "90d",
    pontos: [
      { data: "2026-01", valor: 14100 },
      { data: "2026-02", valor: 15320 },
      { data: "2026-03", valor: 16780 },
      { data: "2026-04", valor: 18250 },
    ],
  },
  saasOnboarding: {
    academias: [
      {
        academiaId: "academia-rede-norte",
        nome: "Rede Norte Fitness",
        subdominio: "rede-norte",
        demo: false,
        ativa: true,
        dataOnboarding: "2026-02-10",
        dataCriacao: "2026-01-20",
        totalAlunos: 2140,
        totalTenants: 8,
      },
      {
        academiaId: "academia-rede-sul",
        nome: "Rede Sul Performance",
        subdominio: "rede-sul",
        demo: false,
        ativa: true,
        dataOnboarding: "2026-03-05",
        dataCriacao: "2026-02-18",
        totalAlunos: 1650,
        totalTenants: 5,
      },
      {
        academiaId: "academia-demo",
        nome: "Demo Velocity",
        subdominio: "demo-velocity",
        demo: true,
        ativa: false,
        dataOnboarding: "2026-04-01",
        dataCriacao: "2026-03-28",
        totalAlunos: 120,
        totalTenants: 1,
      },
    ],
    total: 3,
  },
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

function parseBody<T = Record<string, unknown>>(request: Request): T {
  try {
    const raw = request.postData();
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.trim() || fallback : fallback;
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function optionalNum(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function bool(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function parseFeatures(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => str(item))
      .filter(Boolean);
  }

  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => str(item))
          .filter(Boolean);
      }
    } catch {
      // segue para o split simples
    }
  }

  return trimmed
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function nextId(prefix: string, items: Array<{ id: string }>) {
  return `${prefix}-${String(items.length + 1).padStart(3, "0")}`;
}

function resolveAcademia(state: BackofficeFinanceiroState, academiaId: string) {
  return state.academias.find((academia) => academia.id === academiaId);
}

function resolvePlano(state: BackofficeFinanceiroState, planoId: string) {
  return state.planos.find((plano) => plano.id === planoId);
}

function resolveContrato(state: BackofficeFinanceiroState, contratoId: string) {
  return state.contratos.find((contrato) => contrato.id === contratoId);
}

function buildState(overrides?: Partial<BackofficeFinanceiroState>): BackofficeFinanceiroState {
  const state = clone(BACKOFFICE_FINANCEIRO_BASE_STATE);

  if (!overrides) return state;

  return {
    academias: overrides.academias ? clone(overrides.academias) : state.academias,
    planos: overrides.planos ? clone(overrides.planos) : state.planos,
    contratos: overrides.contratos ? clone(overrides.contratos) : state.contratos,
    cobrancas: overrides.cobrancas ? clone(overrides.cobrancas) : state.cobrancas,
    gateways: overrides.gateways ? clone(overrides.gateways) : state.gateways,
    saasMetrics: overrides.saasMetrics ? clone(overrides.saasMetrics) : state.saasMetrics,
    saasSeries: overrides.saasSeries ? clone(overrides.saasSeries) : state.saasSeries,
    saasOnboarding: overrides.saasOnboarding ? clone(overrides.saasOnboarding) : state.saasOnboarding,
  };
}

export async function installBackofficeFinanceiroMocks(
  page: Page,
  overrides?: Partial<BackofficeFinanceiroState>,
) {
  const state = buildState(overrides);

  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await installBackofficeGlobalSession(page, {
    session: {
      activeTenantId: "tenant-centro",
      baseTenantId: "tenant-centro",
      availableTenants: [
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-barra", defaultTenant: false },
        { tenantId: "tenant-sul", defaultTenant: false },
      ],
      userId: "user-admin-global",
      userKind: "COLABORADOR",
      displayName: "Root Admin",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
      networkId: "rede-e2e",
      networkSlug: "rede-e2e",
      networkName: "Conceito Fit QA",
    },
    shell: {
      currentTenantId: "tenant-centro",
      tenants: [
        {
          id: "tenant-centro",
          academiaId: "academia-rede-norte",
          groupId: "academia-rede-norte",
          nome: "Unidade Centro",
          ativo: true,
        },
        {
          id: "tenant-barra",
          academiaId: "academia-rede-norte",
          groupId: "academia-rede-norte",
          nome: "Unidade Barra",
          ativo: true,
        },
        {
          id: "tenant-sul",
          academiaId: "academia-rede-sul",
          groupId: "academia-rede-sul",
          nome: "Unidade Sul",
          ativo: true,
        },
      ],
      user: {
        id: "user-admin-global",
        userId: "user-admin-global",
        nome: "Root Admin",
        displayName: "Root Admin",
        email: "root@qa.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: "tenant-centro",
        tenantBaseId: "tenant-centro",
        availableTenants: [
          { tenantId: "tenant-centro", defaultTenant: true },
          { tenantId: "tenant-barra", defaultTenant: false },
          { tenantId: "tenant-sul", defaultTenant: false },
        ],
        availableScopes: ["GLOBAL"],
        broadAccess: true,
        redeId: "rede-e2e",
        redeNome: "Conceito Fit QA",
        redeSlug: "conceito-fit-qa",
      },
      academia: {
        id: "academia-rede-norte",
        nome: "Conceito Fit QA",
        ativo: true,
      },
      capabilities: {
        canAccessElevatedModules: true,
        canDeleteClient: true,
      },
    },
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/refresh" && method === "POST") {
      await fulfillJson(route, {
        token: "token-e2e",
        refreshToken: "refresh-e2e",
        type: "Bearer",
      });
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await fulfillJson(route, state.academias);
      return;
    }

    if (path === "/api/v1/admin/financeiro/planos" && method === "GET") {
      await fulfillJson(route, state.planos);
      return;
    }

    if (path === "/api/v1/admin/financeiro/planos" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const plano: PlanoSeed = {
        id: nextId("plano", state.planos),
        nome: str(body.nome),
        descricao: str(body.descricao) || undefined,
        precoMensal: num(body.precoMensal),
        precoAnual: optionalNum(body.precoAnual),
        ciclo: str(body.ciclo, "MENSAL") === "ANUAL" ? "ANUAL" : "MENSAL",
        maxUnidades: optionalNum(body.maxUnidades),
        maxAlunos: optionalNum(body.maxAlunos),
        featuresIncluidas: parseFeatures(body.featuresIncluidas),
        ativo: bool(body.ativo, true),
      };
      state.planos.unshift(plano);
      await fulfillJson(route, plano, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/planos\/[^/]+$/.test(path) && method === "PUT") {
      const id = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const plano = resolvePlano(state, id);
      if (!plano) {
        await fulfillJson(route, { message: "Plano não encontrado." }, 404);
        return;
      }

      plano.nome = str(body.nome, plano.nome);
      plano.descricao = str(body.descricao) || undefined;
      plano.precoMensal = num(body.precoMensal, plano.precoMensal);
      plano.precoAnual = optionalNum(body.precoAnual);
      plano.ciclo = str(body.ciclo, plano.ciclo) === "ANUAL" ? "ANUAL" : "MENSAL";
      plano.maxUnidades = optionalNum(body.maxUnidades);
      plano.maxAlunos = optionalNum(body.maxAlunos);
      plano.featuresIncluidas = parseFeatures(body.featuresIncluidas);
      plano.ativo = bool(body.ativo, plano.ativo);
      await fulfillJson(route, plano);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/planos\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const plano = resolvePlano(state, id);
      if (!plano) {
        await fulfillJson(route, { message: "Plano não encontrado." }, 404);
        return;
      }

      plano.ativo = !plano.ativo;
      await fulfillJson(route, plano);
      return;
    }

    if (path === "/api/v1/admin/financeiro/contratos" && method === "GET") {
      await fulfillJson(route, state.contratos);
      return;
    }

    if (path === "/api/v1/admin/financeiro/contratos" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const academiaId = str(body.academiaId);
      const planoId = str(body.planoId);
      const academia = resolveAcademia(state, academiaId);
      const plano = resolvePlano(state, planoId);
      const contrato: ContratoSeed = {
        id: nextId("contrato", state.contratos),
        academiaId,
        academiaNome: academia?.nome ?? "Academia não encontrada",
        planoId,
        planoNome: plano?.nome ?? "Plano não encontrado",
        dataInicio: str(body.dataInicio),
        dataFim: str(body.dataFim) || undefined,
        ciclo: str(body.ciclo, "MENSAL") === "ANUAL" ? "ANUAL" : "MENSAL",
        valorMensal: num(body.valorMensal),
        status: ["ATIVO", "TRIAL", "SUSPENSO", "CANCELADO"].includes(str(body.status))
          ? (str(body.status) as ContratoSeed["status"])
          : "ATIVO",
        motivoSuspensao: str(body.motivoSuspensao) || undefined,
        historicoPlanosIds: Array.isArray(body.historicoPlanosIds)
          ? body.historicoPlanosIds.map((item) => str(item)).filter(Boolean)
          : [],
      };
      state.contratos.unshift(contrato);
      await fulfillJson(route, contrato, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/contratos\/[^/]+$/.test(path) && method === "PUT") {
      const id = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const contrato = resolveContrato(state, id);
      if (!contrato) {
        await fulfillJson(route, { message: "Contrato não encontrado." }, 404);
        return;
      }

      const academiaId = str(body.academiaId, contrato.academiaId);
      const planoId = str(body.planoId, contrato.planoId);
      const academia = resolveAcademia(state, academiaId);
      const plano = resolvePlano(state, planoId);

      contrato.academiaId = academiaId;
      contrato.academiaNome = academia?.nome ?? contrato.academiaNome;
      contrato.planoId = planoId;
      contrato.planoNome = plano?.nome ?? contrato.planoNome;
      contrato.dataInicio = str(body.dataInicio, contrato.dataInicio);
      contrato.dataFim = str(body.dataFim) || undefined;
      contrato.ciclo = str(body.ciclo, contrato.ciclo) === "ANUAL" ? "ANUAL" : "MENSAL";
      contrato.valorMensal = num(body.valorMensal, contrato.valorMensal);
      contrato.status = ["ATIVO", "TRIAL", "SUSPENSO", "CANCELADO"].includes(str(body.status))
        ? (str(body.status) as ContratoSeed["status"])
        : contrato.status;
      contrato.motivoSuspensao = str(body.motivoSuspensao) || undefined;
      contrato.historicoPlanosIds = Array.isArray(body.historicoPlanosIds)
        ? body.historicoPlanosIds.map((item) => str(item)).filter(Boolean)
        : contrato.historicoPlanosIds;
      await fulfillJson(route, contrato);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/contratos\/[^/]+\/suspender$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const contrato = resolveContrato(state, id);
      if (!contrato) {
        await fulfillJson(route, { message: "Contrato não encontrado." }, 404);
        return;
      }

      contrato.status = "SUSPENSO";
      contrato.motivoSuspensao = str(body.motivoSuspensao) || undefined;
      state.cobrancas = state.cobrancas.map((cobranca) => {
        if (
          cobranca.contratoId === contrato.id
          && cobranca.status === "PENDENTE"
          && cobranca.dataVencimento > BACKOFFICE_FINANCEIRO_TODAY
        ) {
          return {
            ...cobranca,
            status: "CANCELADO",
            observacoes: "Cobrança interrompida após suspensão do contrato.",
          };
        }

        return cobranca;
      });
      await fulfillJson(route, contrato);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/contratos\/[^/]+\/reativar$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const contrato = resolveContrato(state, id);
      if (!contrato) {
        await fulfillJson(route, { message: "Contrato não encontrado." }, 404);
        return;
      }

      contrato.status = "ATIVO";
      contrato.motivoSuspensao = undefined;
      await fulfillJson(route, contrato);
      return;
    }

    if (path === "/api/v1/admin/financeiro/cobrancas" && method === "GET") {
      await fulfillJson(route, state.cobrancas);
      return;
    }

    if (path === "/api/v1/admin/financeiro/cobrancas" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const contrato = resolveContrato(state, str(body.contratoId));
      const academiaId = str(body.academiaId, contrato?.academiaId ?? "");
      const academia = resolveAcademia(state, academiaId);
      const cobranca: CobrancaSeed = {
        id: nextId("cobranca", state.cobrancas),
        contratoId: str(body.contratoId),
        academiaId,
        academiaNome: academia?.nome ?? contrato?.academiaNome ?? "Academia não encontrada",
        valor: num(body.valor),
        dataVencimento: str(body.dataVencimento),
        dataPagamento: str(body.dataPagamento) || undefined,
        status: ["PENDENTE", "PAGO", "VENCIDO", "CANCELADO"].includes(str(body.status))
          ? (str(body.status) as CobrancaSeed["status"])
          : "PENDENTE",
        formaPagamento: ["BOLETO", "PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "RECORRENTE"].includes(str(body.formaPagamento))
          ? (str(body.formaPagamento) as NonNullable<CobrancaSeed["formaPagamento"]>)
          : "BOLETO",
        multa: optionalNum(body.multa),
        juros: optionalNum(body.juros),
        observacoes: str(body.observacoes) || undefined,
      };
      state.cobrancas.unshift(cobranca);
      await fulfillJson(route, cobranca, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/cobrancas\/[^/]+\/baixar$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const cobranca = state.cobrancas.find((item) => item.id === id);
      if (!cobranca) {
        await fulfillJson(route, { message: "Cobrança não encontrada." }, 404);
        return;
      }

      cobranca.status = "PAGO";
      cobranca.dataPagamento = str(body.dataPagamento) || BACKOFFICE_FINANCEIRO_TODAY;
      cobranca.formaPagamento = ["BOLETO", "PIX", "DINHEIRO", "CARTAO_CREDITO", "CARTAO_DEBITO", "RECORRENTE"].includes(str(body.formaPagamento))
        ? (str(body.formaPagamento) as NonNullable<CobrancaSeed["formaPagamento"]>)
        : (cobranca.formaPagamento ?? "BOLETO");
      cobranca.observacoes = str(body.observacoes) || undefined;
      await fulfillJson(route, cobranca);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/cobrancas\/[^/]+\/cancelar$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const cobranca = state.cobrancas.find((item) => item.id === id);
      if (!cobranca) {
        await fulfillJson(route, { message: "Cobrança não encontrada." }, 404);
        return;
      }

      cobranca.status = "CANCELADO";
      cobranca.observacoes = cobranca.observacoes ?? "Cobrança cancelada manualmente.";
      await fulfillJson(route, cobranca);
      return;
    }

    if (path === "/api/v1/admin/financeiro/gateways" && method === "GET") {
      await fulfillJson(route, state.gateways);
      return;
    }

    if (path === "/api/v1/admin/financeiro/gateways" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const gateway: GatewaySeed = {
        id: nextId("gateway", state.gateways),
        nome: str(body.nome),
        provedor: ["PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO"].includes(str(body.provedor))
          ? (str(body.provedor) as GatewaySeed["provedor"])
          : "OUTRO",
        chaveApi: str(body.chaveApi),
        ambiente: str(body.ambiente, "SANDBOX") === "PRODUCAO" ? "PRODUCAO" : "SANDBOX",
        ativo: bool(body.ativo, true),
        criadoEm: "2026-04-11T09:30:00Z",
        atualizadoEm: "2026-04-11T09:30:00Z",
      };
      state.gateways.unshift(gateway);
      await fulfillJson(route, gateway, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/gateways\/[^/]+$/.test(path) && method === "PUT") {
      const id = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const gateway = state.gateways.find((item) => item.id === id);
      if (!gateway) {
        await fulfillJson(route, { message: "Gateway não encontrado." }, 404);
        return;
      }

      gateway.nome = str(body.nome, gateway.nome);
      gateway.provedor = ["PAGARME", "STRIPE", "MERCADO_PAGO", "CIELO_ECOMMERCE", "ASAAS", "OUTRO"].includes(str(body.provedor))
        ? (str(body.provedor) as GatewaySeed["provedor"])
        : gateway.provedor;
      gateway.chaveApi = str(body.chaveApi, gateway.chaveApi);
      gateway.ambiente = str(body.ambiente, gateway.ambiente) === "PRODUCAO" ? "PRODUCAO" : "SANDBOX";
      gateway.ativo = bool(body.ativo, gateway.ativo);
      gateway.atualizadoEm = "2026-04-11T10:00:00Z";
      await fulfillJson(route, gateway);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/gateways\/[^/]+\/ativar$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const gateway = state.gateways.find((item) => item.id === id);
      if (!gateway) {
        await fulfillJson(route, { message: "Gateway não encontrado." }, 404);
        return;
      }

      gateway.ativo = true;
      gateway.atualizadoEm = "2026-04-11T10:00:00Z";
      await fulfillJson(route, gateway);
      return;
    }

    if (/^\/api\/v1\/admin\/financeiro\/gateways\/[^/]+\/desativar$/.test(path) && method === "PATCH") {
      const id = decodeURIComponent(path.split("/").at(-2) ?? "");
      const gateway = state.gateways.find((item) => item.id === id);
      if (!gateway) {
        await fulfillJson(route, { message: "Gateway não encontrado." }, 404);
        return;
      }

      gateway.ativo = false;
      gateway.atualizadoEm = "2026-04-11T10:00:00Z";
      await fulfillJson(route, gateway);
      return;
    }

    if (path === "/api/v1/admin/metrics/saas" && method === "GET") {
      await fulfillJson(route, state.saasMetrics);
      return;
    }

    if (path === "/api/v1/admin/metrics/saas/series" && method === "GET") {
      await fulfillJson(route, state.saasSeries);
      return;
    }

    if (path === "/api/v1/admin/metrics/saas/onboarding" && method === "GET") {
      await fulfillJson(route, state.saasOnboarding);
      return;
    }

    if (path === "/api/v1/admin/onboarding/provision" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const nomeAcademia = str(body.nomeAcademia);
      const nomeUnidadePrincipal = str(body.nomeUnidadePrincipal);
      const adminEmail = str(body.emailAdministrador);

      if (!nomeAcademia || !nomeUnidadePrincipal || !adminEmail) {
        await fulfillJson(
          route,
          {
            message: "Dados obrigatórios ausentes.",
            fieldErrors: {
              nomeAcademia: !nomeAcademia ? "Informe o nome da academia." : undefined,
              nomeUnidadePrincipal: !nomeUnidadePrincipal ? "Informe a unidade principal." : undefined,
              emailAdministrador: !adminEmail ? "Informe o e-mail do administrador." : undefined,
            },
          },
          400,
        );
        return;
      }

      const academiaId = nextId("academia", state.academias);
      const tenantId = nextId("tenant", [{ id: "tenant-000" }, ...state.academias.map((item) => ({ id: item.id }))]);
      state.academias.unshift({
        id: academiaId,
        nome: nomeAcademia,
        ativo: true,
        documento: str(body.cnpj),
      });
      state.saasOnboarding.academias.unshift({
        academiaId,
        nome: nomeAcademia,
        subdominio: nomeAcademia.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        demo: false,
        ativa: true,
        dataOnboarding: BACKOFFICE_FINANCEIRO_TODAY,
        dataCriacao: BACKOFFICE_FINANCEIRO_TODAY,
        totalAlunos: 0,
        totalTenants: 1,
      });
      state.saasOnboarding.total = state.saasOnboarding.academias.length;

      await fulfillJson(
        route,
        {
          academiaId,
          tenantId,
          unidadePrincipalId: `${tenantId}-principal`,
          nomeAcademia,
          nomeUnidadePrincipal,
          emailAdministrador: adminEmail,
          senhaTemporaria: "Senha#Inicial123",
        },
        201,
      );
      return;
    }

    await route.fallback();
  });

  return {
    state,
  };
}
