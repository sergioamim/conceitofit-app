import type { Page, Request, Route } from "@playwright/test";
import {
  buildE2EAuthSession,
  installE2EAuthSession,
  type E2EAuthSessionSeed,
} from "./auth-session";

type TenantSeed = {
  id: string;
  academiaId: string;
  groupId: string;
  nome: string;
  razaoSocial?: string;
  documento?: string;
  subdomain: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  branding?: {
    appName?: string;
    logoUrl?: string;
    themePreset?: "gym" | "premium" | "corporate";
    useCustomColors?: boolean;
    colors?: Record<string, string>;
  };
};

type PlanoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  tipo: "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL" | "AVULSO";
  duracaoDias: number;
  valor: number;
  valorMatricula: number;
  cobraAnuidade?: boolean;
  valorAnuidade?: number;
  destaque?: boolean;
  ativo: boolean;
  ordem?: number;
  beneficios?: string[];
  permiteRenovacaoAutomatica?: boolean;
  contratoAssinatura?: "DIGITAL" | "PRESENCIAL" | "AMBAS";
  contratoTemplateHtml?: string;
};

type FormaPagamentoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  tipo: "DINHEIRO" | "PIX" | "CARTAO_CREDITO" | "CARTAO_DEBITO" | "BOLETO" | "RECORRENTE";
  ativo: boolean;
  parcelasMax?: number;
  taxaPercentual?: number;
};

type ProspectSeed = {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  email?: string;
  origem: "SITE";
  status: "NOVO" | "CONVERTIDO";
  observacoes?: string;
  dataCriacao: string;
};

type AlunoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  sexo: "M" | "F" | "OUTRO";
  status: "ATIVO" | "INATIVO" | "SUSPENSO" | "CANCELADO";
  dataCadastro: string;
  endereco?: {
    cidade?: string;
  };
  observacoesMedicas?: string;
};

type MatriculaSeed = {
  id: string;
  tenantId: string;
  alunoId: string;
  planoId: string;
  dataInicio: string;
  dataFim: string;
  valorPago: number;
  valorMatricula: number;
  desconto: number;
  formaPagamento: FormaPagamentoSeed["tipo"];
  status: "ATIVA" | "VENCIDA" | "CANCELADA" | "SUSPENSA";
  renovacaoAutomatica: boolean;
  contratoStatus?: "SEM_CONTRATO" | "PENDENTE_ASSINATURA" | "ASSINADO";
  contratoModoAssinatura?: "DIGITAL" | "PRESENCIAL" | "AMBAS";
  contratoAssinadoEm?: string;
  dataCriacao: string;
};

type PagamentoSeed = {
  id: string;
  tenantId: string;
  alunoId: string;
  matriculaId?: string;
  tipo: "MATRICULA" | "MENSALIDADE" | "TAXA" | "PRODUTO" | "AVULSO";
  descricao: string;
  valor: number;
  desconto: number;
  valorFinal: number;
  dataVencimento: string;
  dataPagamento?: string;
  formaPagamento?: FormaPagamentoSeed["tipo"];
  status: "PENDENTE" | "PAGO" | "VENCIDO" | "CANCELADO";
  observacoes?: string;
  nfseEmitida?: boolean;
  dataCriacao: string;
};

type VendaSeed = {
  id: string;
  tenantId: string;
  tipo: "PLANO";
  clienteId: string;
  clienteNome: string;
  status: "FECHADA";
  itens: Array<{
    id: string;
    tipo: "PLANO" | "SERVICO" | "PRODUTO";
    referenciaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    desconto: number;
    valorTotal: number;
  }>;
  subtotal: number;
  descontoTotal: number;
  acrescimoTotal: number;
  total: number;
  planoId: string;
  matriculaId?: string;
  contratoStatus?: "SEM_CONTRATO" | "PENDENTE_ASSINATURA" | "ASSINADO";
  dataInicioContrato?: string;
  dataFimContrato?: string;
  pagamento: {
    formaPagamento: FormaPagamentoSeed["tipo"];
    parcelas?: number;
    valorPago: number;
    status: "PAGO" | "PENDENTE";
    observacoes?: string;
  };
  dataCriacao: string;
};

type AdesaoPublicaSeed = {
  id: string;
  tokenPublico: string;
  tenantId: string;
  academiaId: string;
  planoId: string | null;
  origem: "TRIAL" | "CADASTRO_PUBLICO";
  status:
    | "TRIAL_INICIADO"
    | "CADASTRO_RECEBIDO"
    | "CHECKOUT_INICIADO"
    | "AGUARDANDO_CONTRATO"
    | "AGUARDANDO_PAGAMENTO"
    | "CONCLUIDA";
  candidatoNome: string;
  candidatoEmail: string;
  candidatoTelefone: string | null;
  candidatoCpf: string | null;
  contratoStatus: "PENDENTE" | "ASSINADO" | null;
  pagamentoStatus:
    | "CRIADO"
    | "AUTORIZADO"
    | "CAPTURADO"
    | "LIQUIDADO"
    | null;
  alunoId: string | null;
  contratoId: string | null;
  pagamentoId: string | null;
  createdAt: string;
  updatedAt: string;
};

type AdesaoPendenciaSeed = {
  codigo: "DADOS_CADASTRAIS" | "PAGAMENTO" | "CONTRATO";
  descricao: string;
  obrigatoria: boolean;
  resolvida: boolean;
  resolvidaEm: string | null;
};

type ReservasTenantSeed = {
  id: string;
  nome: string;
  ativo: boolean;
};

type ReservasAlunoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: "ATIVO";
  dataNascimento: string;
  sexo: "M" | "F" | "OUTRO";
  dataCadastro: string;
};

type AtividadeSeed = {
  id: string;
  tenantId: string;
  nome: string;
  categoria: "COLETIVA" | "CARDIO" | "MUSCULACAO" | "LUTA" | "AQUATICA" | "OUTRA";
  ativo: boolean;
};

type AulaSessaoSeed = {
  id: string;
  tenantId: string;
  atividadeGradeId: string;
  atividadeId: string;
  atividadeNome: string;
  data: string;
  diaSemana: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  permiteReserva: boolean;
  listaEsperaHabilitada: boolean;
  acessoClientes: "TODOS_CLIENTES" | "APENAS_COM_CONTRATO_OU_SERVICO";
  exibirNoAppCliente: boolean;
  exibirNoAutoatendimento: boolean;
  checkinLiberadoMinutosAntes: number;
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
  local?: string;
  salaNome?: string;
  instrutorNome?: string;
  origemTipo?: "GRADE_RECORRENTE" | "OCORRENCIA_AVULSA";
  ocorrenciaId?: string;
  definicaoHorario?: "PREVIAMENTE" | "SOB_DEMANDA";
};

type ReservaSeed = {
  id: string;
  tenantId: string;
  sessaoId: string;
  atividadeGradeId: string;
  atividadeId: string;
  atividadeNome: string;
  alunoId: string;
  alunoNome: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  origem: "BACKOFFICE" | "PORTAL_CLIENTE";
  status: "CONFIRMADA" | "LISTA_ESPERA" | "CHECKIN" | "CANCELADA";
  posicaoListaEspera?: number;
  checkinEm?: string;
  canceladaEm?: string;
  local?: string;
  instrutorNome?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
};

function normalizeApiPath(pathname: string): string {
  return pathname.replace(/^\/backend/, "");
}

