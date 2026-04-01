import { expect, test, type Page, type Route } from "@playwright/test";
import { installE2EAuthSession } from "./support/auth-session";

type FinanceDashboardState = {
  mrrAtual: number;
  mrrProjetado: number;
  totalAcademiasAtivas: number;
  totalInadimplentes: number;
  churnRateMensal: number;
  previsaoReceita: number;
  evolucaoMrr: Array<{ referencia: string; label: string; mrr: number }>;
  aging: Array<{ faixa: string; label: string; quantidade: number; valor: number }>;
  inadimplentes: Array<{
    academiaId: string;
    academiaNome: string;
    planoNome: string;
    valorEmAberto: number;
    diasEmAtraso: number;
    ultimaCobrancaVencida: string;
  }>;
  comparativoPlanos: Array<{
    planoId: string;
    planoNome: string;
    academiasAtivas: number;
    participacaoPct: number;
    mrr: number;
  }>;
};

type RbacPerfilSeed = {
  id: string;
  tenantId: string;
  roleName: string;
  displayName: string;
  description?: string;
  active: boolean;
};

type RbacFeatureSeed = {
  featureKey: string;
  enabled: boolean;
  rollout: number;
};

type RbacGrantSeed = {
  roleName: string;
  featureKey: string;
  permission: "VIEW" | "EDIT" | "MANAGE";
  allowed: boolean;
};

type AcademiaSeed = {
  id: string;
  nome: string;
  ativo: boolean;
};

type UnidadeSeed = {
  id: string;
  academiaId: string;
  nome: string;
  ativo: boolean;
};

type FeatureFlagMatrixSeed = {
  featureKey: string;
  featureLabel: string;
  moduleLabel: string;
  description: string;
  globalEnabled: boolean;
  academias: Record<string, boolean>;
};

type ComplianceAcademiaSeed = {
  academiaId: string;
  academiaNome: string;
  totalAlunos: number;
  alunosComCpf: number;
  alunosComEmail: number;
  alunosComTelefone: number;
  termosAceitos: number;
  termosPendentes: number;
  ultimaSolicitacaoExclusao?: string;
  statusTermos: "ACEITO" | "PARCIAL" | "PENDENTE";
  camposSensiveis: string[];
};

type ComplianceSolicitacaoSeed = {
  id: string;
  academiaId: string;
  academiaNome: string;
  alunoId: string;
  alunoNome: string;
  solicitadoEm: string;
  solicitadoPor: string;
  status: "PENDENTE" | "EM_PROCESSAMENTO" | "EXECUTADA" | "REJEITADA";
  motivo?: string;
};

type LeadSeed = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  nomeAcademia?: string;
  quantidadeAlunos?: number;
  cidade?: string;
  estado?: string;
  origem?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  status: "NOVO" | "CONTATADO" | "QUALIFICADO" | "NEGOCIANDO" | "CONVERTIDO" | "PERDIDO";
  notas?: string;
  dataCriacao: string;
  dataAtualizacao?: string;
};

type State = {
  financeDashboard: FinanceDashboardState;
  cobrancas: Array<{ id: string; referencia: string }>;
  contratos: Array<{ id: string; academiaNome: string; status: string }>;
  planos: Array<{ id: string; nome: string; ativo: boolean }>;
  gateways: Array<{ id: string; nome: string; ativo: boolean }>;
  perfis: RbacPerfilSeed[];
  features: RbacFeatureSeed[];
  grants: RbacGrantSeed[];
  academias: AcademiaSeed[];
  unidades: UnidadeSeed[];
  matrix: FeatureFlagMatrixSeed[];
  alertas: Array<{
    id: string;
    academiaNome: string;
    unidadeNome?: string;
    tipo: string;
    severidade: "CRITICAL" | "WARNING" | "INFO";
    titulo: string;
    descricao: string;
    acaoSugerida?: string;
    data?: string;
  }>;
  featureUsage: Array<{
    academiaId: string;
    academiaNome: string;
    treinos: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
    crm: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
    catraca: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
    vendasOnline: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
    bi: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
  }>;
  saude: Array<{
    academiaId: string;
    academiaNome: string;
    unidades: number;
    alunosAtivos: number;
    churnMensal: number;
    inadimplenciaPercentual: number;
    ultimoLoginAdmin?: string;
    statusContrato: "ATIVO" | "EM_RISCO" | "SUSPENSO" | "CANCELADO";
    planoContratado?: string;
    alertasRisco: string[];
    healthLevel: "SAUDAVEL" | "RISCO" | "CRITICO";
  }>;
  complianceAcademias: ComplianceAcademiaSeed[];
  complianceSolicitacoes: ComplianceSolicitacaoSeed[];
  leads: LeadSeed[];
};

