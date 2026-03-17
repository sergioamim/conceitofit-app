import type { Page, Request, Route } from "@playwright/test";

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
  }
) {
  const payload = {
    accessToken: "token-e2e",
    refreshToken: "refresh-e2e",
    tokenType: "Bearer",
    tenantId: options.tenantId,
    preferredTenantId: options.tenantId,
    availableTenants:
      options.availableTenants ?? [{ tenantId: options.tenantId, defaultTenant: true }],
  };

  await page.addInitScript((session) => {
    window.localStorage.setItem("academia-auth-token", session.accessToken);
    window.localStorage.setItem("academia-auth-refresh-token", session.refreshToken);
    window.localStorage.setItem("academia-auth-token-type", session.tokenType);
    window.localStorage.setItem("academia-auth-active-tenant-id", session.tenantId);
    window.localStorage.setItem("academia-auth-preferred-tenant-id", session.preferredTenantId);
    window.localStorage.setItem(
      "academia-auth-available-tenants",
      JSON.stringify(session.availableTenants),
    );
  }, payload);
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
  let prospects: ProspectSeed[] = [];
  let alunos: AlunoSeed[] = [];
  let matriculas: MatriculaSeed[] = [];
  let pagamentos: PagamentoSeed[] = [];
  let vendas: VendaSeed[] = [];

  function getTenantFromRequest(url: URL): TenantSeed {
    const queryTenant = url.searchParams.get("tenantId");
    const tenantId = queryTenant?.trim() || currentTenantId;
    const tenant = tenants.find((item) => item.id === tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} não encontrado no stub`);
    }
    return tenant;
  }

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizeApiPath(url.pathname);
    const method = request.method();

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

    if (/^\/api\/v1\/comercial\/alunos\/[^/]+$/.test(path) && method === "GET") {
      const alunoId = path.split("/").at(-1) ?? "";
      const aluno = alunos.find((item) => item.id === alunoId);
      await fulfillJson(route, aluno ?? { message: "Aluno não encontrado" }, aluno ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/comercial\/alunos\/[^/]+\/(?:matriculas|adesoes)$/.test(path) && method === "GET") {
      const alunoId = path.split("/").at(-2) ?? "";
      await fulfillJson(route, matriculas.filter((item) => item.alunoId === alunoId));
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