function parseBody<T = unknown>(request: Request): T {
  try {
    const raw = request.postData();
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

async function fulfillJson(route: Route, json: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function todayIso(): string {
  return "2026-03-12";
}

function nowIso(): string {
  return "2026-03-12T10:00:00";
}

function addDays(baseIso: string, days: number): string {
  const date = new Date(`${baseIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function buildAcademiaFromTenant(tenant: TenantSeed) {
  return {
    id: tenant.academiaId,
    nome: tenant.nome,
    razaoSocial: tenant.razaoSocial,
    documento: tenant.documento,
    email: tenant.email,
    telefone: tenant.telefone,
    ativo: true,
    branding: tenant.branding,
  };
}

function buildCatalogoPublicoResponse(tenant: TenantSeed, planos: PlanoSeed[]) {
  return {
    tenantId: tenant.id,
    academiaId: tenant.academiaId,
    nomeUnidade: tenant.nome,
    subdomain: tenant.subdomain,
    planos: planos
      .filter((plano) => plano.ativo)
      .sort((left, right) => {
        if (left.destaque === right.destaque) {
          return (left.ordem ?? 999) - (right.ordem ?? 999);
        }
        return left.destaque ? -1 : 1;
      })
      .map((plano) => ({
        id: plano.id,
        nome: plano.nome,
        descricao: plano.descricao ?? "",
        tipo: plano.tipo,
        duracaoDias: plano.duracaoDias,
        valor: plano.valor,
        valorMatricula: plano.valorMatricula,
        destaque: plano.destaque ?? false,
        beneficios: plano.beneficios ?? [],
      })),
  };
}

function resolveAdesaoPendencias(adesao: AdesaoPublicaSeed): AdesaoPendenciaSeed[] {
  if (adesao.status === "TRIAL_INICIADO") {
    return [];
  }

  const pendencias: AdesaoPendenciaSeed[] = [];
  if (adesao.contratoStatus) {
    const contratoAssinado = adesao.contratoStatus === "ASSINADO";
    pendencias.push({
      codigo: "CONTRATO",
      descricao: contratoAssinado ? "Contrato assinado." : "Contrato pendente de assinatura.",
      obrigatoria: true,
      resolvida: contratoAssinado,
      resolvidaEm: contratoAssinado ? nowIso() : null,
    });
  }

  if (adesao.pagamentoStatus) {
    const pagamentoConcluido =
      adesao.pagamentoStatus === "LIQUIDADO" || adesao.pagamentoStatus === "CAPTURADO";
    pendencias.push({
      codigo: "PAGAMENTO",
      descricao: pagamentoConcluido ? "Pagamento confirmado." : "Pagamento pendente de confirmação.",
      obrigatoria: true,
      resolvida: pagamentoConcluido,
      resolvidaEm: pagamentoConcluido ? nowIso() : null,
    });
  }

  return pendencias;
}

function buildAdesaoStatusResponse(adesao: AdesaoPublicaSeed) {
  return {
    ...adesao,
    trialDias: adesao.origem === "TRIAL" ? 7 : null,
    mensagemStatus: adesao.status === "CONCLUIDA" ? "Contratação concluída." : null,
    pendencias: resolveAdesaoPendencias(adesao),
  };
}

function findPlan(planos: PlanoSeed[], planId: string): PlanoSeed {
  const plan = planos.find((item) => item.id === planId);
  if (!plan) {
    throw new Error(`Plano ${planId} não encontrado no stub`);
  }
  return plan;
}

export async function seedAuthenticatedSession(
  page: Page,
  options: {
    tenantId: string;
    tenantName?: string;
    availableTenants?: Array<{ tenantId: string; defaultTenant?: boolean }>;
    baseTenantId?: string;
    userId?: string;
    userKind?: string;
    displayName?: string;
    roles?: string[];
    availableScopes?: string[];
    broadAccess?: boolean;
    networkId?: string;
    networkSubdomain?: string;
    networkName?: string;
    forcePasswordChangeRequired?: boolean;
  }
) {
  const seed: E2EAuthSessionSeed = {
    activeTenantId: options.tenantId,
    preferredTenantId: options.tenantId,
    baseTenantId: options.baseTenantId ?? options.tenantId,
    availableTenants:
      options.availableTenants ?? [{ tenantId: options.tenantId, defaultTenant: true }],
    userId: options.userId,
    userKind: options.userKind,
    displayName: options.displayName,
    roles: options.roles,
    availableScopes: options.availableScopes,
    broadAccess: options.broadAccess,
    networkId: options.networkId,
    networkSubdomain: options.networkSubdomain,
    networkName: options.networkName,
    forcePasswordChangeRequired: options.forcePasswordChangeRequired,
  };

  await installE2EAuthSession(page, seed);
}

export async function installPublicJourneyApiMocks(page: Page) {
  const tenants: TenantSeed[] = [
    {
      id: "tenant-mananciais-s1",
      academiaId: "academia-sergio-amim",
      groupId: "academia-sergio-amim",
      nome: "MANANCIAIS - S1",
      razaoSocial: "Academia Sergio Amim - Mananciais",
      documento: "12.345.678/0001-90",
      subdomain: "mananciais-s1",
      email: "mananciais@academia.local",
      telefone: "(11) 3000-1001",
      ativo: true,
      branding: {
        appName: "Conceito.Fit Mananciais",
        useCustomColors: true,
        colors: {
          primary: "#0e3b43",
          accent: "#f5b700",
          border: "#163e48",
          background: "#061419",
          foreground: "#f8fafc",
        },
      },
    },
    {
      id: "tenant-pechincha-s3",
      academiaId: "academia-sergio-amim",
      groupId: "academia-sergio-amim",
      nome: "PECHINCHA - S3",
      razaoSocial: "Academia Sergio Amim - Pechincha",
      documento: "12.345.678/0001-90",
      subdomain: "pechincha-s3",
      email: "pechincha@academia.local",
      telefone: "(21) 3000-2003",
      ativo: true,
      branding: {
        appName: "Conceito.Fit Pechincha",
        useCustomColors: true,
        colors: {
          primary: "#14213d",
          accent: "#fca311",
          border: "#22355a",
          background: "#0b1020",
          foreground: "#f9fafb",
        },
      },
    },
  ];

  const plansByTenant = new Map<string, PlanoSeed[]>([
    [
      "tenant-mananciais-s1",
      [
        {
          id: "plano-mananciais-premium",
          tenantId: "tenant-mananciais-s1",
          nome: "Plano Premium",
          descricao: "Acesso completo com musculação e spinning.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 189.9,
          valorMatricula: 59.9,
          destaque: true,
          ativo: true,
          ordem: 1,
          beneficios: ["Musculação livre", "Spinning", "Avaliação inicial"],
          permiteRenovacaoAutomatica: true,
          contratoAssinatura: "DIGITAL",
          contratoTemplateHtml:
            "<p>{{NOME_CLIENTE}} assina o {{NOME_PLANO}} da {{NOME_UNIDADE}} em {{DATA_ASSINATURA}}.</p>",
        },
        {
          id: "plano-mananciais-lite",
          tenantId: "tenant-mananciais-s1",
          nome: "Plano Lite",
          descricao: "Treinos em horário comercial.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 129.9,
          valorMatricula: 39.9,
          ativo: true,
          ordem: 2,
          beneficios: ["Musculação", "Horário comercial"],
          permiteRenovacaoAutomatica: true,
          contratoAssinatura: "DIGITAL",
          contratoTemplateHtml:
            "<p>{{NOME_CLIENTE}} assina o {{NOME_PLANO}} da {{NOME_UNIDADE}} em {{DATA_ASSINATURA}}.</p>",
        },
      ],
    ],
    [
      "tenant-pechincha-s3",
      [
        {
          id: "plano-pechincha-trial",
          tenantId: "tenant-pechincha-s3",
          nome: "Plano Smart",
          descricao: "Entrada ideal para aulas coletivas.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 149.9,
          valorMatricula: 29.9,
          destaque: true,
          ativo: true,
          ordem: 1,
          beneficios: ["Aulas coletivas", "Musculação", "App do aluno"],
          permiteRenovacaoAutomatica: true,
          contratoAssinatura: "DIGITAL",
          contratoTemplateHtml:
            "<p>{{NOME_CLIENTE}} assina o {{NOME_PLANO}} da {{NOME_UNIDADE}} em {{DATA_ASSINATURA}}.</p>",
        },
      ],
    ],
  ]);

  const paymentMethodsByTenant = new Map<string, FormaPagamentoSeed[]>([
    [
      "tenant-mananciais-s1",
      [
        {
          id: "fp-dinheiro",
          tenantId: "tenant-mananciais-s1",
          nome: "Dinheiro",
          tipo: "DINHEIRO",
          ativo: true,
          parcelasMax: 1,
        },
        {
          id: "fp-boleto",
          tenantId: "tenant-mananciais-s1",
          nome: "Boleto",
          tipo: "BOLETO",
          ativo: true,
          parcelasMax: 1,
        },
        {
          id: "fp-pix",
          tenantId: "tenant-mananciais-s1",
          nome: "Pix",
          tipo: "PIX",
          ativo: true,
          parcelasMax: 1,
        },
      ],
    ],
    [
      "tenant-pechincha-s3",
      [
        {
          id: "fp-boleto-pechincha",
          tenantId: "tenant-pechincha-s3",
          nome: "Boleto",
          tipo: "BOLETO",
          ativo: true,
          parcelasMax: 1,
        },
      ],
    ],
  ]);

  let currentTenantId = "tenant-mananciais-s1";
  let prospectCounter = 1;
  let alunoCounter = 1;
  let vendaCounter = 1;
  let matriculaCounter = 1;
  let pagamentoCounter = 1;
  let adesaoCounter = 1;
  let prospects: ProspectSeed[] = [];
  let alunos: AlunoSeed[] = [];
  let matriculas: MatriculaSeed[] = [];
  let pagamentos: PagamentoSeed[] = [];
  let vendas: VendaSeed[] = [];
  let adesoes: AdesaoPublicaSeed[] = [];

  function getTenantFromRequest(url: URL): TenantSeed {
    const queryTenant = url.searchParams.get("tenantId");
    const tenantId = queryTenant?.trim() || currentTenantId;
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} não encontrado no stub`);
    }
    return tenant;
  }

  function findAdesao(path: string, token?: string | null): AdesaoPublicaSeed | undefined {
    const adesaoId = path.split("/")[5] ?? "";
    return adesoes.find((item) => item.id === adesaoId && (!token || item.tokenPublico === token));
  }

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizeApiPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/me" && method === "GET") {
      const tenantAtual = tenants.find((item) => item.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        id: "user-public-e2e",
        nome: "Operador E2E",
        email: "admin@academia.local",
        roles: ["OWNER", "ADMIN"],
        activeTenantId: currentTenantId,
        availableTenants: [{ tenantId: tenantAtual.id, defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/unidades" && method === "GET") {
      await fulfillJson(route, tenants);
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      const tenantAtual = tenants.find((item) => item.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      const tenantId = path.split("/").at(-1) ?? currentTenantId;
      currentTenantId = tenantId;
      const tenantAtual = tenants.find((item) => item.id === currentTenantId) ?? tenants[0];
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual,
        unidadesDisponiveis: tenants,
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, buildAcademiaFromTenant(getTenantFromRequest(url)));
      return;
    }

    if (path === "/api/v1/comercial/planos" && method === "GET") {
      const tenant = getTenantFromRequest(url);
      await fulfillJson(route, plansByTenant.get(tenant.id) ?? []);
      return;
    }

    if (path === "/api/v1/publico/adesao/catalogo" && method === "GET") {
      const tenantRef = url.searchParams.get("subdomain") ?? url.searchParams.get("tenantId");
      const tenant = tenants.find((item) => item.subdomain === tenantRef || item.id === tenantRef) ?? getTenantFromRequest(url);
      await fulfillJson(route, buildCatalogoPublicoResponse(tenant, plansByTenant.get(tenant.id) ?? []));
      return;
    }

    if (/^\/api\/v1\/comercial\/planos\/[^/]+$/.test(path) && method === "GET") {
      const tenant = getTenantFromRequest(url);
      const planId = path.split("/").at(-1) ?? "";
      const plano = (plansByTenant.get(tenant.id) ?? []).find((item) => item.id === planId);
      await fulfillJson(route, plano ?? { message: "Plano não encontrado" }, plano ? 200 : 404);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/formas-pagamento" && method === "GET") {
      const tenant = getTenantFromRequest(url);
      await fulfillJson(route, paymentMethodsByTenant.get(tenant.id) ?? []);
      return;
    }

    if (path === "/api/v1/academia/prospects" && method === "POST") {
      const tenant = getTenantFromRequest(url);
      const payload = parseBody<Partial<ProspectSeed>>(request);
      const created: ProspectSeed = {
        id: `prospect-publico-${prospectCounter++}`,
        tenantId: tenant.id,
        nome: payload.nome?.trim() || "Lead público",
        telefone: payload.telefone?.trim() || "",
        email: payload.email?.trim() || undefined,
        origem: "SITE",
        status: "NOVO",
        observacoes: payload.observacoes?.trim() || undefined,
        dataCriacao: nowIso(),
      };
      prospects = [created, ...prospects];
      await fulfillJson(route, created, 201);
      return;
    }

    if (path === "/api/v1/publico/adesao/trials" && method === "POST") {
      const payload = parseBody<{
        tenantId?: string;
        nome?: string;
        email?: string;
        telefone?: string;
      }>(request);
      const tenant = tenants.find((item) => item.id === payload.tenantId) ?? getTenantFromRequest(url);
      const createdAt = nowIso();
      const adesao: AdesaoPublicaSeed = {
        id: `adesao-publica-${adesaoCounter++}`,
        tokenPublico: `token-adesao-${adesaoCounter}`,
        tenantId: tenant.id,
        academiaId: tenant.academiaId,
        planoId: null,
        origem: "TRIAL",
        status: "TRIAL_INICIADO",
        candidatoNome: payload.nome?.trim() || "Lead público",
        candidatoEmail: payload.email?.trim() || "",
        candidatoTelefone: payload.telefone?.trim() || null,
        candidatoCpf: null,
        contratoStatus: null,
        pagamentoStatus: null,
        alunoId: null,
        contratoId: null,
        pagamentoId: null,
        createdAt,
        updatedAt: createdAt,
      };
      adesoes = [adesao, ...adesoes];
      await fulfillJson(route, buildAdesaoStatusResponse(adesao), 201);
      return;
    }

    if (path === "/api/v1/publico/adesao/cadastros" && method === "POST") {
      const payload = parseBody<{
        tenantId?: string;
        nome?: string;
        email?: string;
        telefone?: string;
        cpf?: string;
      }>(request);
      const tenant = tenants.find((item) => item.id === payload.tenantId) ?? getTenantFromRequest(url);
      const createdAt = nowIso();
      const adesao: AdesaoPublicaSeed = {
        id: `adesao-publica-${adesaoCounter++}`,
        tokenPublico: `token-adesao-${adesaoCounter}`,
        tenantId: tenant.id,
        academiaId: tenant.academiaId,
        planoId: null,
        origem: "CADASTRO_PUBLICO",
        status: "CADASTRO_RECEBIDO",
        candidatoNome: payload.nome?.trim() || "Aluno público",
        candidatoEmail: payload.email?.trim() || "",
        candidatoTelefone: payload.telefone?.trim() || null,
        candidatoCpf: payload.cpf?.trim() || null,
        contratoStatus: null,
        pagamentoStatus: null,
        alunoId: null,
        contratoId: null,
        pagamentoId: null,
        createdAt,
        updatedAt: createdAt,
      };
      adesoes = [adesao, ...adesoes];
      await fulfillJson(route, buildAdesaoStatusResponse(adesao), 201);
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/cadastro$/.test(path) && method === "PUT") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      const payload = parseBody<{
        nome?: string;
        email?: string;
        telefone?: string;
        cpf?: string;
      }>(request);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      Object.assign(adesao, {
        origem: "CADASTRO_PUBLICO",
        status: "CADASTRO_RECEBIDO",
        candidatoNome: payload.nome?.trim() || adesao.candidatoNome,
        candidatoEmail: payload.email?.trim() || adesao.candidatoEmail,
        candidatoTelefone: payload.telefone?.trim() || adesao.candidatoTelefone,
        candidatoCpf: payload.cpf?.trim() || adesao.candidatoCpf,
        updatedAt: nowIso(),
      });
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/checkout$/.test(path) && method === "POST") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      const payload = parseBody<{ planoId?: string }>(request);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      const plano = findPlan(plansByTenant.get(adesao.tenantId) ?? [], payload.planoId ?? "");
      const createdAt = nowIso();
      Object.assign(adesao, {
        planoId: plano.id,
        status: "AGUARDANDO_CONTRATO",
        contratoStatus: "PENDENTE",
        pagamentoStatus: "CRIADO",
        alunoId: adesao.alunoId ?? `aluno-publico-${alunoCounter++}`,
        contratoId: adesao.contratoId ?? `contrato-publico-${matriculaCounter++}`,
        pagamentoId: adesao.pagamentoId ?? `pagamento-publico-${pagamentoCounter++}`,
        updatedAt: createdAt,
      });
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/contrato\/otp$/.test(path) && method === "POST") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      await fulfillJson(route, {
        enviadoEm: nowIso(),
        otpValidoAte: `${todayIso()}T23:59:59`,
      });
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/contrato\/assinaturas$/.test(path) && method === "POST") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      adesao.contratoStatus = "ASSINADO";
      adesao.status = adesao.pagamentoStatus === "LIQUIDADO" ? "CONCLUIDA" : "AGUARDANDO_PAGAMENTO";
      adesao.updatedAt = nowIso();
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/pagamento\/confirmacao$/.test(path) && method === "POST") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      adesao.pagamentoStatus = "LIQUIDADO";
      adesao.status = adesao.contratoStatus === "ASSINADO" ? "CONCLUIDA" : "AGUARDANDO_CONTRATO";
      adesao.updatedAt = nowIso();
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/pendencias$/.test(path) && method === "GET") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      await fulfillJson(route, resolveAdesaoPendencias(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+\/pendencias\/[^/]+$/.test(path) && method === "PATCH") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      const codigo = path.split("/").at(-1) ?? "";
      const payload = parseBody<{ resolvida?: boolean }>(request);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      if (codigo === "CONTRATO") {
        adesao.contratoStatus = payload.resolvida ? "ASSINADO" : "PENDENTE";
      }
      if (codigo === "PAGAMENTO") {
        adesao.pagamentoStatus = payload.resolvida ? "LIQUIDADO" : "CRIADO";
      }
      if (adesao.contratoStatus === "ASSINADO" && adesao.pagamentoStatus === "LIQUIDADO") {
        adesao.status = "CONCLUIDA";
      } else if (adesao.contratoStatus === "ASSINADO") {
        adesao.status = "AGUARDANDO_PAGAMENTO";
      } else if (adesao.pagamentoStatus === "LIQUIDADO") {
        adesao.status = "AGUARDANDO_CONTRATO";
      } else {
        adesao.status = "AGUARDANDO_CONTRATO";
      }
      adesao.updatedAt = nowIso();
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/publico\/adesao\/[^/]+$/.test(path) && method === "GET") {
      const token = request.headers()["x-adesao-token"];
      const adesao = findAdesao(path, token);
      if (!adesao) {
        await fulfillJson(route, { message: "Adesão não encontrada." }, 404);
        return;
      }
      await fulfillJson(route, buildAdesaoStatusResponse(adesao));
      return;
    }

    if (/^\/api\/v1\/academia\/prospects\/[^/]+\/status$/.test(path) && method === "PATCH") {
      const prospectId = path.split("/").at(-2) ?? "";
      const nextStatus = url.searchParams.get("status") ?? "CONVERTIDO";
      prospects = prospects.map((item) =>
        item.id === prospectId
          ? {
              ...item,
              status: nextStatus === "CONVERTIDO" ? "CONVERTIDO" : item.status,
            }
          : item,
      );
      const updated = prospects.find((item) => item.id === prospectId);
      await fulfillJson(route, updated ?? { message: "Prospect não encontrado" }, updated ? 200 : 404);
      return;
    }

    if (path === "/api/v1/comercial/alunos" && method === "POST") {
      const tenant = getTenantFromRequest(url);
      const payload = parseBody<Partial<AlunoSeed>>(request);
      const created: AlunoSeed = {
        id: `aluno-publico-${alunoCounter++}`,
        tenantId: tenant.id,
        nome: payload.nome?.trim() || "Aluno público",
        email: payload.email?.trim() || "",
        telefone: payload.telefone?.trim() || "",
        cpf: payload.cpf?.trim() || "",
        dataNascimento: payload.dataNascimento?.trim() || todayIso(),
        sexo: payload.sexo ?? "OUTRO",
        status: "ATIVO",
        dataCadastro: nowIso(),
        endereco: payload.endereco,
        observacoesMedicas: payload.observacoesMedicas,
      };
      alunos = [created, ...alunos];
      await fulfillJson(route, created, 201);
      return;
    }

    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      const tenant = getTenantFromRequest(url);
      const search = url.searchParams.get("search")?.trim().toLowerCase();
      const rows = alunos
        .filter((item) => item.tenantId === tenant.id)
        .filter((item) => {
          if (!search) return true;
          const haystack = [item.nome, item.email, item.telefone, item.cpf]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          return haystack.includes(search);
        });
      await fulfillJson(route, {
        items: rows,
        page: Number(url.searchParams.get("page") ?? 0),
        size: Number(url.searchParams.get("size") ?? Math.max(rows.length, 1)),
        hasNext: false,
        totaisStatus: {
          total: rows.length,
          totalAtivo: rows.filter((item) => item.status === "ATIVO").length,
          totalSuspenso: rows.filter((item) => item.status === "SUSPENSO").length,
          totalInativo: rows.filter((item) => item.status === "INATIVO").length,
          totalCancelado: rows.filter((item) => item.status === "CANCELADO").length,
        },
      });
      return;
    }

    if (/^\/api\/v1\/comercial\/alunos\/[^/]+$/.test(path) && method === "GET") {
      const alunoId = path.split("/").at(-1) ?? "";
      const aluno = alunos.find((item) => item.id === alunoId);
      await fulfillJson(route, aluno ?? { message: "Aluno não encontrado" }, aluno ? 200 : 404);
      return;
    }

    if (path === "/api/v1/comercial/alunos-com-matricula" && method === "POST") {
      const tenant = getTenantFromRequest(url);
      const payload = parseBody<Partial<AlunoSeed> & {
        planoId?: string;
        dataInicio?: string;
        formaPagamento?: FormaPagamentoSeed["tipo"];
        desconto?: number;
      }>(request);
      const plano = findPlan(plansByTenant.get(tenant.id) ?? [], payload.planoId ?? "");
      const createdAt = nowIso();
      const dataInicio = payload.dataInicio?.trim() || todayIso();
      const dataFim = addDays(dataInicio, plano.duracaoDias);
      const contractStatus = plano.contratoTemplateHtml?.trim()
        ? "PENDENTE_ASSINATURA"
        : "SEM_CONTRATO";
      const aluno: AlunoSeed = {
        id: `aluno-publico-${alunoCounter++}`,
        tenantId: tenant.id,
        nome: payload.nome?.trim() || "Aluno público",
        email: payload.email?.trim() || "",
        telefone: payload.telefone?.trim() || "",
        cpf: payload.cpf?.trim() || "",
        dataNascimento: payload.dataNascimento?.trim() || todayIso(),
        sexo: payload.sexo ?? "OUTRO",
        status: "ATIVO",
        dataCadastro: createdAt,
        endereco: payload.endereco,
        observacoesMedicas: payload.observacoesMedicas,
      };
      const matricula: MatriculaSeed = {
        id: `matricula-publica-${matriculaCounter++}`,
        tenantId: tenant.id,
        alunoId: aluno.id,
        planoId: plano.id,
        dataInicio,
        dataFim,
        valorPago: Math.max(0, plano.valor - Number(payload.desconto ?? 0)),
        valorMatricula: plano.valorMatricula,
        desconto: Number(payload.desconto ?? 0),
        formaPagamento: payload.formaPagamento ?? "DINHEIRO",
        status: "ATIVA",
        renovacaoAutomatica: Boolean(plano.permiteRenovacaoAutomatica),
        contratoStatus: contractStatus,
        contratoModoAssinatura: plano.contratoAssinatura ?? "DIGITAL",
        dataCriacao: createdAt,
      };
      const pagamento: PagamentoSeed = {
        id: `pagamento-publico-${pagamentoCounter++}`,
        tenantId: tenant.id,
        alunoId: aluno.id,
        matriculaId: matricula.id,
        tipo: "MENSALIDADE",
        descricao: plano.nome,
        valor: plano.valor,
        desconto: Number(payload.desconto ?? 0),
        valorFinal: Math.max(0, plano.valor - Number(payload.desconto ?? 0)),
        dataVencimento: dataInicio,
        dataPagamento: dataInicio,
        formaPagamento: payload.formaPagamento ?? "DINHEIRO",
        status: "PAGO",
        nfseEmitida: false,
        dataCriacao: createdAt,
      };
      alunos = [aluno, ...alunos];
      matriculas = [matricula, ...matriculas];
      pagamentos = [pagamento, ...pagamentos];
      await fulfillJson(route, { aluno, matricula, pagamento }, 201);
      return;
    }

    if (/^\/api\/v1\/comercial\/alunos\/[^/]+\/(?:matriculas|adesoes)$/.test(path) && method === "GET") {
      const alunoId = path.split("/").at(-2) ?? "";
      await fulfillJson(route, matriculas.filter((item) => item.alunoId === alunoId));
      return;
    }

    if (/^\/api\/v1\/comercial\/alunos\/[^/]+\/presencas$/.test(path) && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    if (path === "/api/v1/comercial/vendas" && method === "POST") {
      const tenant = getTenantFromRequest(url);
      const payload = parseBody<{
        clienteId?: string;
        itens?: Array<{
          tipo: "PLANO" | "SERVICO" | "PRODUTO";
          referenciaId: string;
          descricao: string;
          quantidade: number;
          valorUnitario: number;
          desconto?: number;
        }>;
        pagamento: {
          formaPagamento: FormaPagamentoSeed["tipo"];
          parcelas?: number;
          valorPago: number;
          status?: "PAGO" | "PENDENTE";
          observacoes?: string;
        };
        planoContexto?: {
          planoId: string;
          dataInicio: string;
          renovacaoAutomatica?: boolean;
        };
      }>(request);

      const aluno = alunos.find((item) => item.id === payload.clienteId);
      const plano = findPlan(plansByTenant.get(tenant.id) ?? [], payload.planoContexto?.planoId ?? "");
      const createdAt = nowIso();
      const dataInicio = payload.planoContexto?.dataInicio ?? todayIso();
      const dataFim = addDays(dataInicio, plano.duracaoDias);
      const contractStatus = plano.contratoTemplateHtml?.trim()
        ? "PENDENTE_ASSINATURA"
        : "SEM_CONTRATO";
      const subtotal = (payload.itens ?? []).reduce(
        (sum, item) => sum + item.valorUnitario * item.quantidade - (item.desconto ?? 0),
        0,
      );
      const matriculaId = `matricula-publica-${matriculaCounter++}`;
      const pagamentoId = `pagamento-publico-${pagamentoCounter++}`;
      const vendaId = `venda-publica-${vendaCounter++}`;
      const valorFinal = subtotal;

      const matricula: MatriculaSeed = {
        id: matriculaId,
        tenantId: tenant.id,
        alunoId: aluno?.id ?? "",
        planoId: plano.id,
        dataInicio,
        dataFim,
        valorPago: payload.pagamento.status === "PAGO" ? valorFinal : 0,
        valorMatricula: plano.valorMatricula,
        desconto: 0,
        formaPagamento: payload.pagamento.formaPagamento,
        status: "ATIVA",
        renovacaoAutomatica: Boolean(payload.planoContexto?.renovacaoAutomatica),
        contratoStatus: contractStatus,
        contratoModoAssinatura: plano.contratoAssinatura ?? "DIGITAL",
        dataCriacao: createdAt,
      };

      const pagamento: PagamentoSeed = {
        id: pagamentoId,
        tenantId: tenant.id,
        alunoId: aluno?.id ?? "",
        matriculaId,
        tipo: "MENSALIDADE",
        descricao: plano.nome,
        valor: valorFinal,
        desconto: 0,
        valorFinal,
        dataVencimento: dataInicio,
        dataPagamento: payload.pagamento.status === "PAGO" ? dataInicio : undefined,
        formaPagamento: payload.pagamento.formaPagamento,
        status: payload.pagamento.status ?? "PENDENTE",
        observacoes: payload.pagamento.observacoes,
        nfseEmitida: false,
        dataCriacao: createdAt,
      };

      const venda: VendaSeed = {
        id: vendaId,
        tenantId: tenant.id,
        tipo: "PLANO",
        clienteId: aluno?.id ?? "",
        clienteNome: aluno?.nome ?? "",
        status: "FECHADA",
        itens: (payload.itens ?? []).map((item, index) => ({
          id: `${vendaId}-item-${index + 1}`,
          tipo: item.tipo,
          referenciaId: item.referenciaId,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          desconto: item.desconto ?? 0,
          valorTotal: item.valorUnitario * item.quantidade - (item.desconto ?? 0),
        })),
        subtotal,
        descontoTotal: 0,
        acrescimoTotal: 0,
        total: subtotal,
        planoId: plano.id,
        matriculaId,
        contratoStatus: contractStatus,
        dataInicioContrato: dataInicio,
        dataFimContrato: dataFim,
        pagamento: {
          formaPagamento: payload.pagamento.formaPagamento,
          parcelas: payload.pagamento.parcelas,
          valorPago: payload.pagamento.valorPago,
          status: payload.pagamento.status ?? "PENDENTE",
          observacoes: payload.pagamento.observacoes,
        },
        dataCriacao: createdAt,
      };

      matriculas = [matricula, ...matriculas];
      pagamentos = [pagamento, ...pagamentos];
      vendas = [venda, ...vendas];

      await fulfillJson(route, venda, 201);
      return;
    }

    if (/^\/api\/v1\/comercial\/vendas\/[^/]+$/.test(path) && method === "GET") {
      const vendaId = path.split("/").at(-1) ?? "";
      const venda = vendas.find((item) => item.id === vendaId);
      await fulfillJson(route, venda ?? { message: "Venda não encontrada" }, venda ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/comercial\/matriculas\/[^/]+\/contrato\/assinar$/.test(path) && method === "POST") {
      const matriculaId = path.split("/").at(-3) ?? "";
      matriculas = matriculas.map((item) =>
        item.id === matriculaId
          ? {
              ...item,
              contratoStatus: "ASSINADO",
              contratoAssinadoEm: nowIso(),
            }
          : item,
      );
      const updated = matriculas.find((item) => item.id === matriculaId);
      vendas = vendas.map((item) =>
        item.matriculaId === matriculaId
          ? {
              ...item,
              contratoStatus: "ASSINADO",
            }
          : item,
      );
      await fulfillJson(route, updated ?? { message: "Matrícula não encontrada" }, updated ? 200 : 404);
      return;
    }

    if (path === "/api/v1/comercial/pagamentos" && method === "GET") {
      const alunoId = url.searchParams.get("alunoId")?.trim();
      const rows = alunoId ? pagamentos.filter((item) => item.alunoId === alunoId) : pagamentos;
      await fulfillJson(route, rows);
      return;
    }

    if (path === "/api/v1/administrativo/convenios" && method === "GET") {
      await fulfillJson(route, []);
      return;
    }

    if (/^\/api\/v1\/comercial\/pagamentos\/[^/]+\/receber$/.test(path) && method === "POST") {
      const pagamentoId = path.split("/").at(-2) ?? "";
      const payload = parseBody<{ dataPagamento?: string; formaPagamento?: FormaPagamentoSeed["tipo"]; observacoes?: string }>(request);
      pagamentos = pagamentos.map((item) =>
        item.id === pagamentoId
          ? {
              ...item,
              status: "PAGO",
              dataPagamento: payload.dataPagamento ?? todayIso(),
              formaPagamento: payload.formaPagamento ?? item.formaPagamento,
              observacoes: payload.observacoes ?? item.observacoes,
            }
          : item,
      );
      const updated = pagamentos.find((item) => item.id === pagamentoId);
      vendas = vendas.map((item) =>
        item.matriculaId === updated?.matriculaId
          ? {
              ...item,
              pagamento: {
                ...item.pagamento,
                status: "PAGO",
                valorPago: item.total,
                formaPagamento: payload.formaPagamento ?? item.pagamento.formaPagamento,
                observacoes: payload.observacoes ?? item.pagamento.observacoes,
              },
            }
          : item,
      );
      await fulfillJson(route, updated ?? { message: "Pagamento não encontrado" }, updated ? 200 : 404);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

export async function installOperationalCrmApiMocks(page: Page) {
  const tenant: TenantSeed = {
    id: "tenant-crm-operacional",
    academiaId: "academia-sergio-amim",
    groupId: "academia-sergio-amim",
    nome: "MANANCIAIS - S1",
    razaoSocial: "Academia Sergio Amim - Mananciais",
    documento: "12.345.678/0001-90",
    subdomain: "mananciais-s1",
    email: "mananciais@academia.local",
    telefone: "(11) 3000-1001",
    ativo: true,
    branding: {
      appName: "Conceito.Fit Mananciais",
    },
  };
  const academia = buildAcademiaFromTenant(tenant);
  let currentTenantId = tenant.id;

  const funcionarios = [
    {
      id: "func-crm-1",
      tenantId: tenant.id,
      nome: "Camila Consultora",
      cargo: "Consultora comercial",
      ativo: true,
      emailProfissional: "camila.consultora@academia.local",
      celular: "(11) 98888-1111",
      podeMinistrarAulas: false,
      possuiAcessoSistema: true,
    },
  ];

  const prospects = [
    {
      id: "prospect-crm-1",
      tenantId: tenant.id,
      responsavelId: "func-crm-1",
      nome: "Larissa Moreira",
      telefone: "(11) 97777-1111",
      email: "larissa.moreira@crm.local",
      origem: "WHATSAPP",
      status: "QUALIFICADO",
      observacoes: "Interessada em musculação e aulas coletivas.",
      dataCriacao: "2026-03-12T09:00:00",
      dataUltimoContato: "2026-03-12T10:00:00",
    },
  ];

  const tasks = [
    {
      id: "crm-task-1",
      tenantId: tenant.id,
      prospectId: "prospect-crm-1",
      prospectNome: "Larissa Moreira",
      stageStatus: "QUALIFICADO",
      titulo: "Retornar proposta premium",
      descricao: "Confirmar condições e agendar visita guiada.",
      tipo: "LIGACAO",
      prioridade: "ALTA",
      status: "PENDENTE",
      responsavelId: "func-crm-1",
      responsavelNome: "Camila Consultora",
      origem: "MANUAL",
      vencimentoEm: "2026-03-13T10:00:00",
      dataCriacao: "2026-03-12T10:05:00",
    },
  ];

  const playbooks = [
    {
      id: "crm-playbook-1",
      tenantId: tenant.id,
      nome: "Qualificação expressa",
      objetivo: "Padronizar o primeiro contato com leads inbound.",
      stageStatus: "NOVO",
      ativo: true,
      passos: [
        {
          id: "crm-playbook-1-step-1",
          titulo: "Confirmar objetivo",
          descricao: "Entender modalidade, horário e objeções iniciais.",
          acao: "CHECKLIST",
          prazoHoras: 4,
          obrigatoria: true,
        },
      ],
      dataCriacao: "2026-03-11T09:00:00",
      dataAtualizacao: "2026-03-12T09:30:00",
    },
  ];

  const automacoes = [
    {
      id: "crm-automation-1",
      tenantId: tenant.id,
      nome: "Lembrete de proposta",
      descricao: "Reabre follow-up de prospects sem retorno após 24h.",
      gatilho: "PROSPECT_PARADO",
      acao: "CRIAR_TAREFA",
      stageStatus: "QUALIFICADO",
      ativo: true,
      execucoes: 14,
      ultimaExecucao: "2026-03-12T08:30:00",
      dataCriacao: "2026-03-01T08:00:00",
      dataAtualizacao: "2026-03-12T08:30:00",
    },
  ];

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizeApiPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-crm-e2e",
        nome: "Operador CRM",
        email: "admin@academia.local",
        roles: ["OWNER", "ADMIN"],
        activeTenantId: currentTenantId,
        availableTenants: [{ tenantId: currentTenantId, defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: tenant,
        unidadesDisponiveis: [tenant],
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      currentTenantId = path.split("/").at(-1) ?? currentTenantId;
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: tenant,
        unidadesDisponiveis: [tenant],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, academia);
      return;
    }

    if (path === "/api/v1/administrativo/funcionarios" && method === "GET") {
      await fulfillJson(route, funcionarios);
      return;
    }

    if (path === "/api/v1/academia/prospects" && method === "GET") {
      await fulfillJson(route, prospects);
      return;
    }

    if (path === "/api/v1/crm/tarefas" && method === "GET") {
      await fulfillJson(route, tasks);
      return;
    }

    if (path === "/api/v1/crm/playbooks" && method === "GET") {
      await fulfillJson(route, playbooks);
      return;
    }

    if (path === "/api/v1/crm/cadencias" && method === "GET") {
      await fulfillJson(route, { message: "Cadências indisponíveis neste ambiente" }, 404);
      return;
    }

    if (path === "/api/v1/crm/automacoes" && method === "GET") {
      await fulfillJson(route, automacoes);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

export async function installReservasApiMocks(page: Page) {
  const tenant: ReservasTenantSeed = {
    id: "tenant-reservas",
    nome: "Unidade Centro",
    ativo: true,
  };

  let currentTenantId = tenant.id;
  const academia = {
    id: "academia-reservas",
    nome: "Academia Sergio Amim",
    razaoSocial: "Academia Sergio Amim LTDA",
    documento: "12.345.678/0001-90",
    ativo: true,
    branding: {
      appName: "Conceito.Fit",
    },
  };

  const alunos: ReservasAlunoSeed[] = [
    {
      id: "al-demo-001",
      tenantId: tenant.id,
      nome: "Fernanda Portal",
      cpf: "11111111111",
      email: "fernanda.portal@academia.local",
      telefone: "(21) 99999-0001",
      status: "ATIVO",
      dataNascimento: "1994-01-10",
      sexo: "F",
      dataCadastro: nowIso(),
    },
    {
      id: "al-demo-002",
      tenantId: tenant.id,
      nome: "Bianca Rocha",
      cpf: "22222222222",
      email: "bianca.rocha@academia.local",
      telefone: "(21) 99999-0002",
      status: "ATIVO",
      dataNascimento: "1992-03-12",
      sexo: "F",
      dataCadastro: nowIso(),
    },
    {
      id: "al-demo-004",
      tenantId: tenant.id,
      nome: "Rafael Rodrigues 4",
      cpf: "44444444444",
      email: "rafael.rodrigues@academia.local",
      telefone: "(21) 99999-0004",
      status: "ATIVO",
      dataNascimento: "1991-05-05",
      sexo: "M",
      dataCadastro: nowIso(),
    },
    {
      id: "al-demo-010",
      tenantId: tenant.id,
      nome: "Joana Espera 10",
      cpf: "10101010101",
      email: "joana.espera@academia.local",
      telefone: "(21) 99999-0010",
      status: "ATIVO",
      dataNascimento: "1990-08-08",
      sexo: "F",
      dataCadastro: nowIso(),
    },
    {
      id: "al-demo-025",
      tenantId: tenant.id,
      nome: "Camila Almeida 25",
      cpf: "25252525252",
      email: "camila.almeida@academia.local",
      telefone: "(21) 99999-0025",
      status: "ATIVO",
      dataNascimento: "1995-09-25",
      sexo: "F",
      dataCadastro: nowIso(),
    },
  ];

  const atividades: AtividadeSeed[] = [
    {
      id: "atividade-spinning",
      tenantId: tenant.id,
      nome: "Spinning",
      categoria: "COLETIVA",
      ativo: true,
    },
    {
      id: "atividade-recovery",
      tenantId: tenant.id,
      nome: "Recovery",
      categoria: "COLETIVA",
      ativo: true,
    },
  ];

  const sessoes: AulaSessaoSeed[] = [
    {
      id: "sessao-spinning-2026-03-12",
      tenantId: tenant.id,
      atividadeGradeId: "grade-spinning",
      atividadeId: "atividade-spinning",
      atividadeNome: "Spinning",
      data: "2026-03-12",
      diaSemana: "QUI",
      horaInicio: "18:00",
      horaFim: "19:00",
      capacidade: 2,
      permiteReserva: true,
      listaEsperaHabilitada: true,
      acessoClientes: "APENAS_COM_CONTRATO_OU_SERVICO",
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      checkinLiberadoMinutosAntes: 15,
      permiteCheckin: true,
      checkinObrigatorio: true,
      salaNome: "Bike Studio",
      local: "Sala 2",
      instrutorNome: "Professor Caio",
      origemTipo: "GRADE_RECORRENTE",
      definicaoHorario: "PREVIAMENTE",
    },
    {
      id: "sessao-recovery-2026-03-13",
      tenantId: tenant.id,
      atividadeGradeId: "grade-recovery",
      atividadeId: "atividade-recovery",
      atividadeNome: "Recovery",
      data: "2026-03-13",
      diaSemana: "SEX",
      horaInicio: "07:00",
      horaFim: "07:45",
      capacidade: 4,
      permiteReserva: true,
      listaEsperaHabilitada: false,
      acessoClientes: "TODOS_CLIENTES",
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      checkinLiberadoMinutosAntes: 0,
      permiteCheckin: false,
      checkinObrigatorio: false,
      salaNome: "Studio Recovery",
      local: "Sala 1",
      instrutorNome: "Professora Nanda",
      origemTipo: "GRADE_RECORRENTE",
      definicaoHorario: "PREVIAMENTE",
    },
    {
      id: "sessao-yoga-ocorrencia-2026-03-14",
      tenantId: tenant.id,
      atividadeGradeId: "grade-yoga-sob-demanda",
      atividadeId: "atividade-recovery",
      atividadeNome: "Recovery",
      data: "2026-03-14",
      diaSemana: "SAB",
      horaInicio: "10:00",
      horaFim: "10:50",
      capacidade: 6,
      permiteReserva: true,
      listaEsperaHabilitada: true,
      acessoClientes: "TODOS_CLIENTES",
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: true,
      checkinLiberadoMinutosAntes: 10,
      permiteCheckin: false,
      checkinObrigatorio: false,
      salaNome: "Studio Recovery",
      local: "Sala 1",
      instrutorNome: "Professora Nanda",
      origemTipo: "OCORRENCIA_AVULSA",
      ocorrenciaId: "ocorrencia-yoga-1",
      definicaoHorario: "SOB_DEMANDA",
    },
  ];

  const matriculas: MatriculaSeed[] = alunos.map((aluno, index) => ({
    id: `matricula-reservas-${index + 1}`,
    tenantId: tenant.id,
    alunoId: aluno.id,
    planoId: "plano-spinning",
    dataInicio: "2026-03-01",
    dataFim: "2026-03-31",
    valorPago: 189.9,
    valorMatricula: 0,
    desconto: 0,
    formaPagamento: "PIX",
    status: "ATIVA",
    renovacaoAutomatica: true,
    contratoStatus: "ASSINADO",
    contratoModoAssinatura: "DIGITAL",
    contratoAssinadoEm: "2026-03-01T09:00:00",
    dataCriacao: "2026-03-01T09:00:00",
  }));

  let reservaCounter = 5;
  let reservas: ReservaSeed[] = [
    {
      id: "reserva-1",
      tenantId: tenant.id,
      sessaoId: "sessao-spinning-2026-03-12",
      atividadeGradeId: "grade-spinning",
      atividadeId: "atividade-spinning",
      atividadeNome: "Spinning",
      alunoId: "al-demo-001",
      alunoNome: "Fernanda Portal",
      data: "2026-03-12",
      horaInicio: "18:00",
      horaFim: "19:00",
      origem: "PORTAL_CLIENTE",
      status: "CONFIRMADA",
      local: "Sala 2",
      instrutorNome: "Professor Caio",
      dataCriacao: "2026-03-12T08:00:00",
    },
    {
      id: "reserva-2",
      tenantId: tenant.id,
      sessaoId: "sessao-spinning-2026-03-12",
      atividadeGradeId: "grade-spinning",
      atividadeId: "atividade-spinning",
      atividadeNome: "Spinning",
      alunoId: "al-demo-002",
      alunoNome: "Bianca Rocha",
      data: "2026-03-12",
      horaInicio: "18:00",
      horaFim: "19:00",
      origem: "BACKOFFICE",
      status: "CONFIRMADA",
      local: "Sala 2",
      instrutorNome: "Professor Caio",
      dataCriacao: "2026-03-12T08:05:00",
    },
    {
      id: "reserva-3",
      tenantId: tenant.id,
      sessaoId: "sessao-spinning-2026-03-12",
      atividadeGradeId: "grade-spinning",
      atividadeId: "atividade-spinning",
      atividadeNome: "Spinning",
      alunoId: "al-demo-004",
      alunoNome: "Rafael Rodrigues 4",
      data: "2026-03-12",
      horaInicio: "18:00",
      horaFim: "19:00",
      origem: "BACKOFFICE",
      status: "LISTA_ESPERA",
      posicaoListaEspera: 1,
      local: "Sala 2",
      instrutorNome: "Professor Caio",
      dataCriacao: "2026-03-12T08:10:00",
    },
    {
      id: "reserva-4",
      tenantId: tenant.id,
      sessaoId: "sessao-spinning-2026-03-12",
      atividadeGradeId: "grade-spinning",
      atividadeId: "atividade-spinning",
      atividadeNome: "Spinning",
      alunoId: "al-demo-010",
      alunoNome: "Joana Espera 10",
      data: "2026-03-12",
      horaInicio: "18:00",
      horaFim: "19:00",
      origem: "PORTAL_CLIENTE",
      status: "LISTA_ESPERA",
      posicaoListaEspera: 2,
      local: "Sala 2",
      instrutorNome: "Professor Caio",
      dataCriacao: "2026-03-12T08:15:00",
    },
  ];

  function activeReservationsForSession(sessaoId: string) {
    return reservas.filter((item) => item.sessaoId === sessaoId && item.status !== "CANCELADA");
  }

  function recalculateWaitlistPositions(sessaoId: string) {
    const waitlist = reservas
      .filter((item) => item.sessaoId === sessaoId && item.status === "LISTA_ESPERA")
      .sort((left, right) => left.dataCriacao.localeCompare(right.dataCriacao));
    waitlist.forEach((item, index) => {
      item.posicaoListaEspera = index + 1;
    });
  }

  function buildSessao(seed: AulaSessaoSeed) {
    const activeRows = activeReservationsForSession(seed.id);
    const confirmadas = activeRows.filter((item) => item.status === "CONFIRMADA" || item.status === "CHECKIN");
    const waitlist = activeRows.filter((item) => item.status === "LISTA_ESPERA");
    return {
      ...seed,
      vagasOcupadas: confirmadas.length,
      vagasDisponiveis: Math.max(0, seed.capacidade - confirmadas.length),
      waitlistTotal: waitlist.length,
    };
  }

  function buildOcupacao(sessaoId: string) {
    const sessao = buildSessao(sessoes.find((item) => item.id === sessaoId) ?? sessoes[0]);
    const activeRows = activeReservationsForSession(sessao.id);
    const confirmadas = activeRows.filter((item) => item.status === "CONFIRMADA" || item.status === "CHECKIN");
    const waitlist = activeRows
      .filter((item) => item.status === "LISTA_ESPERA")
      .sort((left, right) => (left.posicaoListaEspera ?? 0) - (right.posicaoListaEspera ?? 0));
    const canceladas = reservas.filter((item) => item.sessaoId === sessao.id && item.status === "CANCELADA");

    return {
      sessao,
      confirmadas,
      waitlist,
      canceladas,
      checkinsRealizados: confirmadas.filter((item) => item.status === "CHECKIN").length,
    };
  }

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizeApiPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-admin",
        nome: "Sergio",
        email: "admin@academia.local",
        roles: ["OWNER", "ADMIN"],
        activeTenantId: currentTenantId,
        availableTenants: [{ tenantId: currentTenantId, defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: tenant,
        unidadesDisponiveis: [tenant],
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      currentTenantId = path.split("/").at(-1) ?? currentTenantId;
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: tenant,
        unidadesDisponiveis: [tenant],
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, academia);
      return;
    }

    if (path === "/api/v1/comercial/alunos" && method === "GET") {
      const search = url.searchParams.get("search")?.trim().toLowerCase();
      const filteredAlunos = search
        ? alunos.filter((aluno) => {
            const haystack = [aluno.nome, aluno.cpf, aluno.email, aluno.telefone]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            return haystack.includes(search);
          })
        : alunos;
      const totaisStatus = {
        total: alunos.length,
        ativos: alunos.length,
        suspensos: 0,
        inativos: 0,
        cancelados: 0,
      };
      await fulfillJson(route, {
        items: filteredAlunos,
        page: Number(url.searchParams.get("page") ?? 0),
        size: Number(url.searchParams.get("size") ?? filteredAlunos.length),
        hasNext: false,
        totaisStatus,
      });
      return;
    }

    if ((path === "/api/v1/comercial/adesoes" || path === "/api/v1/comercial/matriculas") && method === "GET") {
      await fulfillJson(route, matriculas);
      return;
    }

    if (path === "/api/v1/administrativo/atividades" && method === "GET") {
      await fulfillJson(route, atividades);
      return;
    }

    if (path === "/api/v1/agenda/aulas/sessoes" && method === "GET") {
      await fulfillJson(route, sessoes.map(buildSessao));
      return;
    }

    if (/^\/api\/v1\/agenda\/aulas\/sessoes\/[^/]+\/ocupacao$/.test(path) && method === "GET") {
      const sessaoId = path.split("/").at(-2) ?? "";
      await fulfillJson(route, buildOcupacao(sessaoId));
      return;
    }

    if (path === "/api/v1/agenda/aulas/reservas" && method === "GET") {
      const sessaoId = url.searchParams.get("sessaoId")?.trim();
      const alunoId = url.searchParams.get("alunoId")?.trim();
      const status = url.searchParams.get("status")?.trim();
      let rows = reservas;
      if (sessaoId) rows = rows.filter((item) => item.sessaoId === sessaoId);
      if (alunoId) rows = rows.filter((item) => item.alunoId === alunoId);
      if (status) rows = rows.filter((item) => item.status === status);
      await fulfillJson(route, rows);
      return;
    }

    if (path === "/api/v1/agenda/aulas/reservas" && method === "POST") {
      const payload = parseBody<{
        atividadeGradeId: string;
        data: string;
        alunoId: string;
        origem: "BACKOFFICE" | "PORTAL_CLIENTE";
      }>(request);
      const sessao = sessoes.find(
        (item) => item.atividadeGradeId === payload.atividadeGradeId && item.data === payload.data,
      );
      const aluno = alunos.find((item) => item.id === payload.alunoId);
      if (!sessao || !aluno) {
        await fulfillJson(route, { message: "Sessão ou aluno não encontrado" }, 404);
        return;
      }
      const current = buildSessao(sessao);
      const status =
        current.vagasDisponiveis > 0
          ? "CONFIRMADA"
          : sessao.listaEsperaHabilitada
            ? "LISTA_ESPERA"
            : "CANCELADA";
      const reserva: ReservaSeed = {
        id: `reserva-${reservaCounter++}`,
        tenantId: sessao.tenantId,
        sessaoId: sessao.id,
        atividadeGradeId: sessao.atividadeGradeId,
        atividadeId: sessao.atividadeId,
        atividadeNome: sessao.atividadeNome,
        alunoId: aluno.id,
        alunoNome: aluno.nome,
        data: sessao.data,
        horaInicio: sessao.horaInicio,
        horaFim: sessao.horaFim,
        origem: payload.origem,
        status,
        local: sessao.local,
        instrutorNome: sessao.instrutorNome,
        dataCriacao: `2026-03-12T10:${String(reservaCounter).padStart(2, "0")}:00`,
      };
      reservas = [...reservas, reserva];
      recalculateWaitlistPositions(sessao.id);
      const created = reservas.find((item) => item.id === reserva.id) ?? reserva;
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/agenda\/aulas\/reservas\/[^/]+\/cancelar$/.test(path) && method === "POST") {
      const reservaId = path.split("/").at(-2) ?? "";
      reservas = reservas.map((item) =>
        item.id === reservaId
          ? {
              ...item,
              status: "CANCELADA",
              canceladaEm: nowIso(),
              dataAtualizacao: nowIso(),
            }
          : item,
      );
      const updated = reservas.find((item) => item.id === reservaId);
      if (updated) {
        recalculateWaitlistPositions(updated.sessaoId);
      }
      await fulfillJson(route, updated ?? { message: "Reserva não encontrada" }, updated ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/agenda\/aulas\/sessoes\/[^/]+\/promover-waitlist$/.test(path) && method === "POST") {
      const sessaoId = path.split("/").at(-2) ?? "";
      const sessao = sessoes.find((item) => item.id === sessaoId);
      const occupancy = sessao ? buildSessao(sessao) : null;
      const candidate = reservas
        .filter((item) => item.sessaoId === sessaoId && item.status === "LISTA_ESPERA")
        .sort((left, right) => (left.posicaoListaEspera ?? 0) - (right.posicaoListaEspera ?? 0))[0];

      if (!sessao || !candidate || !occupancy || occupancy.vagasDisponiveis <= 0) {
        await fulfillJson(route, null);
        return;
      }

      reservas = reservas.map((item) =>
        item.id === candidate.id
          ? {
              ...item,
              status: "CONFIRMADA",
              posicaoListaEspera: undefined,
              dataAtualizacao: nowIso(),
            }
          : item,
      );
      recalculateWaitlistPositions(sessaoId);
      await fulfillJson(route, reservas.find((item) => item.id === candidate.id) ?? null);
      return;
    }

    if (/^\/api\/v1\/agenda\/aulas\/reservas\/[^/]+\/checkin$/.test(path) && method === "POST") {
      const reservaId = path.split("/").at(-2) ?? "";
      reservas = reservas.map((item) =>
        item.id === reservaId
          ? {
              ...item,
              status: "CHECKIN",
              checkinEm: nowIso(),
              dataAtualizacao: nowIso(),
            }
          : item,
      );
      const updated = reservas.find((item) => item.id === reservaId);
      await fulfillJson(route, updated ?? { message: "Reserva não encontrada" }, updated ? 200 : 404);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

type AdminCargoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  ativo: boolean;
};

type AdminFuncionarioSeed = {
  id: string;
  tenantId: string;
  nome: string;
  nomeRegistro?: string;
  apelido?: string;
  cpf?: string;
  rg?: string;
  dataNascimento?: string;
  cargoId?: string;
  cargo?: string;
  emailProfissional?: string;
  emailPessoal?: string;
  celular?: string;
  telefone?: string;
  ativo: boolean;
  podeMinistrarAulas: boolean;
  permiteCatraca?: boolean;
  permiteForaHorario?: boolean;
  utilizaTecladoAcesso?: boolean;
  bloqueiaAcessoSistema?: boolean;
  coordenador?: boolean;
  alertaFuncionarios?: boolean;
  statusOperacional?: "ATIVO" | "BLOQUEADO" | "INATIVO" | "DESLIGADO";
  statusAcesso?: "SEM_ACESSO" | "ATIVO" | "CONVITE_PENDENTE" | "PRIMEIRO_ACESSO" | "BLOQUEADO";
  origemCadastro?: "MANUAL" | "IMPORTADO_EVO" | "CONVITE" | "SINCRONIZADO";
  possuiAcessoSistema?: boolean;
  provisionamentoAcesso?: "SEM_ACESSO" | "CONVITE" | "REUTILIZAR_USUARIO";
  tenantBaseId?: string;
  tenantBaseNome?: string;
  perfilAcessoInicialId?: string;
  perfilAcessoInicialNome?: string;
  memberships?: Array<{
    tenantId: string;
    tenantNome: string;
    roleName?: string;
    roleDisplayName?: string;
    defaultTenant?: boolean;
    active?: boolean;
    accessOrigin?: "MANUAL" | "HERDADO_POLITICA";
  }>;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    bairro?: string;
  };
  emergencia?: {
    nomeResponsavel?: string;
    telefoneResponsavel?: string;
  };
  contratacao?: {
    tipo?: "CLT" | "PJ" | "ESTAGIO" | "AUTONOMO" | "HORISTA" | "OUTRO";
    dataAdmissao?: string;
    dataDemissao?: string;
    cargoContratual?: string;
    salarioAtual?: number;
    banco?: string;
    agencia?: string;
    conta?: string;
  };
  horarios?: Array<{
    diaSemana: "SEG" | "TER" | "QUA" | "QUI" | "SEX" | "SAB" | "DOM";
    horaInicio?: string;
    horaFim?: string;
    permiteForaHorario?: boolean;
    ativo?: boolean;
  }>;
  observacoes?: string;
  informacoesInternas?: string;
  notificacoes?: {
    email?: boolean;
    whatsapp?: boolean;
    pendenciasOperacionais?: boolean;
    escala?: boolean;
  };
};

type AdminServicoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  sku?: string;
  categoria?: string;
  descricao?: string;
  sessoes?: number;
  valor: number;
  custo?: number;
  duracaoMinutos?: number;
  validadeDias?: number;
  comissaoPercentual?: number;
  aliquotaImpostoPercentual?: number;
  permiteDesconto: boolean;
  tipoCobranca: "UNICO" | "RECORRENTE";
  recorrenciaDias?: number;
  agendavel: boolean;
  permiteAcessoCatraca: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
};

type AdminProdutoSeed = {
  id: string;
  tenantId: string;
  nome: string;
  sku: string;
  codigoBarras?: string;
  categoria?: string;
  marca?: string;
  unidadeMedida: "UN" | "KG" | "G" | "L" | "ML" | "CX";
  descricao?: string;
  valorVenda: number;
  custo?: number;
  comissaoPercentual?: number;
  aliquotaImpostoPercentual?: number;
  controlaEstoque: boolean;
  estoqueAtual: number;
  estoqueMinimo?: number;
  permiteDesconto: boolean;
  permiteVoucher: boolean;
  ativo: boolean;
};

type AdminConvenioSeed = {
  id: string;
  tenantId: string;
  nome: string;
  descontoPercentual: number;
  planoIds?: string[];
  observacoes?: string;
  ativo: boolean;
};

type AdminVoucherSeed = {
  id: string;
  tenantId: string;
  escopo: "UNIDADE" | "GRUPO";
  tipo: "DESCONTO" | "ACESSO" | "SESSAO";
  nome: string;
  periodoInicio: string;
  periodoFim?: string;
  prazoDeterminado: boolean;
  quantidade?: number;
  ilimitado: boolean;
  codigoTipo: "UNICO" | "ALEATORIO";
  codigoUnicoCustom?: string;
  usarNaVenda: boolean;
  planoIds: string[];
  umaVezPorCliente: boolean;
  aplicarEm: Array<"CONTRATO" | "ANUIDADE">;
  ativo: boolean;
};

type AdminVoucherCodigoSeed = {
  id: string;
  voucherId: string;
  codigo: string;
  status: "DISPONIVEL" | "UTILIZADO";
};

type AdminTipoContaSeed = {
  id: string;
  tenantId: string;
  nome: string;
  descricao?: string;
  categoriaOperacional:
    | "FOLHA"
    | "ALUGUEL"
    | "UTILIDADES"
    | "IMPOSTOS"
    | "MARKETING"
    | "MANUTENCAO"
    | "FORNECEDORES"
    | "OUTROS";
  grupoDre:
    | "CUSTO_VARIAVEL"
    | "DESPESA_OPERACIONAL"
    | "DESPESA_FINANCEIRA"
    | "IMPOSTOS";
  centroCustoPadrao?: string;
  ativo: boolean;
};

type AdminContaBancariaSeed = {
  id: string;
  tenantId: string;
  apelido: string;
  banco: string;
  agencia: string;
  conta: string;
  digito: string;
  tipo: "CORRENTE" | "POUPANCA" | "PAGAMENTO";
  titular: string;
  pixChave?: string;
  pixTipo?: "CPF" | "CNPJ" | "EMAIL" | "TELEFONE" | "CHAVE_ALEATORIA" | "OUTRA";
  statusCadastro: "ATIVA" | "INATIVA";
};

type AdminMaquininhaSeed = {
  id: string;
  tenantId: string;
  nome: string;
  adquirente: "STONE" | "CIELO" | "REDE" | "GETNET" | "PAGARME_POS" | "OUTROS";
  terminal: string;
  contaBancariaId: string;
  statusCadastro: "ATIVA" | "INATIVA";
};

type AdminOnboardingSeed = {
  tenantId: string;
  academiaId?: string;
  estrategia: "CARGA_INICIAL" | "IMPORTAR_DEPOIS" | "PREPARAR_ETL";
  status: "PENDENTE_SEED" | "AGUARDANDO_IMPORTACAO" | "EM_IMPORTACAO" | "PRONTA" | "ERRO";
  evoFilialId?: string;
  ultimaMensagem?: string;
};

type E2EAuthProfileSeed = {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  availableScopes: Array<"GLOBAL" | "REDE" | "UNIDADE">;
  broadAccess?: boolean;
};

type ProvisionedAdminAccountSeed = {
  id: string;
  tenantId: string;
  academiaId: string;
  nome: string;
  email: string;
  password: string;
  temporaryPassword: string;
  forcePasswordChange: boolean;
};

type OnboardingChecklistProgressSeed = {
  academiaConfigurada: boolean;
  planoCriado: boolean;
};

type AdminSecurityMembershipState = {
  id: string;
  tenantId: string;
  active: boolean;
  defaultTenant: boolean;
  accessOrigin: "MANUAL" | "HERDADO_POLITICA" | "PERFIL_ADMIN";
  inheritedFrom?: string;
  profiles: string[];
};

type AdminSecurityPolicyState = {
  enabled: boolean;
  scope: "ACADEMIA_ATUAL" | "REDE";
  academiaIds?: string[];
  inherited: boolean;
  rationale?: string;
  updatedAt?: string;
};

type AdminSecurityUserState = {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  active: boolean;
  createdAt?: string;
  lastLoginAt?: string;
  memberships: AdminSecurityMembershipState[];
  policy: AdminSecurityPolicyState;
};

export async function installAdminCrudApiMocks(page: Page) {
  let academias: TenantSeed[] = [
    {
      id: "academia-rede-principal",
      academiaId: "academia-rede-principal",
      groupId: "academia-rede-principal",
      nome: "Conceito Fit",
      razaoSocial: "Conceito Fit Academia LTDA",
      documento: "12.345.678/0001-90",
      subdomain: "conceito-fit",
      email: "contato@conceitofit.local",
      telefone: "(21) 3000-1000",
      ativo: true,
      branding: {
        appName: "Conceito Fit",
        themePreset: "premium",
        useCustomColors: false,
      },
    },
    {
      id: "academia-rede-leste",
      academiaId: "academia-rede-leste",
      groupId: "academia-rede-leste",
      nome: "Conceito Fit Leste",
      razaoSocial: "Conceito Fit Leste LTDA",
      documento: "98.765.432/0001-10",
      subdomain: "conceito-fit-leste",
      email: "leste@conceitofit.local",
      telefone: "(11) 3111-2000",
      ativo: true,
      branding: {
        appName: "Conceito Fit Leste",
        themePreset: "corporate",
        useCustomColors: false,
      },
    },
  ];

  let unidades: TenantSeed[] = [
    {
      id: "tenant-centro",
      academiaId: "academia-rede-principal",
      groupId: "academia-rede-principal",
      nome: "Unidade Centro",
      razaoSocial: "Conceito Fit Centro LTDA",
      documento: "12.345.678/0002-70",
      subdomain: "centro",
      email: "centro@conceitofit.local",
      telefone: "(21) 98888-1001",
      ativo: true,
      branding: {
        appName: "Conceito Fit Centro",
        themePreset: "premium",
        useCustomColors: false,
      },
    },
    {
      id: "tenant-barra",
      academiaId: "academia-rede-principal",
      groupId: "academia-rede-principal",
      nome: "Unidade Barra",
      razaoSocial: "Conceito Fit Barra LTDA",
      documento: "12.345.678/0003-51",
      subdomain: "barra",
      email: "barra@conceitofit.local",
      telefone: "(21) 97777-2002",
      ativo: true,
      branding: {
        appName: "Conceito Fit Barra",
        themePreset: "premium",
        useCustomColors: false,
      },
    },
    {
      id: "tenant-vila-maria",
      academiaId: "academia-rede-leste",
      groupId: "academia-rede-leste",
      nome: "Unidade Vila Maria",
      razaoSocial: "Conceito Fit Vila Maria LTDA",
      documento: "98.765.432/0002-91",
      subdomain: "vila-maria",
      email: "vila-maria@conceitofit.local",
      telefone: "(11) 96666-3003",
      ativo: true,
      branding: {
        appName: "Conceito Fit Vila Maria",
        themePreset: "corporate",
        useCustomColors: false,
      },
    },
  ];

  let currentTenantId = "tenant-centro";

  const planosByTenant = new Map<string, PlanoSeed[]>([
    [
      "tenant-centro",
      [
        {
          id: "plano-centro-premium",
          tenantId: "tenant-centro",
          nome: "Plano Premium Centro",
          descricao: "Acesso livre às áreas molhadas e musculação.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 199.9,
          valorMatricula: 49.9,
          destaque: true,
          ativo: true,
          ordem: 1,
          beneficios: ["Musculação", "Bike indoor"],
        },
        {
          id: "plano-centro-smart",
          tenantId: "tenant-centro",
          nome: "Plano Smart Centro",
          descricao: "Plano enxuto para o horário comercial.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 139.9,
          valorMatricula: 29.9,
          ativo: true,
          ordem: 2,
          beneficios: ["Musculação"],
        },
      ],
    ],
    [
      "tenant-barra",
      [
        {
          id: "plano-barra-gold",
          tenantId: "tenant-barra",
          nome: "Plano Gold Barra",
          descricao: "Plano com aulas coletivas premium.",
          tipo: "MENSAL",
          duracaoDias: 30,
          valor: 229.9,
          valorMatricula: 59.9,
          destaque: true,
          ativo: true,
          ordem: 1,
          beneficios: ["Musculação", "Pilates solo"],
        },
      ],
    ],
  ]);

  let onboarding: AdminOnboardingSeed[] = [
    {
      tenantId: "tenant-centro",
      academiaId: "academia-rede-principal",
      estrategia: "IMPORTAR_DEPOIS",
      status: "PRONTA",
      evoFilialId: "101",
      ultimaMensagem: "Seed inicial concluído.",
    },
    {
      tenantId: "tenant-barra",
      academiaId: "academia-rede-principal",
      estrategia: "PREPARAR_ETL",
      status: "AGUARDANDO_IMPORTACAO",
      evoFilialId: "202",
    },
    {
      tenantId: "tenant-vila-maria",
      academiaId: "academia-rede-leste",
      estrategia: "CARGA_INICIAL",
      status: "PENDENTE_SEED",
      evoFilialId: "303",
    },
  ];

  let cargos: AdminCargoSeed[] = [
    { id: "cargo-recepcao", tenantId: "tenant-centro", nome: "Recepção", ativo: true },
    { id: "cargo-coordenacao", tenantId: "tenant-centro", nome: "Coordenação", ativo: true },
  ];

  let funcionarios: AdminFuncionarioSeed[] = [
    {
      id: "funcionario-lucia",
      tenantId: "tenant-centro",
      nome: "Lúcia Souza",
      nomeRegistro: "Lúcia Souza",
      apelido: "Lúcia",
      cpf: "111.222.333-44",
      cargoId: "cargo-recepcao",
      cargo: "Recepção",
      emailProfissional: "lucia@academia.local",
      celular: "(21) 99888-7766",
      ativo: true,
      podeMinistrarAulas: false,
      permiteCatraca: true,
      permiteForaHorario: false,
      utilizaTecladoAcesso: false,
      bloqueiaAcessoSistema: false,
      coordenador: false,
      statusOperacional: "ATIVO",
      statusAcesso: "ATIVO",
      origemCadastro: "MANUAL",
      possuiAcessoSistema: true,
      provisionamentoAcesso: "REUTILIZAR_USUARIO",
      tenantBaseId: "tenant-centro",
      tenantBaseNome: "Unidade Centro",
      perfilAcessoInicialId: "perfil-admin",
      perfilAcessoInicialNome: "Administrador",
      memberships: [
        {
          tenantId: "tenant-centro",
          tenantNome: "Unidade Centro",
          roleName: "ADMIN",
          roleDisplayName: "Administrador",
          defaultTenant: true,
          active: true,
          accessOrigin: "MANUAL",
        },
        {
          tenantId: "tenant-barra",
          tenantNome: "Unidade Barra",
          roleName: "GERENTE",
          roleDisplayName: "Gerente",
          defaultTenant: false,
          active: true,
          accessOrigin: "MANUAL",
        },
      ],
      endereco: {
        cep: "20000-000",
        logradouro: "Rua das Flores",
        numero: "200",
        bairro: "Centro",
      },
      emergencia: {
        nomeResponsavel: "Marta Souza",
        telefoneResponsavel: "(21) 97777-3344",
      },
      contratacao: {
        tipo: "CLT",
        dataAdmissao: "2025-01-10",
        cargoContratual: "Recepcionista líder",
        salarioAtual: 3200,
        banco: "Banco do Brasil",
        agencia: "1234",
        conta: "445566-7",
      },
      horarios: [
        { diaSemana: "SEG", horaInicio: "08:00", horaFim: "17:00", ativo: true },
        { diaSemana: "TER", horaInicio: "08:00", horaFim: "17:00", ativo: true },
        { diaSemana: "QUA", horaInicio: "08:00", horaFim: "17:00", ativo: true },
      ],
      observacoes: "Responsável pela abertura da unidade.",
      informacoesInternas: "Acompanha indicadores de recepção.",
      notificacoes: {
        email: true,
        whatsapp: false,
        pendenciasOperacionais: true,
        escala: true,
      },
    },
  ];

  let servicos: AdminServicoSeed[] = [
    {
      id: "servico-avaliacao",
      tenantId: "tenant-centro",
      nome: "Avaliação física",
      sku: "SERV-AVAL",
      categoria: "Saúde",
      descricao: "Avaliação física completa.",
      sessoes: 1,
      valor: 79.9,
      custo: 15,
      duracaoMinutos: 50,
      validadeDias: 30,
      comissaoPercentual: 10,
      aliquotaImpostoPercentual: 4,
      permiteDesconto: true,
      tipoCobranca: "UNICO",
      agendavel: true,
      permiteAcessoCatraca: false,
      permiteVoucher: true,
      ativo: true,
    },
  ];

  let produtos: AdminProdutoSeed[] = [
    {
      id: "produto-whey",
      tenantId: "tenant-centro",
      nome: "Whey Protein",
      sku: "WHEY-900",
      categoria: "Suplementos",
      marca: "Conceito Labs",
      unidadeMedida: "UN",
      descricao: "Pote 900g.",
      valorVenda: 149.9,
      custo: 92,
      comissaoPercentual: 8,
      aliquotaImpostoPercentual: 12,
      controlaEstoque: true,
      estoqueAtual: 18,
      estoqueMinimo: 5,
      permiteDesconto: true,
      permiteVoucher: false,
      ativo: true,
    },
  ];

  let convenios: AdminConvenioSeed[] = [
    {
      id: "convenio-empresa-x",
      tenantId: "tenant-centro",
      nome: "Empresa X",
      descontoPercentual: 12,
      planoIds: ["plano-centro-premium"],
      observacoes: "Ativo para contratos corporativos.",
      ativo: true,
    },
  ];

  let vouchers: AdminVoucherSeed[] = [
    {
      id: "voucher-inverno",
      tenantId: "tenant-centro",
      escopo: "UNIDADE",
      tipo: "DESCONTO",
      nome: "Campanha de Inverno",
      periodoInicio: "2026-03-01",
      periodoFim: "2026-04-01",
      prazoDeterminado: true,
      quantidade: 50,
      ilimitado: false,
      codigoTipo: "UNICO",
      codigoUnicoCustom: "INVERNO26",
      usarNaVenda: true,
      planoIds: ["plano-centro-premium"],
      umaVezPorCliente: true,
      aplicarEm: ["CONTRATO"],
      ativo: true,
    },
  ];

  const voucherCodigosByVoucher = new Map<string, AdminVoucherCodigoSeed[]>([
    [
      "voucher-inverno",
      [
        { id: "voucher-codigo-1", voucherId: "voucher-inverno", codigo: "INVERNO26", status: "DISPONIVEL" },
      ],
    ],
  ]);

  let formasPagamento: FormaPagamentoSeed[] = [
    {
      id: "fp-pix-centro",
      tenantId: "tenant-centro",
      nome: "PIX imediato",
      tipo: "PIX",
      ativo: true,
      parcelasMax: 1,
      taxaPercentual: 0,
    },
  ];

  const formaPagamentoExtras = new Map<string, { emitirAutomaticamente: boolean; instrucoes?: string }>([
    ["fp-pix-centro", { emitirAutomaticamente: false, instrucoes: "Confirmar comprovante." }],
  ]);

  let tiposConta: AdminTipoContaSeed[] = [
    {
      id: "tipo-energia",
      tenantId: "tenant-centro",
      nome: "Energia elétrica",
      descricao: "Conta mensal da concessionária.",
      categoriaOperacional: "UTILIDADES",
      grupoDre: "DESPESA_OPERACIONAL",
      centroCustoPadrao: "Operacional",
      ativo: true,
    },
  ];

  let contasBancarias: AdminContaBancariaSeed[] = [
    {
      id: "conta-principal",
      tenantId: "tenant-centro",
      apelido: "Conta principal",
      banco: "Banco do Brasil",
      agencia: "0001",
      conta: "12345",
      digito: "6",
      tipo: "CORRENTE",
      titular: "Conceito Fit Academia LTDA",
      pixChave: "financeiro@conceitofit.local",
      pixTipo: "EMAIL",
      statusCadastro: "ATIVA",
    },
  ];

  let maquininhas: AdminMaquininhaSeed[] = [
    {
      id: "maquininha-stone-1",
      tenantId: "tenant-centro",
      nome: "Stone recepção",
      adquirente: "STONE",
      terminal: "STONE-01",
      contaBancariaId: "conta-principal",
      statusCadastro: "ATIVA",
    },
  ];

  let atividades: Array<AtividadeSeed & { descricao?: string; icone?: string; cor?: string; permiteCheckin?: boolean; checkinObrigatorio?: boolean }> = [
    {
      id: "atividade-musculacao",
      tenantId: "tenant-centro",
      nome: "Musculação",
      categoria: "MUSCULACAO",
      ativo: true,
      descricao: "Treino livre na sala de musculação.",
      icone: "dumbbell",
      cor: "#3de8a0",
      permiteCheckin: true,
      checkinObrigatorio: false,
    },
  ];

  const salas = [
    {
      id: "sala-principal",
      tenantId: "tenant-centro",
      nome: "Sala Principal",
      descricao: "Espaço principal para aulas coletivas.",
      capacidadePadrao: 20,
      ativo: true,
    },
  ];

  let atividadesGrade = [
    {
      id: "atividade-grade-musculacao",
      tenantId: "tenant-centro",
      atividadeId: "atividade-musculacao",
      salaId: "sala-principal",
      funcionarioId: undefined,
      diasSemana: ["SEG", "QUA", "SEX"],
      definicaoHorario: "PREVIAMENTE" as const,
      horaInicio: "07:00",
      horaFim: "08:00",
      capacidade: 20,
      checkinLiberadoMinutosAntes: 60,
      duracaoMinutos: 60,
      codigo: "MUSC-SEG",
      grupoAtividades: "Musculação",
      publico: "Adulto",
      dificuldade: 2 as const,
      descricaoAgenda: "Treino livre na sala principal.",
      acessoClientes: "TODOS_CLIENTES" as const,
      permiteReserva: true,
      limitarVagasAgregadores: false,
      exibirWellhub: false,
      permitirSaidaAntesInicio: false,
      permitirEscolherNumeroVaga: false,
      exibirNoAppCliente: true,
      exibirNoAutoatendimento: false,
      exibirNoWodTv: false,
      finalizarAtividadeAutomaticamente: true,
      desabilitarListaEspera: false,
      local: "Sala Principal",
      instrutor: undefined,
      ativo: true,
    },
  ];

  const profileCatalog = [
    {
      id: "perfil-owner",
      roleName: "OWNER",
      displayName: "OWNER",
      active: true,
    },
    {
      id: "perfil-financeiro",
      roleName: "FINANCEIRO",
      displayName: "FINANCEIRO",
      active: true,
    },
    {
      id: "perfil-operacoes",
      roleName: "OPERACOES",
      displayName: "OPERACOES",
      active: true,
    },
  ];

  let securityUsers: AdminSecurityUserState[] = [
    {
      id: "user-admin-global",
      name: "Sergio",
      fullName: "Sergio Amim",
      email: "admin@academia.local",
      active: true,
      createdAt: "2026-01-05T10:00:00",
      lastLoginAt: "2026-03-12T09:00:00",
      memberships: [
        {
          id: "membership-centro",
          tenantId: "tenant-centro",
          active: true,
          defaultTenant: true,
          accessOrigin: "MANUAL",
          profiles: ["perfil-owner"],
        },
      ],
      policy: {
        enabled: true,
        scope: "ACADEMIA_ATUAL",
        academiaIds: ["academia-rede-principal"],
        inherited: false,
        rationale: "Diretoria regional da rede principal.",
        updatedAt: "2026-03-12T09:00:00",
      },
    },
    {
      id: "user-financeiro-leste",
      name: "Priscila",
      fullName: "Priscila Mota",
      email: "priscila@academia.local",
      active: true,
      createdAt: "2026-01-12T10:00:00",
      lastLoginAt: "2026-03-10T08:30:00",
      memberships: [
        {
          id: "membership-leste",
          tenantId: "tenant-vila-maria",
          active: true,
          defaultTenant: true,
          accessOrigin: "MANUAL",
          profiles: ["perfil-financeiro"],
        },
      ],
      policy: {
        enabled: false,
        scope: "ACADEMIA_ATUAL",
        academiaIds: ["academia-rede-leste"],
        inherited: false,
        rationale: "Escopo restrito à unidade atual.",
        updatedAt: "2026-03-01T12:00:00",
      },
    },
  ];

  const counters = {
    academia: 10,
    plano: 10,
    unidade: 10,
    cargo: 10,
    funcionario: 10,
    servico: 10,
    produto: 10,
    convenio: 10,
    voucher: 10,
    tipoConta: 10,
    conta: 10,
    maquininha: 10,
    atividade: 10,
    membership: 10,
  };

  const onboardingChecklistByTenant = new Map<string, OnboardingChecklistProgressSeed>(
    unidades.map((item) => [
      item.id,
      {
        academiaConfigurada: true,
        planoCriado: true,
      },
    ]),
  );

  let currentAuthProfile: E2EAuthProfileSeed = {
    id: "user-admin-global",
    nome: "Sergio Amim",
    email: "admin@academia.local",
    roles: ["OWNER", "ADMIN"],
    availableScopes: ["GLOBAL"],
    broadAccess: true,
  };

  let provisionedAdminAccounts: ProvisionedAdminAccountSeed[] = [];

  function nextId(prefix: string, counterKey: keyof typeof counters) {
    counters[counterKey] += 1;
    return `${prefix}-${counters[counterKey]}`;
  }

  function slugify(value: string) {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
  }

  function resolveTenantId(url: URL) {
    return url.searchParams.get("tenantId")?.trim() || currentTenantId;
  }

  function getAcademia(academiaId: string) {
    return academias.find((item) => item.id === academiaId);
  }

  function getTenant(tenantId: string) {
    return unidades.find((item) => item.id === tenantId);
  }

  function buildAcademiaPayload(academiaId: string) {
    const unidade = unidades.find((item) => item.academiaId === academiaId);
    const academia = getAcademia(academiaId) ?? academias[0];
    return {
      id: academia.id,
      nome: academia.nome,
      razaoSocial: academia.razaoSocial,
      documento: academia.documento,
      email: academia.email,
      telefone: academia.telefone,
      endereco: unidade
        ? {
            cidade: unidade.nome.includes("Barra") ? "Rio de Janeiro" : "Niterói",
          }
        : undefined,
      branding: academia.branding,
      ativo: academia.ativo,
    };
  }

  function buildActiveAcademiaPayload() {
    const tenant = getTenant(currentTenantId) ?? unidades[0];
    return buildAcademiaPayload(tenant.academiaId);
  }

  function getOnboardingState(tenantId: string) {
    return onboarding.find((item) => item.tenantId === tenantId) ?? null;
  }

  function mergeOnboardingState(state: AdminOnboardingSeed) {
    onboarding = [state, ...onboarding.filter((item) => item.tenantId !== state.tenantId)];
    return state;
  }

  function getCurrentVisibleTenants() {
    const account = provisionedAdminAccounts.find((item) => item.email === currentAuthProfile.email);
    if (!account) {
      return unidades;
    }

    return unidades.filter((item) => item.id === account.tenantId);
  }

  function getCurrentActiveTenant() {
    return getCurrentVisibleTenants().find((item) => item.id === currentTenantId) ?? getCurrentVisibleTenants()[0] ?? unidades[0];
  }

  function buildAvailableTenantsPayload() {
    const activeTenantId = getCurrentActiveTenant()?.id ?? currentTenantId;
    return getCurrentVisibleTenants().map((item) => ({
      tenantId: item.id,
      defaultTenant: item.id === activeTenantId,
    }));
  }

  function buildLoginResponse(forcePasswordChange = false) {
    const activeTenantId = getCurrentActiveTenant()?.id ?? currentTenantId;
    currentTenantId = activeTenantId;
    const authSession = buildE2EAuthSession({
      activeTenantId,
      preferredTenantId: activeTenantId,
      baseTenantId: activeTenantId,
      availableTenants: buildAvailableTenantsPayload(),
      userId: currentAuthProfile.id,
      userKind: "COLABORADOR",
      displayName: currentAuthProfile.nome,
      roles: currentAuthProfile.roles,
      availableScopes: currentAuthProfile.availableScopes,
      broadAccess: currentAuthProfile.broadAccess ?? false,
      forcePasswordChangeRequired: forcePasswordChange,
    });

    return {
      token: authSession.token,
      refreshToken: authSession.refreshToken,
      type: authSession.type,
      userId: currentAuthProfile.id,
      displayName: currentAuthProfile.nome,
      activeTenantId,
      availableTenants: buildAvailableTenantsPayload(),
      availableScopes: currentAuthProfile.availableScopes,
      broadAccess: currentAuthProfile.broadAccess ?? false,
      forcePasswordChange,
    };
  }

  function getOnboardingChecklistProgress(tenantId: string) {
    const current = onboardingChecklistByTenant.get(tenantId);
    if (current) {
      return current;
    }

    const initial = {
      academiaConfigurada: true,
      planoCriado: true,
    };
    onboardingChecklistByTenant.set(tenantId, initial);
    return initial;
  }

  function updateOnboardingChecklistProgress(
    tenantId: string,
    changes: Partial<OnboardingChecklistProgressSeed>,
  ) {
    const current = getOnboardingChecklistProgress(tenantId);
    const next = {
      ...current,
      ...changes,
    };
    onboardingChecklistByTenant.set(tenantId, next);
    return next;
  }

  function buildOnboardingStatusPayload(tenantId: string) {
    const progress = getOnboardingChecklistProgress(tenantId);
    const etapas = [
      {
        id: "dados-academia",
        titulo: "Dados da Academia",
        status: progress.academiaConfigurada ? "CONCLUIDA" : "PENDENTE",
        rotaConfiguracao: "/administrativo/academia",
      },
      {
        id: "criar-plano",
        titulo: "Criar Plano",
        status: progress.planoCriado ? "CONCLUIDA" : "PENDENTE",
        rotaConfiguracao: "/planos/novo",
      },
    ];

    const etapasConcluidas = etapas.filter((item) => item.status === "CONCLUIDA").length;
    return {
      percentualConclusao: Math.round((etapasConcluidas / etapas.length) * 100),
      concluido: etapasConcluidas === etapas.length,
      totalEtapas: etapas.length,
      etapasConcluidas,
      etapas,
    };
  }

  function buildAuthPayload() {
    const activeTenantId = getCurrentActiveTenant()?.id ?? currentTenantId;
    currentTenantId = activeTenantId;

    return {
      id: currentAuthProfile.id,
      userId: currentAuthProfile.id,
      nome: currentAuthProfile.nome,
      displayName: currentAuthProfile.nome,
      email: currentAuthProfile.email,
      roles: currentAuthProfile.roles,
      userKind: "COLABORADOR",
      activeTenantId,
      availableTenants: buildAvailableTenantsPayload(),
      availableScopes: currentAuthProfile.availableScopes,
      broadAccess: currentAuthProfile.broadAccess ?? false,
    };
  }

  function buildSessionPayload() {
    return buildLoginResponse(false);
  }

  function normalizeBooleanInput(value: unknown, fallback = false) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
      if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
    }
    if (typeof value === "number") return value === 1;
    return fallback;
  }

  function normalizeNumberInput(value: unknown, fallback = 0) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  function filterActiveItems<T extends { ativo?: boolean }>(items: T[], activeOnly: boolean) {
    return activeOnly ? items.filter((item) => item.ativo !== false) : items;
  }

  function uniqueStrings(values: string[]) {
    return Array.from(new Set(values.filter(Boolean)));
  }

  function buildMembershipPayload(user: AdminSecurityUserState, membership: AdminSecurityMembershipState) {
    const tenant = getTenant(membership.tenantId);
    const academiaId = tenant?.academiaId ?? tenant?.groupId ?? "";
    const academia = getAcademia(academiaId);
    const assignedProfiles = membership.profiles
      .map((perfilId) => profileCatalog.find((profile) => profile.id === perfilId))
      .filter((profile): profile is (typeof profileCatalog)[number] => Boolean(profile))
      .map((profile) => ({
        perfilId: profile.id,
        roleName: profile.roleName,
        displayName: profile.displayName,
        active: true,
        inherited: membership.accessOrigin !== "MANUAL",
      }));

    return {
      id: membership.id,
      userId: user.id,
      tenantId: membership.tenantId,
      tenantName: tenant?.nome ?? membership.tenantId,
      academiaId,
      academiaName: academia?.nome ?? academiaId,
      active: membership.active,
      defaultTenant: membership.defaultTenant,
      accessOrigin: membership.accessOrigin,
      inheritedFrom: membership.inheritedFrom,
      eligibleForNewUnits: user.policy.enabled,
      profiles: assignedProfiles,
      availableProfiles: profileCatalog,
      createdAt: user.createdAt,
      updatedAt: user.policy.updatedAt ?? nowIso(),
    };
  }

  function buildUserDetail(user: AdminSecurityUserState) {
    const memberships = user.memberships.map((membership) => buildMembershipPayload(user, membership));
    const defaultMembership = memberships.find((membership) => membership.defaultTenant);
    const academiasRefs = uniqueStrings(
      memberships.map((membership) => membership.academiaId).filter(Boolean),
    )
      .map((academiaId) => {
        const academia = getAcademia(academiaId);
        return academia ? { id: academia.id, nome: academia.nome } : null;
      })
      .filter((item): item is { id: string; nome: string } => item !== null);
    const perfis = uniqueStrings(
      memberships.flatMap((membership) => membership.profiles.map((profile) => profile.displayName)),
    );

    return {
      id: user.id,
      name: user.name,
      fullName: user.fullName,
      email: user.email,
      status: user.active ? "ATIVO" : "INATIVO",
      active: user.active,
      academias: academiasRefs,
      membershipsAtivos: memberships.filter((membership) => membership.active).length,
      membershipsTotal: memberships.length,
      perfis,
      defaultTenantId: defaultMembership?.tenantId,
      defaultTenantName: defaultMembership?.tenantName,
      eligibleForNewUnits: user.policy.enabled,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      memberships,
      policy: {
        enabled: user.policy.enabled,
        scope: user.policy.scope,
        academiaIds: user.policy.academiaIds,
        inherited: user.policy.inherited,
        rationale: user.policy.rationale,
        updatedAt: user.policy.updatedAt,
      },
    };
  }

  function buildSecurityOverview() {
    const details = securityUsers.map(buildUserDetail);
    return {
      totalUsers: details.length,
      activeMemberships: details.reduce((sum, item) => sum + item.membershipsAtivos, 0),
      defaultUnitsConfigured: details.filter((item) => Boolean(item.defaultTenantId)).length,
      eligibleForNewUnits: details.filter((item) => item.eligibleForNewUnits).length,
    };
  }

  function listSecurityUsers(url: URL) {
    const query = url.searchParams.get("query")?.trim().toLowerCase() ?? "";
    const tenantId = url.searchParams.get("tenantId")?.trim() ?? "";
    const academiaId = url.searchParams.get("academiaId")?.trim() ?? "";
    const status = url.searchParams.get("status")?.trim().toUpperCase() ?? "";
    const profile = url.searchParams.get("profile")?.trim().toUpperCase() ?? "";
    const eligibleOnly = normalizeBooleanInput(url.searchParams.get("eligibleForNewUnits"), false);
    const page = Number(url.searchParams.get("page") ?? 0);
    const size = Number(url.searchParams.get("size") ?? 20);

    const filtered = securityUsers
      .map(buildUserDetail)
      .filter((user) => {
        if (query) {
          const haystack = `${user.fullName ?? user.name} ${user.email}`.toLowerCase();
          if (!haystack.includes(query)) return false;
        }
        if (academiaId && !user.academias.some((academia) => academia.id === academiaId)) return false;
        if (tenantId && !user.memberships.some((membership) => membership.tenantId === tenantId)) return false;
        if (status && status !== user.status) return false;
        if (profile && !user.perfis.some((item) => item.toUpperCase().includes(profile))) return false;
        if (eligibleOnly && !user.eligibleForNewUnits) return false;
        return true;
      });

    const start = page * size;
    const items = filtered.slice(start, start + size).map((item) => ({
      id: item.id,
      name: item.name,
      fullName: item.fullName,
      email: item.email,
      status: item.status,
      active: item.active,
      academias: item.academias,
      membershipsAtivos: item.membershipsAtivos,
      membershipsTotal: item.membershipsTotal,
      perfis: item.perfis,
      defaultTenantId: item.defaultTenantId,
      defaultTenantName: item.defaultTenantName,
      eligibleForNewUnits: item.eligibleForNewUnits,
    }));

    return {
      items,
      total: filtered.length,
      page,
      size,
      hasNext: start + size < filtered.length,
    };
  }

  async function fulfillNoContent(route: Route, status = 204) {
    await route.fulfill({
      status,
      contentType: "application/json; charset=utf-8",
      body: "",
    });
  }

  await page.route("**/api/v1/**", async (route) => {
    try {
      const request = route.request();
      const url = new URL(request.url());
      const path = normalizeApiPath(url.pathname);
      const method = request.method();

      if (path === "/api/v1/admin/auth/login" && method === "POST") {
        const payload = parseBody<{ email?: string; password?: string }>(request);
        const email = payload.email?.trim() || "admin@academia.local";

        currentAuthProfile = {
          id: "user-admin-global",
          nome: "Sergio Amim",
          email,
          roles: ["OWNER", "ADMIN"],
          availableScopes: ["GLOBAL"],
          broadAccess: true,
        };
        await fulfillJson(route, buildLoginResponse(false));
        return;
      }

      if (path === "/api/v1/auth/me" && method === "GET") {
        await fulfillJson(route, buildAuthPayload());
        return;
      }

      if (path === "/api/v1/auth/context/tenant" && method === "POST") {
        const payload = parseBody<{ tenantId?: string }>(request);
        const requestedTenantId = payload.tenantId?.trim();
        if (requestedTenantId && getTenant(requestedTenantId)) {
          currentTenantId = requestedTenantId;
        }
        await fulfillJson(route, buildSessionPayload());
        return;
      }

      if (path === "/api/v1/app/bootstrap" && method === "GET") {
        const tenantAtual = getCurrentActiveTenant();
        await fulfillJson(route, {
          user: buildAuthPayload(),
          tenantContext: {
            currentTenantId: tenantAtual?.id ?? currentTenantId,
            tenantAtual,
            unidadesDisponiveis: getCurrentVisibleTenants(),
          },
          academia: buildActiveAcademiaPayload(),
          branding: buildActiveAcademiaPayload().branding,
          capabilities: {
            canAccessElevatedModules: true,
            canDeleteClient: true,
          },
        });
        return;
      }

    if (path === "/api/v1/context/unidade-ativa" && method === "GET") {
      const tenantAtual = getCurrentActiveTenant();
      await fulfillJson(route, {
        currentTenantId: tenantAtual?.id ?? currentTenantId,
        tenantAtual,
        unidadesDisponiveis: getCurrentVisibleTenants(),
      });
      return;
    }

    if (/^\/api\/v1\/context\/unidade-ativa\/[^/]+$/.test(path) && method === "PUT") {
      const requestedTenantId = path.split("/").at(-1) ?? currentTenantId;
      if (getCurrentVisibleTenants().some((item) => item.id === requestedTenantId)) {
        currentTenantId = requestedTenantId;
      }
      await fulfillJson(route, {
        currentTenantId,
        tenantAtual: getCurrentActiveTenant(),
        unidadesDisponiveis: getCurrentVisibleTenants(),
      });
      return;
    }

    if (path === "/api/v1/context/tenant-atual" && method === "GET") {
      await fulfillJson(route, getTenant(currentTenantId));
      return;
    }

    if (path === "/api/v1/context/tenant-atual" && method === "PUT") {
      const payload = parseBody<Partial<TenantSeed>>(request);
      unidades = unidades.map((item) =>
        item.id === currentTenantId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              razaoSocial: payload.razaoSocial?.trim() || item.razaoSocial,
              email: payload.email?.trim() || item.email,
              telefone: payload.telefone?.trim() || item.telefone,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, getTenant(currentTenantId));
      return;
    }

    if (path === "/api/v1/unidades" && method === "GET") {
      await fulfillJson(route, getCurrentVisibleTenants());
      return;
    }

    if (path === "/api/v1/academia" && method === "GET") {
      await fulfillJson(route, buildActiveAcademiaPayload());
      return;
    }

    if (path === "/api/v1/academia/dashboard" && method === "GET") {
      await fulfillJson(route, {
        totalAlunosAtivos: 12,
        prospectsNovos: 4,
        matriculasDoMes: 2,
        receitaDoMes: 3200,
        prospectsRecentes: [],
        matriculasVencendo: [],
        pagamentosPendentes: [],
        statusAlunoCount: {
          ATIVO: 12,
          INATIVO: 0,
          SUSPENSO: 0,
          CANCELADO: 0,
        },
        prospectsEmAberto: 3,
        followupPendente: 1,
        visitasAguardandoRetorno: 1,
        prospectsNovosAnterior: 2,
        matriculasDoMesAnterior: 1,
        receitaDoMesAnterior: 1800,
        ticketMedio: 1600,
        ticketMedioAnterior: 1800,
        pagamentosRecebidosMes: 3200,
        pagamentosRecebidosMesAnterior: 1800,
        vendasNovas: 1,
        vendasRecorrentes: 1,
        inadimplencia: 0,
        aReceber: 450,
      });
      return;
    }

    if (path === "/api/v1/academia" && method === "PUT") {
      const payload = parseBody<Partial<TenantSeed>>(request);
      const tenant = getTenant(currentTenantId) ?? unidades[0];
      academias.splice(
        academias.findIndex((item) => item.id === tenant.academiaId),
        1,
        {
          ...(getAcademia(tenant.academiaId) ?? academias[0]),
          nome: payload.nome?.trim() || buildActiveAcademiaPayload().nome,
          razaoSocial: payload.razaoSocial?.trim() || buildActiveAcademiaPayload().razaoSocial,
          documento: payload.documento?.trim() || buildActiveAcademiaPayload().documento,
          email: payload.email?.trim() || buildActiveAcademiaPayload().email,
          telefone: payload.telefone?.trim() || buildActiveAcademiaPayload().telefone,
          ativo: payload.ativo ?? true,
          branding: payload.branding ?? buildActiveAcademiaPayload().branding,
        },
      );
      updateOnboardingChecklistProgress(currentTenantId, { academiaConfigurada: true });
      await fulfillJson(route, buildActiveAcademiaPayload());
      return;
    }

    if (path === "/api/v1/onboarding/status" && method === "GET") {
      await fulfillJson(route, buildOnboardingStatusPayload(currentTenantId));
      return;
    }

    if (path === "/api/v1/comercial/planos" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), false);
      const planos = planosByTenant.get(tenantId) ?? [];
      await fulfillJson(route, activeOnly ? planos.filter((item) => item.ativo) : planos);
      return;
    }

    if (path === "/api/v1/comercial/planos" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<PlanoSeed>>(request);
      const created: PlanoSeed = {
        id: nextId("plano", "plano"),
        tenantId,
        nome: payload.nome?.trim() || "Novo plano",
        descricao: payload.descricao?.trim() || undefined,
        tipo: payload.tipo ?? "MENSAL",
        duracaoDias: Number(payload.duracaoDias) > 0 ? Number(payload.duracaoDias) : 30,
        valor: Number(payload.valor) > 0 ? Number(payload.valor) : 99.9,
        valorMatricula: Number(payload.valorMatricula) >= 0 ? Number(payload.valorMatricula) : 0,
        cobraAnuidade: payload.cobraAnuidade ?? false,
        valorAnuidade: payload.valorAnuidade ? Number(payload.valorAnuidade) : undefined,
        destaque: payload.destaque ?? false,
        ativo: true,
        ordem: payload.ordem ? Number(payload.ordem) : undefined,
        beneficios: payload.beneficios ?? [],
        permiteRenovacaoAutomatica: payload.permiteRenovacaoAutomatica ?? true,
        contratoAssinatura: payload.contratoAssinatura ?? "AMBAS",
        contratoTemplateHtml: payload.contratoTemplateHtml,
      };
      planosByTenant.set(tenantId, [created, ...(planosByTenant.get(tenantId) ?? [])]);
      updateOnboardingChecklistProgress(tenantId, { planoCriado: true });
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/comercial\/planos\/[^/]+$/.test(path) && method === "GET") {
      const tenantId = resolveTenantId(url);
      const planoId = path.split("/").at(-1) ?? "";
      const plano = (planosByTenant.get(tenantId) ?? []).find((item) => item.id === planoId);
      await fulfillJson(route, plano ?? { message: "Plano não encontrado" }, plano ? 200 : 404);
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await fulfillJson(
        route,
        academias.map((item) => buildAcademiaPayload(item.id)),
      );
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "POST") {
      const payload = parseBody<Partial<TenantSeed>>(request);
      const created: TenantSeed = {
        id: nextId("academia", "academia"),
        academiaId: "",
        groupId: "",
        nome: payload.nome?.trim() || "Nova academia",
        razaoSocial: payload.razaoSocial?.trim(),
        documento: payload.documento?.trim(),
        subdomain: payload.subdomain?.trim() || "rede",
        email: payload.email?.trim(),
        telefone: payload.telefone?.trim(),
        ativo: payload.ativo ?? true,
        branding: payload.branding,
      };
      created.academiaId = created.id;
      created.groupId = created.id;
      academias = [created, ...academias];
      await fulfillJson(route, buildAcademiaPayload(created.id), 201);
      return;
    }

    if (path === "/api/v1/admin/onboarding/provision" && method === "POST") {
      const payload = parseBody<{
        nomeAcademia?: string;
        cnpj?: string;
        nomeUnidadePrincipal?: string;
        nomeAdministrador?: string;
        emailAdministrador?: string;
        telefone?: string;
      }>(request);
      const academiaId = nextId("academia", "academia");
      const tenantId = nextId("tenant", "unidade");
      const academiaSlug = slugify(payload.nomeAcademia?.trim() || academiaId) || academiaId;
      const unidadeSlug = slugify(payload.nomeUnidadePrincipal?.trim() || tenantId) || tenantId;
      const temporaryPassword = `Temp#${counters.unidade}Onb`;
      const academia: TenantSeed = {
        id: academiaId,
        academiaId,
        groupId: academiaId,
        nome: payload.nomeAcademia?.trim() || "Nova academia",
        razaoSocial: payload.nomeAcademia?.trim() || "Nova academia",
        documento: payload.cnpj?.trim(),
        subdomain: academiaSlug,
        email: payload.emailAdministrador?.trim(),
        telefone: payload.telefone?.trim(),
        ativo: true,
        branding: {
          appName: payload.nomeAcademia?.trim() || "Nova academia",
          themePreset: "premium",
          useCustomColors: false,
        },
      };
      const unidade: TenantSeed = {
        id: tenantId,
        academiaId,
        groupId: academiaId,
        nome: payload.nomeUnidadePrincipal?.trim() || "Unidade principal",
        razaoSocial: payload.nomeUnidadePrincipal?.trim() || "Unidade principal",
        documento: payload.cnpj?.trim(),
        subdomain: unidadeSlug,
        email: payload.emailAdministrador?.trim(),
        telefone: payload.telefone?.trim(),
        ativo: true,
        branding: academia.branding,
      };
      academias = [academia, ...academias];
      unidades = [unidade, ...unidades];
      mergeOnboardingState({
        tenantId,
        academiaId,
        estrategia: "IMPORTAR_DEPOIS",
        status: "AGUARDANDO_IMPORTACAO",
        ultimaMensagem: "Provisionamento concluído aguardando configuração inicial.",
      });
      onboardingChecklistByTenant.set(tenantId, {
        academiaConfigurada: false,
        planoCriado: false,
      });
      provisionedAdminAccounts = [
        {
          id: `user-${tenantId}`,
          tenantId,
          academiaId,
          nome: payload.nomeAdministrador?.trim() || "Administrador da academia",
          email: payload.emailAdministrador?.trim() || `${academiaSlug}@academia.local`,
          password: temporaryPassword,
          temporaryPassword,
          forcePasswordChange: true,
        },
        ...provisionedAdminAccounts.filter((item) => item.tenantId !== tenantId),
      ];
      await fulfillJson(
        route,
        {
          academiaId,
          tenantId,
          unidadePrincipalId: tenantId,
          nomeAcademia: academia.nome,
          nomeUnidadePrincipal: unidade.nome,
          emailAdministrador: provisionedAdminAccounts[0].email,
          senhaTemporaria: temporaryPassword,
        },
        201,
      );
      return;
    }

    if (path === "/api/v1/auth/login" && method === "POST") {
      const payload = parseBody<{ email?: string; identifier?: string; password?: string }>(request);
      const email = payload.email?.trim() || payload.identifier?.trim() || "";
      const account = provisionedAdminAccounts.find((item) => item.email === email);

      if (!account || account.password !== (payload.password ?? "")) {
        await fulfillJson(route, { message: "Credenciais inválidas." }, 401);
        return;
      }

      currentTenantId = account.tenantId;
      currentAuthProfile = {
        id: account.id,
        nome: account.nome,
        email: account.email,
        roles: ["ADMIN"],
        availableScopes: ["UNIDADE"],
        broadAccess: false,
      };
      await fulfillJson(route, buildLoginResponse(account.forcePasswordChange));
      return;
    }

    if (path === "/api/v1/auth/change-password" && method === "POST") {
      const payload = parseBody<{ newPassword?: string }>(request);
      const account = provisionedAdminAccounts.find((item) => item.email === currentAuthProfile.email);

      if (account && payload.newPassword?.trim()) {
        provisionedAdminAccounts = provisionedAdminAccounts.map((item) =>
          item.email === account.email
            ? {
                ...item,
                password: payload.newPassword!.trim(),
                forcePasswordChange: false,
              }
            : item,
        );
      }

      await fulfillJson(route, {
        ...buildLoginResponse(false),
        message: "Senha atualizada com sucesso.",
      });
      return;
    }

    if (/^\/api\/v1\/admin\/academias\/[^/]+$/.test(path) && method === "GET") {
      const academiaId = path.split("/").at(-1) ?? "";
      const academia = academias.find((item) => item.id === academiaId);
      await fulfillJson(route, academia ? buildAcademiaPayload(academia.id) : { message: "Academia não encontrada" }, academia ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/academias\/[^/]+$/.test(path) && method === "PUT") {
      const academiaId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<TenantSeed>>(request);
      academias = academias.map((item) =>
        item.id === academiaId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              razaoSocial: payload.razaoSocial?.trim() || item.razaoSocial,
              documento: payload.documento?.trim() || item.documento,
              email: payload.email?.trim() || item.email,
              telefone: payload.telefone?.trim() || item.telefone,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, buildAcademiaPayload(academiaId));
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await fulfillJson(route, unidades);
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "POST") {
      const payload = parseBody<Partial<TenantSeed> & { configuracoes?: TenantSeed["branding"] }>(request);
      const academiaId = payload.academiaId?.trim() || payload.groupId?.trim() || academias[0].id;
      const created: TenantSeed = {
        id: nextId("tenant", "unidade"),
        academiaId,
        groupId: payload.groupId?.trim() || academiaId,
        nome: payload.nome?.trim() || "Nova unidade",
        razaoSocial: payload.razaoSocial?.trim(),
        documento: payload.documento?.trim(),
        subdomain: payload.subdomain?.trim() || `tenant-${counters.unidade}`,
        email: payload.email?.trim(),
        telefone: payload.telefone?.trim(),
        ativo: payload.ativo ?? true,
        branding: payload.branding,
      };
      unidades = [created, ...unidades];
      mergeOnboardingState({
        tenantId: created.id,
        academiaId,
        estrategia: "IMPORTAR_DEPOIS",
        status: "AGUARDANDO_IMPORTACAO",
      });
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/unidades\/[^/]+$/.test(path) && method === "GET") {
      const tenantId = path.split("/").at(-1) ?? "";
      const tenant = getTenant(tenantId);
      await fulfillJson(route, tenant ?? { message: "Unidade não encontrada" }, tenant ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/unidades\/[^/]+$/.test(path) && method === "PUT") {
      const tenantId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<TenantSeed>>(request);
      unidades = unidades.map((item) =>
        item.id === tenantId
          ? {
              ...item,
              academiaId: payload.academiaId?.trim() || item.academiaId,
              groupId: payload.groupId?.trim() || payload.academiaId?.trim() || item.groupId,
              nome: payload.nome?.trim() || item.nome,
              razaoSocial: payload.razaoSocial?.trim() || item.razaoSocial,
              documento: payload.documento?.trim() || item.documento,
              subdomain: payload.subdomain?.trim() || item.subdomain,
              email: payload.email?.trim() || item.email,
              telefone: payload.telefone?.trim() || item.telefone,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, getTenant(tenantId));
      return;
    }

    if (/^\/api\/v1\/admin\/unidades\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const tenantId = path.split("/").at(-2) ?? "";
      unidades = unidades.map((item) =>
        item.id === tenantId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, getTenant(tenantId));
      return;
    }

    if (path === "/api/v1/admin/unidades/onboarding" && method === "GET") {
      await fulfillJson(route, onboarding);
      return;
    }

    if (/^\/api\/v1\/admin\/unidades\/[^/]+\/onboarding$/.test(path) && method === "GET") {
      const tenantId = path.split("/").at(-2) ?? "";
      const state = getOnboardingState(tenantId);
      await fulfillJson(route, state ?? { message: "Onboarding não encontrado" }, state ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/unidades\/[^/]+\/onboarding$/.test(path) && method === "PUT") {
      const tenantId = path.split("/").at(-2) ?? "";
      const payload = parseBody<Partial<AdminOnboardingSeed>>(request);
      const tenant = getTenant(tenantId);
      const saved = mergeOnboardingState({
        tenantId,
        academiaId: payload.academiaId?.trim() || tenant?.academiaId,
        estrategia: payload.estrategia ?? "IMPORTAR_DEPOIS",
        status: payload.status ?? "AGUARDANDO_IMPORTACAO",
        evoFilialId: payload.evoFilialId?.trim() || undefined,
        ultimaMensagem: payload.ultimaMensagem?.trim() || undefined,
      });
      await fulfillJson(route, saved);
      return;
    }

    if (path === "/api/v1/admin/seguranca/overview" && method === "GET") {
      await fulfillJson(route, buildSecurityOverview());
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "GET") {
      await fulfillJson(route, listSecurityUsers(url));
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "GET") {
      const includeInactive = normalizeBooleanInput(url.searchParams.get("includeInactive"), false);
      const page = Number(url.searchParams.get("page") ?? 0);
      const size = Number(url.searchParams.get("size") ?? profileCatalog.length);
      const items = includeInactive ? profileCatalog : profileCatalog.filter((profile) => profile.active);

      await fulfillJson(route, {
        items,
        page,
        size,
        hasNext: false,
        total: items.length,
      });
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+$/.test(path) && method === "GET") {
      const userId = path.split("/").at(-1) ?? "";
      const user = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, user ? buildUserDetail(user) : { message: "Usuário não encontrado" }, user ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships$/.test(path) && method === "POST") {
      const userId = path.split("/").at(-2) ?? "";
      const payload = parseBody<{ tenantId?: string; defaultTenant?: boolean }>(request);
      securityUsers = securityUsers.map((user) => {
        if (user.id !== userId) return user;
        const nextMembership: AdminSecurityMembershipState = {
          id: nextId("membership", "membership"),
          tenantId: payload.tenantId?.trim() || currentTenantId,
          active: true,
          defaultTenant: payload.defaultTenant ?? false,
          accessOrigin: "MANUAL",
          profiles: [],
        };
        const memberships = user.memberships.map((membership) => ({
          ...membership,
          defaultTenant: nextMembership.defaultTenant ? false : membership.defaultTenant,
        }));
        return {
          ...user,
          memberships: [...memberships, nextMembership],
        };
      });
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+$/.test(path) && method === "PATCH") {
      const userId = path.split("/").at(-3) ?? "";
      const membershipId = path.split("/").at(-1) ?? "";
      const payload = parseBody<{ active?: boolean; defaultTenant?: boolean }>(request);
      securityUsers = securityUsers.map((user) => {
        if (user.id !== userId) return user;
        return {
          ...user,
          memberships: user.memberships.map((membership) => {
            if (membership.id !== membershipId) {
              return payload.defaultTenant ? { ...membership, defaultTenant: false } : membership;
            }
            return {
              ...membership,
              active: payload.active ?? membership.active,
              defaultTenant: payload.defaultTenant ?? membership.defaultTenant,
            };
          }),
        };
      });
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+$/.test(path) && method === "DELETE") {
      const userId = path.split("/").at(-3) ?? "";
      const membershipId = path.split("/").at(-1) ?? "";
      securityUsers = securityUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              memberships: user.memberships.filter((membership) => membership.id !== membershipId),
            }
          : user,
      );
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+\/perfis\/[^/]+$/.test(path) && method === "PUT") {
      const parts = path.split("/");
      const userId = parts.at(-5) ?? "";
      const membershipId = parts.at(-3) ?? "";
      const perfilId = parts.at(-1) ?? "";
      securityUsers = securityUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              memberships: user.memberships.map((membership) =>
                membership.id === membershipId
                  ? {
                      ...membership,
                      profiles: uniqueStrings([...membership.profiles, perfilId]),
                    }
                  : membership,
              ),
            }
          : user,
      );
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/memberships\/[^/]+\/perfis\/[^/]+$/.test(path) && method === "DELETE") {
      const parts = path.split("/");
      const userId = parts.at(-5) ?? "";
      const membershipId = parts.at(-3) ?? "";
      const perfilId = parts.at(-1) ?? "";
      securityUsers = securityUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              memberships: user.memberships.map((membership) =>
                membership.id === membershipId
                  ? {
                      ...membership,
                      profiles: membership.profiles.filter((item) => item !== perfilId),
                    }
                  : membership,
              ),
            }
          : user,
      );
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/usuarios\/[^/]+\/policy\/new-units$/.test(path) && method === "PUT") {
      const userId = path.split("/").at(-3) ?? "";
      const payload = parseBody<{
        enabled?: boolean;
        scope?: "ACADEMIA_ATUAL" | "REDE";
        academiaIds?: string[];
        rationale?: string;
      }>(request);
      securityUsers = securityUsers.map((user) =>
        user.id === userId
          ? {
              ...user,
              policy: {
                enabled: payload.enabled ?? user.policy.enabled,
                scope: payload.scope ?? user.policy.scope,
                academiaIds: payload.academiaIds ?? user.policy.academiaIds,
                inherited: false,
                rationale: payload.rationale?.trim() || user.policy.rationale,
                updatedAt: nowIso(),
              },
            }
          : user,
      );
      const updated = securityUsers.find((item) => item.id === userId);
      await fulfillJson(route, updated ? buildUserDetail(updated) : null);
      return;
    }

    if (path === "/api/v1/administrativo/cargos" && method === "GET") {
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), false);
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, filterActiveItems(cargos.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/administrativo/cargos" && method === "POST") {
      const payload = parseBody<Partial<AdminCargoSeed>>(request);
      const tenantId = resolveTenantId(url);
      const created: AdminCargoSeed = {
        id: nextId("cargo", "cargo"),
        tenantId,
        nome: payload.nome?.trim() || "Novo cargo",
        ativo: payload.ativo ?? true,
      };
      cargos = [created, ...cargos];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/cargos\/[^/]+$/.test(path) && method === "PUT") {
      const cargoId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminCargoSeed>>(request);
      cargos = cargos.map((item) =>
        item.id === cargoId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, cargos.find((item) => item.id === cargoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/cargos\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const cargoId = path.split("/").at(-2) ?? "";
      cargos = cargos.map((item) =>
        item.id === cargoId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, cargos.find((item) => item.id === cargoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/cargos\/[^/]+$/.test(path) && method === "DELETE") {
      const cargoId = path.split("/").at(-1) ?? "";
      cargos = cargos.filter((item) => item.id !== cargoId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/administrativo/funcionarios" && method === "GET") {
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), true);
      const tenantId = resolveTenantId(url);
      await fulfillJson(
        route,
        filterActiveItems(funcionarios.filter((item) => item.tenantId === tenantId), activeOnly),
      );
      return;
    }

    if (path === "/api/v1/administrativo/funcionarios" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminFuncionarioSeed>>(request);
      const cargo = cargos.find((item) => item.id === payload.cargoId);
      const created: AdminFuncionarioSeed = {
        ...payload,
        id: nextId("funcionario", "funcionario"),
        tenantId,
        nome: payload.nome?.trim() || "Novo funcionário",
        cargoId: payload.cargoId?.trim() || undefined,
        cargo: cargo?.nome ?? payload.cargo?.trim() ?? undefined,
        ativo: payload.ativo ?? true,
        podeMinistrarAulas: payload.podeMinistrarAulas ?? false,
        statusOperacional: payload.statusOperacional ?? (payload.ativo === false ? "INATIVO" : "ATIVO"),
        statusAcesso: payload.statusAcesso ?? (payload.possuiAcessoSistema ? "CONVITE_PENDENTE" : "SEM_ACESSO"),
        origemCadastro: payload.origemCadastro ?? "MANUAL",
        tenantBaseId: payload.tenantBaseId ?? tenantId,
        tenantBaseNome: payload.tenantBaseNome ?? "Unidade",
        possuiAcessoSistema: payload.possuiAcessoSistema ?? false,
        memberships: payload.memberships ?? [],
      };
      funcionarios = [created, ...funcionarios];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/funcionarios\/[^/]+$/.test(path) && method === "PUT") {
      const funcionarioId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminFuncionarioSeed>>(request);
      const cargo = cargos.find((item) => item.id === payload.cargoId);
      funcionarios = funcionarios.map((item) =>
        item.id === funcionarioId
          ? {
              ...item,
              ...payload,
              nome: payload.nome?.trim() || item.nome,
              cargoId: payload.cargoId?.trim() || undefined,
              cargo: cargo?.nome ?? payload.cargo?.trim() ?? item.cargo,
              podeMinistrarAulas: payload.podeMinistrarAulas ?? item.podeMinistrarAulas,
            }
          : item,
      );
      await fulfillJson(route, funcionarios.find((item) => item.id === funcionarioId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/funcionarios\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const funcionarioId = path.split("/").at(-2) ?? "";
      funcionarios = funcionarios.map((item) =>
        item.id === funcionarioId
          ? {
              ...item,
              ativo: !item.ativo,
              statusOperacional: item.ativo ? "INATIVO" : "ATIVO",
            }
          : item,
      );
      await fulfillJson(route, funcionarios.find((item) => item.id === funcionarioId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/funcionarios\/[^/]+$/.test(path) && method === "DELETE") {
      const funcionarioId = path.split("/").at(-1) ?? "";
      funcionarios = funcionarios.filter((item) => item.id !== funcionarioId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/comercial/servicos" && method === "GET") {
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), false);
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, filterActiveItems(servicos.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/comercial/servicos" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminServicoSeed>>(request);
      const created: AdminServicoSeed = {
        id: nextId("servico", "servico"),
        tenantId,
        nome: payload.nome?.trim() || "Novo serviço",
        sku: payload.sku?.trim() || undefined,
        categoria: payload.categoria?.trim() || undefined,
        descricao: payload.descricao?.trim() || undefined,
        sessoes: payload.sessoes,
        valor: normalizeNumberInput(payload.valor, 0),
        custo: payload.custo == null ? undefined : normalizeNumberInput(payload.custo, 0),
        duracaoMinutos: payload.duracaoMinutos,
        validadeDias: payload.validadeDias,
        comissaoPercentual: payload.comissaoPercentual,
        aliquotaImpostoPercentual: payload.aliquotaImpostoPercentual,
        permiteDesconto: payload.permiteDesconto ?? true,
        tipoCobranca: payload.tipoCobranca ?? "UNICO",
        recorrenciaDias: payload.recorrenciaDias,
        agendavel: payload.agendavel ?? false,
        permiteAcessoCatraca: payload.permiteAcessoCatraca ?? false,
        permiteVoucher: payload.permiteVoucher ?? false,
        ativo: true,
      };
      servicos = [created, ...servicos];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/comercial\/servicos\/[^/]+$/.test(path) && method === "PUT") {
      const servicoId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminServicoSeed>>(request);
      servicos = servicos.map((item) =>
        item.id === servicoId
          ? {
              ...item,
              ...payload,
              nome: payload.nome?.trim() || item.nome,
              sku: payload.sku?.trim() || item.sku,
              categoria: payload.categoria?.trim() || item.categoria,
              descricao: payload.descricao?.trim() || item.descricao,
              valor: payload.valor == null ? item.valor : normalizeNumberInput(payload.valor, item.valor),
            }
          : item,
      );
      await fulfillJson(route, servicos.find((item) => item.id === servicoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/comercial\/servicos\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const servicoId = path.split("/").at(-2) ?? "";
      servicos = servicos.map((item) =>
        item.id === servicoId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, servicos.find((item) => item.id === servicoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/comercial\/servicos\/[^/]+$/.test(path) && method === "DELETE") {
      const servicoId = path.split("/").at(-1) ?? "";
      servicos = servicos.filter((item) => item.id !== servicoId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/comercial/produtos" && method === "GET") {
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), false);
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, filterActiveItems(produtos.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/comercial/produtos" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminProdutoSeed>>(request);
      const created: AdminProdutoSeed = {
        id: nextId("produto", "produto"),
        tenantId,
        nome: payload.nome?.trim() || "Novo produto",
        sku: payload.sku?.trim() || `SKU-${counters.produto}`,
        codigoBarras: payload.codigoBarras?.trim() || undefined,
        categoria: payload.categoria?.trim() || undefined,
        marca: payload.marca?.trim() || undefined,
        unidadeMedida: payload.unidadeMedida ?? "UN",
        descricao: payload.descricao?.trim() || undefined,
        valorVenda: normalizeNumberInput(payload.valorVenda, 0),
        custo: payload.custo == null ? undefined : normalizeNumberInput(payload.custo, 0),
        comissaoPercentual: payload.comissaoPercentual,
        aliquotaImpostoPercentual: payload.aliquotaImpostoPercentual,
        controlaEstoque: payload.controlaEstoque ?? true,
        estoqueAtual: normalizeNumberInput(payload.estoqueAtual, 0),
        estoqueMinimo: payload.estoqueMinimo,
        permiteDesconto: payload.permiteDesconto ?? true,
        permiteVoucher: payload.permiteVoucher ?? false,
        ativo: true,
      };
      produtos = [created, ...produtos];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/comercial\/produtos\/[^/]+$/.test(path) && method === "PUT") {
      const produtoId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminProdutoSeed>>(request);
      produtos = produtos.map((item) =>
        item.id === produtoId
          ? {
              ...item,
              ...payload,
              nome: payload.nome?.trim() || item.nome,
              sku: payload.sku?.trim() || item.sku,
              valorVenda: payload.valorVenda == null ? item.valorVenda : normalizeNumberInput(payload.valorVenda, item.valorVenda),
            }
          : item,
      );
      await fulfillJson(route, produtos.find((item) => item.id === produtoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/comercial\/produtos\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const produtoId = path.split("/").at(-2) ?? "";
      produtos = produtos.map((item) =>
        item.id === produtoId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, produtos.find((item) => item.id === produtoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/comercial\/produtos\/[^/]+$/.test(path) && method === "DELETE") {
      const produtoId = path.split("/").at(-1) ?? "";
      produtos = produtos.filter((item) => item.id !== produtoId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/administrativo/convenios" && method === "GET") {
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), false);
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, filterActiveItems(convenios.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/administrativo/convenios" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminConvenioSeed>>(request);
      const created: AdminConvenioSeed = {
        id: nextId("convenio", "convenio"),
        tenantId,
        nome: payload.nome?.trim() || "Novo convênio",
        descontoPercentual: normalizeNumberInput(payload.descontoPercentual, 0),
        planoIds: payload.planoIds ?? [],
        observacoes: payload.observacoes?.trim() || undefined,
        ativo: payload.ativo ?? true,
      };
      convenios = [created, ...convenios];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/convenios\/[^/]+$/.test(path) && method === "PUT") {
      const convenioId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminConvenioSeed>>(request);
      convenios = convenios.map((item) =>
        item.id === convenioId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              descontoPercentual:
                payload.descontoPercentual == null
                  ? item.descontoPercentual
                  : normalizeNumberInput(payload.descontoPercentual, item.descontoPercentual),
              planoIds: payload.planoIds ?? item.planoIds,
              observacoes: payload.observacoes?.trim() || item.observacoes,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, convenios.find((item) => item.id === convenioId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/convenios\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const convenioId = path.split("/").at(-2) ?? "";
      convenios = convenios.map((item) =>
        item.id === convenioId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, convenios.find((item) => item.id === convenioId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/convenios\/[^/]+$/.test(path) && method === "DELETE") {
      const convenioId = path.split("/").at(-1) ?? "";
      convenios = convenios.filter((item) => item.id !== convenioId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/administrativo/vouchers" && method === "GET") {
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, vouchers.filter((item) => item.tenantId === tenantId));
      return;
    }

    if (path === "/api/v1/administrativo/vouchers" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminVoucherSeed>>(request);
      const voucherId = nextId("voucher", "voucher");
      const created: AdminVoucherSeed = {
        id: voucherId,
        tenantId,
        escopo: payload.escopo ?? "UNIDADE",
        tipo: payload.tipo ?? "DESCONTO",
        nome: payload.nome?.trim() || "Novo voucher",
        periodoInicio: payload.periodoInicio?.trim() || todayIso(),
        periodoFim: payload.periodoFim?.trim() || undefined,
        prazoDeterminado: payload.prazoDeterminado ?? true,
        quantidade: payload.quantidade,
        ilimitado: payload.ilimitado ?? false,
        codigoTipo: payload.codigoTipo ?? "UNICO",
        codigoUnicoCustom: payload.codigoUnicoCustom?.trim() || undefined,
        usarNaVenda: payload.usarNaVenda ?? false,
        planoIds: payload.planoIds ?? [],
        umaVezPorCliente: payload.umaVezPorCliente ?? false,
        aplicarEm: payload.aplicarEm ?? ["CONTRATO"],
        ativo: true,
      };
      vouchers = [created, ...vouchers];
      voucherCodigosByVoucher.set(voucherId, [
        {
          id: `${voucherId}-codigo-1`,
          voucherId,
          codigo:
            created.codigoTipo === "UNICO"
              ? created.codigoUnicoCustom || `COD-${voucherId.toUpperCase()}`
              : `AUTO-${voucherId.toUpperCase()}`,
          status: "DISPONIVEL",
        },
      ]);
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/vouchers\/[^/]+$/.test(path) && method === "PUT") {
      const voucherId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminVoucherSeed>>(request);
      vouchers = vouchers.map((item) =>
        item.id === voucherId
          ? {
              ...item,
              ...payload,
              nome: payload.nome?.trim() || item.nome,
            }
          : item,
      );
      await fulfillJson(route, vouchers.find((item) => item.id === voucherId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/vouchers\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const voucherId = path.split("/").at(-2) ?? "";
      vouchers = vouchers.map((item) =>
        item.id === voucherId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, vouchers.find((item) => item.id === voucherId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/vouchers\/[^/]+\/codigos$/.test(path) && method === "GET") {
      const voucherId = path.split("/").at(-2) ?? "";
      await fulfillJson(route, voucherCodigosByVoucher.get(voucherId) ?? []);
      return;
    }

    if (path === "/api/v1/administrativo/vouchers/usage-counts" && method === "GET") {
      const usageCounts = vouchers.reduce<Record<string, number>>((acc, voucher) => {
        acc[voucher.id] = 0;
        return acc;
      }, {});
      await fulfillJson(route, usageCounts);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/formas-pagamento" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivas"), true);
      const rows = formasPagamento
        .filter((item) => item.tenantId === tenantId)
        .filter((item) => (activeOnly ? item.ativo : true))
        .map((item) => ({
          ...item,
          emitirAutomaticamente: formaPagamentoExtras.get(item.id)?.emitirAutomaticamente ?? false,
          instrucoes: formaPagamentoExtras.get(item.id)?.instrucoes,
        }));
      await fulfillJson(route, rows);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/formas-pagamento" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<FormaPagamentoSeed> & { emitirAutomaticamente?: boolean; instrucoes?: string }>(request);
      const created: FormaPagamentoSeed = {
        id: nextId("forma-pagamento", "servico"),
        tenantId,
        nome: payload.nome?.trim() || "Nova forma",
        tipo: payload.tipo ?? "PIX",
        ativo: true,
        parcelasMax: Math.max(1, normalizeNumberInput(payload.parcelasMax, 1)),
        taxaPercentual: normalizeNumberInput(payload.taxaPercentual, 0),
      };
      formasPagamento = [created, ...formasPagamento];
      formaPagamentoExtras.set(created.id, {
        emitirAutomaticamente: payload.emitirAutomaticamente ?? false,
        instrucoes: payload.instrucoes?.trim() || undefined,
      });
      await fulfillJson(route, {
        ...created,
        emitirAutomaticamente: formaPagamentoExtras.get(created.id)?.emitirAutomaticamente ?? false,
        instrucoes: formaPagamentoExtras.get(created.id)?.instrucoes,
      }, 201);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/formas-pagamento\/[^/]+$/.test(path) && method === "PUT") {
      const formaId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<FormaPagamentoSeed> & { emitirAutomaticamente?: boolean; instrucoes?: string }>(request);
      formasPagamento = formasPagamento.map((item) =>
        item.id === formaId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              tipo: payload.tipo ?? item.tipo,
              parcelasMax: payload.parcelasMax == null ? item.parcelasMax : Math.max(1, normalizeNumberInput(payload.parcelasMax, item.parcelasMax ?? 1)),
              taxaPercentual: payload.taxaPercentual == null ? item.taxaPercentual : normalizeNumberInput(payload.taxaPercentual, item.taxaPercentual ?? 0),
            }
          : item,
      );
      formaPagamentoExtras.set(formaId, {
        emitirAutomaticamente: payload.emitirAutomaticamente ?? formaPagamentoExtras.get(formaId)?.emitirAutomaticamente ?? false,
        instrucoes: payload.instrucoes?.trim() || formaPagamentoExtras.get(formaId)?.instrucoes,
      });
      const updated = formasPagamento.find((item) => item.id === formaId);
      await fulfillJson(route, updated ? {
        ...updated,
        emitirAutomaticamente: formaPagamentoExtras.get(formaId)?.emitirAutomaticamente ?? false,
        instrucoes: formaPagamentoExtras.get(formaId)?.instrucoes,
      } : null);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/formas-pagamento\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const formaId = path.split("/").at(-2) ?? "";
      formasPagamento = formasPagamento.map((item) =>
        item.id === formaId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      const updated = formasPagamento.find((item) => item.id === formaId);
      await fulfillJson(route, updated ? {
        ...updated,
        emitirAutomaticamente: formaPagamentoExtras.get(formaId)?.emitirAutomaticamente ?? false,
        instrucoes: formaPagamentoExtras.get(formaId)?.instrucoes,
      } : null);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/formas-pagamento\/[^/]+$/.test(path) && method === "DELETE") {
      const formaId = path.split("/").at(-1) ?? "";
      formasPagamento = formasPagamento.filter((item) => item.id !== formaId);
      formaPagamentoExtras.delete(formaId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/tipos-conta-pagar" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivos"), true);
      await fulfillJson(route, filterActiveItems(tiposConta.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/tipos-conta-pagar" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminTipoContaSeed>>(request);
      const created: AdminTipoContaSeed = {
        id: nextId("tipo-conta", "tipoConta"),
        tenantId,
        nome: payload.nome?.trim() || "Novo tipo",
        descricao: payload.descricao?.trim() || undefined,
        categoriaOperacional: payload.categoriaOperacional ?? "OUTROS",
        grupoDre: payload.grupoDre ?? "DESPESA_OPERACIONAL",
        centroCustoPadrao: payload.centroCustoPadrao?.trim() || undefined,
        ativo: true,
      };
      tiposConta = [created, ...tiposConta];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/tipos-conta-pagar\/[^/]+$/.test(path) && method === "PUT") {
      const tipoId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminTipoContaSeed>>(request);
      tiposConta = tiposConta.map((item) =>
        item.id === tipoId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              descricao: payload.descricao?.trim() || item.descricao,
              categoriaOperacional: payload.categoriaOperacional ?? item.categoriaOperacional,
              grupoDre: payload.grupoDre ?? item.grupoDre,
              centroCustoPadrao: payload.centroCustoPadrao?.trim() || item.centroCustoPadrao,
            }
          : item,
      );
      await fulfillJson(route, tiposConta.find((item) => item.id === tipoId) ?? null);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/tipos-conta-pagar\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const tipoId = path.split("/").at(-2) ?? "";
      tiposConta = tiposConta.map((item) =>
        item.id === tipoId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, tiposConta.find((item) => item.id === tipoId) ?? null);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-bancarias" && method === "GET") {
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, contasBancarias.filter((item) => item.tenantId === tenantId));
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/contas-bancarias" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminContaBancariaSeed>>(request);
      const created: AdminContaBancariaSeed = {
        id: nextId("conta", "conta"),
        tenantId,
        apelido: payload.apelido?.trim() || "Nova conta",
        banco: payload.banco?.trim() || "Banco",
        agencia: payload.agencia?.trim() || "0001",
        conta: payload.conta?.trim() || "12345",
        digito: payload.digito?.trim() || "0",
        tipo: payload.tipo ?? "CORRENTE",
        titular: payload.titular?.trim() || "Titular",
        pixChave: payload.pixChave?.trim() || undefined,
        pixTipo: payload.pixTipo,
        statusCadastro: "ATIVA",
      };
      contasBancarias = [created, ...contasBancarias];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/contas-bancarias\/[^/]+$/.test(path) && method === "PUT") {
      const contaId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminContaBancariaSeed>>(request);
      contasBancarias = contasBancarias.map((item) =>
        item.id === contaId
          ? {
              ...item,
              apelido: payload.apelido?.trim() || item.apelido,
              banco: payload.banco?.trim() || item.banco,
              agencia: payload.agencia?.trim() || item.agencia,
              conta: payload.conta?.trim() || item.conta,
              digito: payload.digito?.trim() || item.digito,
              tipo: payload.tipo ?? item.tipo,
              titular: payload.titular?.trim() || item.titular,
              pixChave: payload.pixChave?.trim() || undefined,
              pixTipo: payload.pixTipo ?? item.pixTipo,
            }
          : item,
      );
      await fulfillJson(route, contasBancarias.find((item) => item.id === contaId) ?? null);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/contas-bancarias\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const contaId = path.split("/").at(-2) ?? "";
      contasBancarias = contasBancarias.map((item) =>
        item.id === contaId
          ? {
              ...item,
              statusCadastro: item.statusCadastro === "ATIVA" ? "INATIVA" : "ATIVA",
            }
          : item,
      );
      await fulfillJson(route, contasBancarias.find((item) => item.id === contaId) ?? null);
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/maquininhas" && method === "GET") {
      const tenantId = resolveTenantId(url);
      await fulfillJson(route, maquininhas.filter((item) => item.tenantId === tenantId));
      return;
    }

    if (path === "/api/v1/gerencial/financeiro/maquininhas" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AdminMaquininhaSeed>>(request);
      const created: AdminMaquininhaSeed = {
        id: nextId("maquininha", "maquininha"),
        tenantId,
        nome: payload.nome?.trim() || "Nova maquininha",
        adquirente: payload.adquirente ?? "STONE",
        terminal: payload.terminal?.trim() || "TERM-01",
        contaBancariaId: payload.contaBancariaId?.trim() || contasBancarias[0]?.id || "",
        statusCadastro: "ATIVA",
      };
      maquininhas = [created, ...maquininhas];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/maquininhas\/[^/]+$/.test(path) && method === "PUT") {
      const maquininhaId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AdminMaquininhaSeed>>(request);
      maquininhas = maquininhas.map((item) =>
        item.id === maquininhaId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              adquirente: payload.adquirente ?? item.adquirente,
              terminal: payload.terminal?.trim() || item.terminal,
              contaBancariaId: payload.contaBancariaId?.trim() || item.contaBancariaId,
            }
          : item,
      );
      await fulfillJson(route, maquininhas.find((item) => item.id === maquininhaId) ?? null);
      return;
    }

    if (/^\/api\/v1\/gerencial\/financeiro\/maquininhas\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const maquininhaId = path.split("/").at(-2) ?? "";
      maquininhas = maquininhas.map((item) =>
        item.id === maquininhaId
          ? {
              ...item,
              statusCadastro: item.statusCadastro === "ATIVA" ? "INATIVA" : "ATIVA",
            }
          : item,
      );
      await fulfillJson(route, maquininhas.find((item) => item.id === maquininhaId) ?? null);
      return;
    }

    if (path === "/api/v1/administrativo/atividades" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivas"), false);
      await fulfillJson(route, filterActiveItems(atividades.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/administrativo/salas" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivas"), false);
      await fulfillJson(route, filterActiveItems(salas.filter((item) => item.tenantId === tenantId), activeOnly));
      return;
    }

    if (path === "/api/v1/administrativo/atividades" && method === "POST") {
      const tenantId = resolveTenantId(url);
      const payload = parseBody<Partial<AtividadeSeed> & { descricao?: string; icone?: string; cor?: string; permiteCheckin?: boolean; checkinObrigatorio?: boolean }>(request);
      const created = {
        id: nextId("atividade", "atividade"),
        tenantId,
        nome: payload.nome?.trim() || "Nova atividade",
        descricao: payload.descricao?.trim() || undefined,
        categoria: payload.categoria ?? "OUTRA",
        icone: payload.icone?.trim() || "",
        cor: payload.cor?.trim() || "#3de8a0",
        permiteCheckin: payload.permiteCheckin ?? true,
        checkinObrigatorio: payload.checkinObrigatorio ?? false,
        ativo: true,
      };
      atividades = [created, ...atividades];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades\/[^/]+$/.test(path) && method === "PUT") {
      const atividadeId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<AtividadeSeed> & { descricao?: string; icone?: string; cor?: string; permiteCheckin?: boolean; checkinObrigatorio?: boolean }>(request);
      atividades = atividades.map((item) =>
        item.id === atividadeId
          ? {
              ...item,
              nome: payload.nome?.trim() || item.nome,
              descricao: payload.descricao?.trim() || item.descricao,
              categoria: payload.categoria ?? item.categoria,
              icone: payload.icone?.trim() || item.icone,
              cor: payload.cor?.trim() || item.cor,
              permiteCheckin: payload.permiteCheckin ?? item.permiteCheckin,
              checkinObrigatorio: payload.checkinObrigatorio ?? item.checkinObrigatorio,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, atividades.find((item) => item.id === atividadeId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const atividadeId = path.split("/").at(-2) ?? "";
      atividades = atividades.map((item) =>
        item.id === atividadeId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, atividades.find((item) => item.id === atividadeId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades\/[^/]+$/.test(path) && method === "DELETE") {
      const atividadeId = path.split("/").at(-1) ?? "";
      atividades = atividades.filter((item) => item.id !== atividadeId);
      await fulfillNoContent(route);
      return;
    }

    if (path === "/api/v1/administrativo/atividades-grade" && method === "GET") {
      const tenantId = resolveTenantId(url);
      const atividadeId = url.searchParams.get("atividadeId")?.trim();
      const activeOnly = normalizeBooleanInput(url.searchParams.get("apenasAtivas"), false);
      await fulfillJson(
        route,
        filterActiveItems(
          atividadesGrade
            .filter((item) => item.tenantId === tenantId)
            .filter((item) => (atividadeId ? item.atividadeId === atividadeId : true)),
          activeOnly,
        ),
      );
      return;
    }

    if (path === "/api/v1/administrativo/atividades-grade" && method === "POST") {
      const payload = parseBody<Partial<(typeof atividadesGrade)[number]>>(request);
      const tenantId = resolveTenantId(url);
      const atividadeId = payload.atividadeId?.trim() || atividades[0]?.id || "";
      const salaId = payload.salaId?.trim() || salas.find((item) => item.tenantId === tenantId && item.ativo)?.id || undefined;
      const funcionarioId = payload.funcionarioId?.trim() || undefined;
      const created = {
        id: nextId("atividade-grade", "atividadeGrade"),
        tenantId,
        atividadeId,
        salaId,
        funcionarioId,
        diasSemana: payload.diasSemana?.length ? payload.diasSemana : ["SEG"],
        definicaoHorario: payload.definicaoHorario ?? "PREVIAMENTE",
        horaInicio: payload.horaInicio?.trim() || "07:00",
        horaFim: payload.horaFim?.trim() || "08:00",
        capacidade: Math.max(1, normalizeNumberInput(payload.capacidade, 20)),
        checkinLiberadoMinutosAntes: Math.max(0, normalizeNumberInput(payload.checkinLiberadoMinutosAntes, 60)),
        duracaoMinutos: Math.max(1, normalizeNumberInput(payload.duracaoMinutos, 60)),
        codigo: payload.codigo?.trim() || undefined,
        grupoAtividades: payload.grupoAtividades?.trim() || undefined,
        publico: payload.publico?.trim() || undefined,
        dificuldade: payload.dificuldade,
        descricaoAgenda: payload.descricaoAgenda?.trim() || undefined,
        acessoClientes: payload.acessoClientes ?? "TODOS_CLIENTES",
        permiteReserva: payload.permiteReserva ?? true,
        limitarVagasAgregadores: payload.limitarVagasAgregadores ?? false,
        exibirWellhub: payload.exibirWellhub ?? false,
        permitirSaidaAntesInicio: payload.permitirSaidaAntesInicio ?? false,
        permitirEscolherNumeroVaga: payload.permitirEscolherNumeroVaga ?? false,
        exibirNoAppCliente: payload.exibirNoAppCliente ?? true,
        exibirNoAutoatendimento: payload.exibirNoAutoatendimento ?? false,
        exibirNoWodTv: payload.exibirNoWodTv ?? false,
        finalizarAtividadeAutomaticamente: payload.finalizarAtividadeAutomaticamente ?? true,
        desabilitarListaEspera: payload.desabilitarListaEspera ?? false,
        local: payload.local?.trim() || salas.find((item) => item.id === salaId)?.nome,
        instrutor:
          payload.instrutor?.trim()
          || funcionarios.find((item) => item.id === funcionarioId)?.nome,
        ativo: true,
      };
      atividadesGrade = [created, ...atividadesGrade];
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades-grade\/[^/]+$/.test(path) && method === "PUT") {
      const gradeId = path.split("/").at(-1) ?? "";
      const payload = parseBody<Partial<(typeof atividadesGrade)[number]>>(request);
      atividadesGrade = atividadesGrade.map((item) =>
        item.id === gradeId
          ? {
              ...item,
              atividadeId: payload.atividadeId?.trim() || item.atividadeId,
              salaId: payload.salaId?.trim() || item.salaId,
              funcionarioId: payload.funcionarioId?.trim() || item.funcionarioId,
              diasSemana: payload.diasSemana?.length ? payload.diasSemana : item.diasSemana,
              definicaoHorario: payload.definicaoHorario ?? item.definicaoHorario,
              horaInicio: payload.horaInicio?.trim() || item.horaInicio,
              horaFim: payload.horaFim?.trim() || item.horaFim,
              capacidade: payload.capacidade == null ? item.capacidade : Math.max(1, normalizeNumberInput(payload.capacidade, item.capacidade)),
              checkinLiberadoMinutosAntes:
                payload.checkinLiberadoMinutosAntes == null
                  ? item.checkinLiberadoMinutosAntes
                  : Math.max(0, normalizeNumberInput(payload.checkinLiberadoMinutosAntes, item.checkinLiberadoMinutosAntes)),
              duracaoMinutos:
                payload.duracaoMinutos == null
                  ? item.duracaoMinutos
                  : Math.max(1, normalizeNumberInput(payload.duracaoMinutos, item.duracaoMinutos)),
              codigo: payload.codigo?.trim() || item.codigo,
              grupoAtividades: payload.grupoAtividades?.trim() || item.grupoAtividades,
              publico: payload.publico?.trim() || item.publico,
              dificuldade: payload.dificuldade ?? item.dificuldade,
              descricaoAgenda: payload.descricaoAgenda?.trim() || item.descricaoAgenda,
              acessoClientes: payload.acessoClientes ?? item.acessoClientes,
              permiteReserva: payload.permiteReserva ?? item.permiteReserva,
              limitarVagasAgregadores: payload.limitarVagasAgregadores ?? item.limitarVagasAgregadores,
              exibirWellhub: payload.exibirWellhub ?? item.exibirWellhub,
              permitirSaidaAntesInicio: payload.permitirSaidaAntesInicio ?? item.permitirSaidaAntesInicio,
              permitirEscolherNumeroVaga: payload.permitirEscolherNumeroVaga ?? item.permitirEscolherNumeroVaga,
              exibirNoAppCliente: payload.exibirNoAppCliente ?? item.exibirNoAppCliente,
              exibirNoAutoatendimento: payload.exibirNoAutoatendimento ?? item.exibirNoAutoatendimento,
              exibirNoWodTv: payload.exibirNoWodTv ?? item.exibirNoWodTv,
              finalizarAtividadeAutomaticamente: payload.finalizarAtividadeAutomaticamente ?? item.finalizarAtividadeAutomaticamente,
              desabilitarListaEspera: payload.desabilitarListaEspera ?? item.desabilitarListaEspera,
              local: payload.local?.trim() || item.local,
              instrutor: payload.instrutor?.trim() || item.instrutor,
              ativo: payload.ativo ?? item.ativo,
            }
          : item,
      );
      await fulfillJson(route, atividadesGrade.find((item) => item.id === gradeId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades-grade\/[^/]+\/toggle$/.test(path) && method === "PATCH") {
      const gradeId = path.split("/").at(-2) ?? "";
      atividadesGrade = atividadesGrade.map((item) =>
        item.id === gradeId
          ? {
              ...item,
              ativo: !item.ativo,
            }
          : item,
      );
      await fulfillJson(route, atividadesGrade.find((item) => item.id === gradeId) ?? null);
      return;
    }

    if (/^\/api\/v1\/administrativo\/atividades-grade\/[^/]+$/.test(path) && method === "DELETE") {
      const gradeId = path.split("/").at(-1) ?? "";
      atividadesGrade = atividadesGrade.filter((item) => item.id !== gradeId);
      await fulfillNoContent(route);
      return;
    }

      await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await fulfillJson(route, { message: `Admin stub failure: ${message}` }, 500);
    }
  });
}