function normalizedPath(path: string) {
  return path.replace(/^\/backend/, "");
}

function fulfillJson(route: Route, json: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: "application/json; charset=utf-8",
    body: JSON.stringify(json),
  });
}

function seedSession(page: Page) {
  return installE2EAuthSession(page, {
    activeTenantId: "tenant-centro",
    baseTenantId: "tenant-centro",
    availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
    userId: "user-root",
    userKind: "COLABORADOR",
    displayName: "Root Admin",
    roles: ["OWNER", "ADMIN"],
    availableScopes: ["GLOBAL"],
    broadAccess: true,
  });
}

function buildState(): State {
  return {
    financeDashboard: {
      mrrAtual: 185000,
      mrrProjetado: 198500,
      totalAcademiasAtivas: 24,
      totalInadimplentes: 2,
      churnRateMensal: 3.2,
      previsaoReceita: 201300,
      evolucaoMrr: [
        { referencia: "2026-01", label: "Jan/26", mrr: 160000 },
        { referencia: "2026-02", label: "Fev/26", mrr: 171500 },
        { referencia: "2026-03", label: "Mar/26", mrr: 185000 },
      ],
      aging: [
        { faixa: "0_30", label: "0-30 dias", quantidade: 3, valor: 4200 },
        { faixa: "31_60", label: "31-60 dias", quantidade: 1, valor: 1800 },
      ],
      inadimplentes: [
        {
          academiaId: "academia-norte",
          academiaNome: "Rede Norte",
          planoNome: "Enterprise",
          valorEmAberto: 5600,
          diasEmAtraso: 12,
          ultimaCobrancaVencida: "2026-03-20",
        },
      ],
      comparativoPlanos: [
        { planoId: "plano-enterprise", planoNome: "Enterprise", academiasAtivas: 10, participacaoPct: 55, mrr: 101750 },
        { planoId: "plano-growth", planoNome: "Growth", academiasAtivas: 14, participacaoPct: 45, mrr: 83250 },
      ],
    },
    cobrancas: [{ id: "cobranca-1", referencia: "Mensalidade março" }],
    contratos: [{ id: "contrato-1", academiaNome: "Rede Norte", status: "ATIVO" }],
    planos: [{ id: "plano-1", nome: "Enterprise", ativo: true }],
    gateways: [{ id: "gateway-1", nome: "Pagar.me principal", ativo: true }],
    perfis: [
      {
        id: "perfil-admin-centro",
        tenantId: "tenant-centro",
        roleName: "ADMIN",
        displayName: "Administrador",
        description: "Governança operacional ampliada.",
        active: true,
      },
      {
        id: "perfil-gerente-centro",
        tenantId: "tenant-centro",
        roleName: "GERENTE",
        displayName: "Gerente",
        description: "Gestão local.",
        active: true,
      },
    ],
    features: [
      { featureKey: "feature.treinos", enabled: true, rollout: 100 },
      { featureKey: "feature.financeiro", enabled: true, rollout: 40 },
    ],
    grants: [
      { roleName: "ADMIN", featureKey: "feature.treinos", permission: "MANAGE", allowed: true },
      { roleName: "ADMIN", featureKey: "feature.financeiro", permission: "MANAGE", allowed: true },
      { roleName: "GERENTE", featureKey: "feature.treinos", permission: "VIEW", allowed: true },
    ],
    academias: [
      { id: "academia-norte", nome: "Rede Norte", ativo: true },
      { id: "academia-sul", nome: "Rede Sul", ativo: true },
    ],
    unidades: [
      { id: "tenant-centro", academiaId: "academia-norte", nome: "Centro", ativo: true },
      { id: "tenant-maracana", academiaId: "academia-norte", nome: "Maracana - S6", ativo: true },
      { id: "tenant-barra", academiaId: "academia-sul", nome: "Barra", ativo: false },
    ],
    matrix: [
      {
        featureKey: "feature.treinos",
        featureLabel: "Gestão de treinos",
        moduleLabel: "Treinos",
        description: "Capacidade operacional de treinos propagada por academia.",
        globalEnabled: true,
        academias: {
          "academia-norte": true,
          "academia-sul": true,
        },
      },
      {
        featureKey: "feature.financeiro",
        featureLabel: "Gestão financeira",
        moduleLabel: "Financeiro",
        description: "Capacidade financeira propagada por academia.",
        globalEnabled: true,
        academias: {
          "academia-norte": true,
          "academia-sul": false,
        },
      },
    ],
    alertas: [
      {
        id: "alerta-1",
        academiaNome: "Rede Norte",
        unidadeNome: "Centro",
        tipo: "CONTRATO_VENCENDO",
        severidade: "CRITICAL",
        titulo: "Contrato vencendo em 7 dias",
        descricao: "Renovacao comercial pendente para a unidade Centro.",
        acaoSugerida: "Acionar CS e financeiro.",
        data: "2026-03-29T09:00:00",
      },
      {
        id: "alerta-2",
        academiaNome: "Rede Sul",
        unidadeNome: "Barra",
        tipo: "SEM_LOGIN_ADMIN",
        severidade: "WARNING",
        titulo: "Admin sem login recente",
        descricao: "Nenhum acesso administrativo em 14 dias.",
        acaoSugerida: "Contato de onboarding.",
        data: "2026-03-28T12:00:00",
      },
    ],
    featureUsage: [
      {
        academiaId: "academia-norte",
        academiaNome: "Rede Norte",
        treinos: { ativa: true, emUso: true, ultimoUsoEm: "2026-03-29T08:00:00" },
        crm: { ativa: true, emUso: false },
        catraca: { ativa: true, emUso: true, ultimoUsoEm: "2026-03-29T07:45:00" },
        vendasOnline: { ativa: false, emUso: false },
        bi: { ativa: true, emUso: true, ultimoUsoEm: "2026-03-29T06:30:00" },
      },
      {
        academiaId: "academia-sul",
        academiaNome: "Rede Sul",
        treinos: { ativa: true, emUso: false },
        crm: { ativa: false, emUso: false },
        catraca: { ativa: false, emUso: false },
        vendasOnline: { ativa: true, emUso: false },
        bi: { ativa: true, emUso: false },
      },
    ],
    saude: [
      {
        academiaId: "academia-norte",
        academiaNome: "Rede Norte",
        unidades: 2,
        alunosAtivos: 1820,
        churnMensal: 2.9,
        inadimplenciaPercentual: 4.5,
        ultimoLoginAdmin: "2026-03-29T10:15:00",
        statusContrato: "ATIVO",
        planoContratado: "Enterprise",
        alertasRisco: [],
        healthLevel: "SAUDAVEL",
      },
      {
        academiaId: "academia-sul",
        academiaNome: "Rede Sul",
        unidades: 1,
        alunosAtivos: 420,
        churnMensal: 9.8,
        inadimplenciaPercentual: 12.4,
        ultimoLoginAdmin: "2026-03-10T09:00:00",
        statusContrato: "EM_RISCO",
        planoContratado: "Growth",
        alertasRisco: ["Churn acima da media", "Pouco uso administrativo"],
        healthLevel: "CRITICO",
      },
    ],
    complianceAcademias: [
      {
        academiaId: "academia-norte",
        academiaNome: "Rede Norte",
        totalAlunos: 1820,
        alunosComCpf: 1800,
        alunosComEmail: 1750,
        alunosComTelefone: 1720,
        termosAceitos: 1710,
        termosPendentes: 110,
        ultimaSolicitacaoExclusao: "2026-03-20",
        statusTermos: "PARCIAL",
        camposSensiveis: ["cpf", "email", "telefone"],
      },
      {
        academiaId: "academia-sul",
        academiaNome: "Rede Sul",
        totalAlunos: 420,
        alunosComCpf: 410,
        alunosComEmail: 405,
        alunosComTelefone: 390,
        termosAceitos: 300,
        termosPendentes: 120,
        statusTermos: "PENDENTE",
        camposSensiveis: ["cpf", "email"],
      },
    ],
    complianceSolicitacoes: [
      {
        id: "solicitacao-1",
        academiaId: "academia-norte",
        academiaNome: "Rede Norte",
        alunoId: "aluno-1",
        alunoNome: "Marina Lima",
        solicitadoEm: "2026-03-28T14:30:00",
        solicitadoPor: "DPO",
        status: "PENDENTE",
      },
    ],
    leads: [
      {
        id: "lead-1",
        nome: "Academia Coliseu",
        email: "contato@coliseu.fit",
        telefone: "(21) 99999-0001",
        nomeAcademia: "Academia Coliseu",
        quantidadeAlunos: 650,
        cidade: "Rio de Janeiro",
        estado: "RJ",
        origem: "LANDING_PAGE",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "franquias",
        status: "NOVO",
        notas: "Primeiro contato pendente.",
        dataCriacao: "2026-03-25T09:10:00",
        dataAtualizacao: "2026-03-25T09:10:00",
      },
    ],
  };
}

function buildFeatureFlagsMatrixPayload(state: State) {
  return {
    academias: state.academias.map((academia) => {
      const unidades = state.unidades.filter((item) => item.academiaId === academia.id);
      return {
        academiaId: academia.id,
        academiaNome: academia.nome,
        totalUnits: unidades.length,
        activeUnits: unidades.filter((item) => item.ativo).length,
      };
    }),
    features: state.matrix.map((item) => ({
      featureKey: item.featureKey,
      featureLabel: item.featureLabel,
      moduleLabel: item.moduleLabel,
      description: item.description,
      globalEnabled: item.globalEnabled,
      globalSource: "GLOBAL",
      academias: state.academias.map((academia) => {
        const enabled = item.academias[academia.id] ?? item.globalEnabled;
        const unidades = state.unidades.filter((tenant) => tenant.academiaId === academia.id);
        const propagatedUnits = enabled ? unidades.length : 0;
        return {
          academiaId: academia.id,
          academiaNome: academia.nome,
          enabled,
          effectiveEnabled: enabled,
          inheritedFromGlobal: enabled === item.globalEnabled,
          propagationStatus:
            unidades.length === 0 ? "PENDENTE" : propagatedUnits === unidades.length ? "TOTAL" : "PARCIAL",
          propagatedUnits,
          totalUnits: unidades.length,
        };
      }),
    })),
  };
}

function buildComplianceDashboard(state: State) {
  const pendentes = state.complianceSolicitacoes.filter((item) => item.status === "PENDENTE");
  const termosAceitos = state.complianceAcademias.reduce((acc, item) => acc + item.termosAceitos, 0);
  const termosPendentes = state.complianceAcademias.reduce((acc, item) => acc + item.termosPendentes, 0);
  const totalDadosPessoaisArmazenados = state.complianceAcademias.reduce((acc, item) => acc + item.totalAlunos, 0);

  return {
    totalDadosPessoaisArmazenados,
    solicitacoesExclusaoPendentes: pendentes.length,
    termosAceitos,
    termosPendentes,
    academias: state.complianceAcademias,
    solicitacoesPendentes: state.complianceSolicitacoes,
    exposicaoCamposSensiveis: [],
  };
}

async function setupMocks(page: Page, state: State) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizedPath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/me" && method === "GET") {
      await fulfillJson(route, {
        id: "user-root",
        userId: "user-root",
        nome: "Root Admin",
        displayName: "Root Admin",
        email: "root@qa.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        redeId: "academia-norte",
        redeNome: "Rede Norte",
        redeSlug: "rede-norte",
        activeTenantId: "tenant-centro",
        availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
      });
      return;
    }

    if (path === "/api/v1/app/bootstrap" && method === "GET") {
      await fulfillJson(route, {
        user: {
          id: "user-root",
          userId: "user-root",
          nome: "Root Admin",
          displayName: "Root Admin",
          email: "root@qa.local",
          roles: ["OWNER", "ADMIN"],
          userKind: "COLABORADOR",
          redeId: "academia-norte",
          redeNome: "Rede Norte",
          redeSlug: "rede-norte",
          activeTenantId: "tenant-centro",
          availableTenants: [{ tenantId: "tenant-centro", defaultTenant: true }],
        },
        tenantContext: {
          currentTenantId: "tenant-centro",
          tenantAtual: {
            id: "tenant-centro",
            academiaId: "academia-norte",
            groupId: "academia-norte",
            nome: "Centro",
            ativo: true,
          },
          unidadesDisponiveis: [
            {
              id: "tenant-centro",
              academiaId: "academia-norte",
              groupId: "academia-norte",
              nome: "Centro",
              ativo: true,
            },
          ],
        },
        academia: { id: "academia-norte", nome: "Rede Norte", ativo: true },
        capabilities: { canAccessElevatedModules: true },
      });
      return;
    }

    if (path === "/api/v1/context/unidade-ativa" && (method === "GET" || method === "PUT")) {
      await fulfillJson(route, {
        currentTenantId: "tenant-centro",
        tenantAtual: {
          id: "tenant-centro",
          academiaId: "academia-norte",
          groupId: "academia-norte",
          nome: "Centro",
          ativo: true,
        },
        unidadesDisponiveis: [
          {
            id: "tenant-centro",
            academiaId: "academia-norte",
            groupId: "academia-norte",
            nome: "Centro",
            ativo: true,
          },
        ],
      });
      return;
    }

    if (path === "/api/v1/auth/refresh") {
      await fulfillJson(route, { token: "token-e2e", refreshToken: "refresh-e2e", type: "Bearer" });
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await fulfillJson(route, state.academias);
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await fulfillJson(route, state.unidades.map((item) => ({
        id: item.id,
        academiaId: item.academiaId,
        groupId: item.academiaId,
        nome: item.nome,
        ativo: item.ativo,
      })));
      return;
    }

    if (path === "/api/v1/admin/financeiro/dashboard" && method === "GET") {
      await fulfillJson(route, state.financeDashboard);
      return;
    }

    if (path === "/api/v1/admin/financeiro/cobrancas" && method === "GET") {
      await fulfillJson(route, state.cobrancas);
      return;
    }

    if (path === "/api/v1/admin/financeiro/contratos" && method === "GET") {
      await fulfillJson(route, state.contratos);
      return;
    }

    if (path === "/api/v1/admin/financeiro/planos" && method === "GET") {
      await fulfillJson(route, state.planos);
      return;
    }

    if (path === "/api/v1/admin/financeiro/gateways" && method === "GET") {
      await fulfillJson(route, state.gateways);
      return;
    }

    if (path === "/api/v1/auth/perfis" && method === "GET") {
      await fulfillJson(route, { items: state.perfis });
      return;
    }

    if (path === "/api/v1/auth/features" && method === "GET") {
      await fulfillJson(route, state.features);
      return;
    }

    if (path === "/api/v1/auth/features/grants" && method === "GET") {
      await fulfillJson(route, state.grants);
      return;
    }

    if (path === "/api/v1/admin/configuracoes/feature-flags/matrix" && method === "GET") {
      await fulfillJson(route, buildFeatureFlagsMatrixPayload(state));
      return;
    }

    if (/^\/api\/v1\/admin\/configuracoes\/feature-flags\/[^/]+\/(global|academias\/[^/]+)$/.test(path) && method === "PATCH") {
      const body = request.postDataJSON() as { enabled?: boolean };
      const segments = path.split("/");
      const featureKey = decodeURIComponent(segments[6] ?? "");
      const academiaId = segments[7] === "academias" ? segments[8] : undefined;
      const row = state.matrix.find((item) => item.featureKey === featureKey);
      if (!row || typeof body.enabled !== "boolean") {
        await fulfillJson(route, { message: "Payload invalido" }, 400);
        return;
      }
      if (academiaId) {
        row.academias[academiaId] = body.enabled;
      } else {
        row.globalEnabled = body.enabled;
      }
      await fulfillJson(route, buildFeatureFlagsMatrixPayload(state));
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/alertas" && method === "GET") {
      await fulfillJson(route, { items: state.alertas });
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/features" && method === "GET") {
      await fulfillJson(route, { items: state.featureUsage });
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/saude" && method === "GET") {
      await fulfillJson(route, { items: state.saude });
      return;
    }

    if (path === "/api/v1/administrativo/compliance/dashboard" && method === "GET") {
      await fulfillJson(route, buildComplianceDashboard(state));
      return;
    }

    if (/^\/api\/v1\/administrativo\/compliance\/solicitacoes\/[^/]+\/executar$/.test(path) && method === "POST") {
      const solicitationId = path.split("/").at(-2);
      state.complianceSolicitacoes = state.complianceSolicitacoes.map((item) =>
        item.id === solicitationId ? { ...item, status: "EXECUTADA", motivo: "Executada pelo backoffice" } : item,
      );
      await fulfillJson(route, {});
      return;
    }

    if (/^\/api\/v1\/administrativo\/compliance\/solicitacoes\/[^/]+\/rejeitar$/.test(path) && method === "POST") {
      const solicitationId = path.split("/").at(-2);
      const body = request.postDataJSON() as { motivo?: string };
      state.complianceSolicitacoes = state.complianceSolicitacoes.map((item) =>
        item.id === solicitationId ? { ...item, status: "REJEITADA", motivo: body.motivo ?? "Sem motivo" } : item,
      );
      await fulfillJson(route, {});
      return;
    }

    if (path === "/api/v1/admin/leads" && method === "GET") {
      await fulfillJson(route, state.leads);
      return;
    }

    if (path === "/api/v1/admin/leads/stats" && method === "GET") {
      const stats = {
        total: state.leads.length,
        novos: state.leads.filter((item) => item.status === "NOVO").length,
        contatados: state.leads.filter((item) => item.status === "CONTATADO").length,
        qualificados: state.leads.filter((item) => item.status === "QUALIFICADO").length,
        negociando: state.leads.filter((item) => item.status === "NEGOCIANDO").length,
        convertidos: state.leads.filter((item) => item.status === "CONVERTIDO").length,
        perdidos: state.leads.filter((item) => item.status === "PERDIDO").length,
      };
      await fulfillJson(route, stats);
      return;
    }

    if (/^\/api\/v1\/admin\/leads\/[^/]+$/.test(path) && method === "GET") {
      const leadId = path.split("/").at(-1);
      const lead = state.leads.find((item) => item.id === leadId);
      await fulfillJson(route, lead ?? { message: "Lead nao encontrado" }, lead ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/leads\/[^/]+\/notas$/.test(path) && method === "PATCH") {
      const leadId = path.split("/").at(-2);
      const body = request.postDataJSON() as { notas?: string };
      state.leads = state.leads.map((item) =>
        item.id === leadId ? { ...item, notas: body.notas ?? "", dataAtualizacao: "2026-03-30T08:00:00" } : item,
      );
      const updated = state.leads.find((item) => item.id === leadId);
      await fulfillJson(route, updated ?? { message: "Lead nao encontrado" }, updated ? 200 : 404);
      return;
    }

    if (/^\/api\/v1\/admin\/leads\/[^/]+\/status$/.test(path) && method === "PATCH") {
      const leadId = path.split("/").at(-2);
      const body = request.postDataJSON() as { status?: LeadSeed["status"] };
      state.leads = state.leads.map((item) =>
        item.id === leadId ? { ...item, status: body.status ?? item.status, dataAtualizacao: "2026-03-30T08:10:00" } : item,
      );
      const updated = state.leads.find((item) => item.id === leadId);
      await fulfillJson(route, updated ?? { message: "Lead nao encontrado" }, updated ? 200 : 404);
      return;
    }

    await fulfillJson(route, { message: `Unhandled ${method} ${path}` }, 404);
  });
}

async function openBackofficePage(page: Page, path: string, heading: string | RegExp) {
  await seedSession(page);
  const state = buildState();
  await setupMocks(page, state);
  await page.goto(path);
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  return state;
}

test.describe("Admin backoffice coverage", () => {
  test("cobre dashboard financeiro e modulos satelites", async ({ page }) => {
    await openBackofficePage(page, "/admin/financeiro", /Dashboard financeiro da plataforma/i);

    await expect(page.getByText("Rede Norte")).toBeVisible();
    await expect(page.getByRole("cell", { name: "Enterprise" })).toBeVisible();

    await page.getByRole("link", { name: "Ver contratos" }).click();
    await expect(page).toHaveURL(/\/admin\/financeiro\/contratos$/);
    await expect(page.getByRole("heading", { name: /Contratos da plataforma/i })).toBeVisible();
    await expect(page.getByText("Rede Norte")).toBeVisible();

    await page.goto("/admin/financeiro/planos");
    await expect(page.getByRole("heading", { name: /Planos da plataforma/i })).toBeVisible();
    await expect(page.getByText("Enterprise")).toBeVisible();

    await page.goto("/admin/financeiro/cobrancas");
    await expect(page.getByRole("heading", { name: /Cobranças da plataforma/i })).toBeVisible();
    await expect(page.getByRole("button", { name: "Nova cobrança" })).toBeVisible();

    await page.goto("/admin/financeiro/gateways");
    await expect(page.getByRole("heading", { name: /Gateways de pagamento/i })).toBeVisible();
    await expect(page.getByText("Pagar.me principal")).toBeVisible();
  });

  test("cobre governanca de seguranca global por feature flag", async ({ page }) => {
    const state = await openBackofficePage(page, "/admin/seguranca/funcionalidades", /Funcionalidades/i);

    await expect(page.getByText("Feature flags por academia")).toBeVisible();
    await expect(page.getByRole("button", { name: /Gestão financeira Financeiro/i })).toBeVisible();

    const redeSulFinanceiroButton = page.getByRole("button", { name: "Rede Sul Gestão financeira" });
    await expect(redeSulFinanceiroButton).toHaveText("Desligada");
    await redeSulFinanceiroButton.click();
    await expect(redeSulFinanceiroButton).toHaveText("Ligada");

    await expect.poll(() => {
      const row = state.matrix.find((item) => item.featureKey === "feature.financeiro");
      return row?.academias["academia-sul"];
    }).toBe(true);
  });

  test("cobre operacao global entre alertas, saude, compliance e leads", async ({ page }) => {
    const state = await openBackofficePage(page, "/admin/operacional/alertas", /Alertas e uso de features/i);

    await expect(page.getByText("Contrato vencendo em 7 dias")).toBeVisible();
    await expect(page.getByText("Rede Norte", { exact: true })).toBeVisible();

    await page.goto("/admin/operacional/saude");
    await expect(page.getByRole("heading", { name: /Mapa de saúde das academias/i })).toBeVisible();
    await expect(page.getByText("Rede Sul", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Growth", { exact: true }).first()).toBeVisible();

    await page.goto("/admin/compliance");
    await expect(page.getByRole("heading", { name: /Compliance LGPD/i })).toBeVisible();
    await expect(page.getByText("Marina Lima")).toBeVisible();
    await page.getByRole("button", { name: "Executar" }).click();
    await page.getByRole("button", { name: "Executar exclusão" }).click();
    await expect.poll(() =>
      state.complianceSolicitacoes.find((item) => item.id === "solicitacao-1")?.status,
    ).toBe("EXECUTADA");

    await page.goto("/admin/leads");
    await expect(page.getByRole("heading", { name: /Gestão de Leads B2B/i })).toBeVisible();
    await page.getByRole("cell", { name: "Academia Coliseu" }).click();
    await expect(page.getByText("Primeiro contato pendente.")).toBeVisible();
    await page.getByRole("combobox").last().click();
    await page.getByRole("option", { name: "Qualificado" }).click();
    await expect.poll(() => state.leads.find((item) => item.id === "lead-1")?.status).toBe("QUALIFICADO");
    await page.getByPlaceholder("Adicione observações sobre este lead...").fill("Lead qualificado com documentação enviada.");
    await page.getByRole("button", { name: "Salvar notas" }).click();
    await expect.poll(() => state.leads.find((item) => item.id === "lead-1")?.notas).toBe(
      "Lead qualificado com documentação enviada.",
    );
  });
});
