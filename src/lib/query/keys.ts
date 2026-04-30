export const queryKeys = {
  /** `scope`: FULL | CLIENTES | VENDAS | FINANCEIRO — cache separado por aba sob demanda. */
  dashboard: (tenantId: string, referenceDate: string, scope = "FULL" as string) =>
    ["dashboard", tenantId, referenceDate, scope] as const,

  billingConfig: (tenantId: string) =>
    ["billingConfig", tenantId] as const,

  assinaturas: {
    all: (tenantId: string) => ["assinaturas", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["assinaturas", "list", tenantId, filters] as const,
  },

  clientes: {
    all: (tenantId: string) => ["clientes", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["clientes", "list", tenantId, filters] as const,
  },

  pagamentos: {
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["pagamentos", "list", tenantId, filters] as const,
  },

  // ── Admin / Backoffice ──────────────────────────────────────────────
  admin: {
    academias: {
      all: () => ["admin", "academias"] as const,
      list: () => ["admin", "academias", "list"] as const,
      detail: (id: string) => ["admin", "academias", "detail", id] as const,
    },
    unidades: {
      all: () => ["admin", "unidades"] as const,
      list: () => ["admin", "unidades", "list"] as const,
    },
    auditLog: {
      all: () => ["admin", "audit-log"] as const,
      list: (filters: Record<string, unknown>) =>
        ["admin", "audit-log", "list", filters] as const,
    },
    financeiro: {
      all: () => ["admin", "financeiro"] as const,
      dashboard: (periodo: string) =>
        ["admin", "financeiro", "dashboard", periodo] as const,
      cobrancas: () => ["admin", "financeiro", "cobrancas"] as const,
      contratos: () => ["admin", "financeiro", "contratos"] as const,
      planos: () => ["admin", "financeiro", "planos"] as const,
      gateways: () => ["admin", "financeiro", "gateways"] as const,
    },
    seguranca: {
      all: () => ["admin", "seguranca"] as const,
      overview: () => ["admin", "seguranca", "overview"] as const,
      eligiblePreview: () =>
        ["admin", "seguranca", "eligible-preview"] as const,
      funcionalidades: (tenantId: string) =>
        ["admin", "seguranca", "funcionalidades", tenantId] as const,
      perfis: (tenantId: string) =>
        ["admin", "seguranca", "perfis", tenantId] as const,
      revisoes: () => ["admin", "seguranca", "revisoes"] as const,
      catalogo: () => ["admin", "seguranca", "catalogo"] as const,
      perfisPadrao: () => ["admin", "seguranca", "perfis-padrao"] as const,
      reviewBoard: () => ["admin", "seguranca", "review-board"] as const,
    },
    operacional: {
      all: () => ["admin", "operacional"] as const,
      alertas: () => ["admin", "operacional", "alertas"] as const,
      saude: () => ["admin", "operacional", "saude"] as const,
    },
    leads: {
      all: () => ["admin", "leads"] as const,
      list: () => ["admin", "leads", "list"] as const,
      stats: () => ["admin", "leads", "stats"] as const,
      detail: (id: string) => ["admin", "leads", "detail", id] as const,
    },
    compliance: {
      all: () => ["admin", "compliance"] as const,
      dashboard: () => ["admin", "compliance", "dashboard"] as const,
    },
    busca: {
      results: (query: string, size: number) =>
        ["admin", "busca", query, size] as const,
    },
    bi: {
      academias: () => ["admin", "bi", "academias"] as const,
      executivo: (academiaId: string) =>
        ["admin", "bi", "executivo", academiaId] as const,
    },
    configuracoes: {
      all: () => ["admin", "configuracoes"] as const,
      integrations: () => ["admin", "configuracoes", "integrations"] as const,
      config: () => ["admin", "configuracoes", "config"] as const,
    },
    agregadores: {
      all: () => ["admin", "agregadores"] as const,
      schema: () => ["admin", "agregadores", "schema"] as const,
      configs: (tenantId: string) =>
        ["admin", "agregadores", "configs", tenantId] as const,
      eventos: (tenantId: string, filters: Record<string, unknown>) =>
        ["admin", "agregadores", "eventos", tenantId, filters] as const,
      dashboard: (tenantId: string, params: Record<string, unknown>) =>
        ["admin", "agregadores", "dashboard", tenantId, params] as const,
    },
  },

  contratos: {
    all: (tenantId: string) => ["contratos", tenantId] as const,
    byAluno: (tenantId: string, alunoId: string) =>
      ["contratos", tenantId, "aluno", alunoId] as const,
    creditosDias: (tenantId: string, contratoId: string) =>
      ["contratos", tenantId, "creditos-dias", contratoId] as const,
    dashboard: (tenantId: string, monthKey: string, page: number, filters?: Record<string, unknown>) =>
      ["contratos", "dashboard", tenantId, monthKey, page, filters] as const,
    evolucaoCanais: (tenantId: string, monthKey: string, meses: number) =>
      ["contratos", "evolucao-canais", tenantId, monthKey, meses] as const,
    origemAlunos: (tenantId: string, monthKey: string) =>
      ["contratos", "origem-alunos", tenantId, monthKey] as const,
    sinaisRetencao: (tenantId: string, monthKey: string) =>
      ["contratos", "sinais-retencao", tenantId, monthKey] as const,
    carteiraSnapshot: (tenantId: string, dataIso: string) =>
      ["contratos", "carteira-snapshot", tenantId, dataIso] as const,
    carteiraSerieMensal: (tenantId: string, monthKey: string) =>
      ["contratos", "carteira-serie-mensal", tenantId, monthKey] as const,
  },

  prospects: {
    all: (tenantId: string) => ["prospects", tenantId] as const,
  },

  dunning: {
    dashboard: (tenantId: string) =>
      ["dunning", "dashboard", tenantId] as const,
    intervencoes: (tenantId: string, filters: Record<string, unknown>) =>
      ["dunning", "intervencoes", tenantId, filters] as const,
    templates: (tenantId: string) =>
      ["dunning", "templates", tenantId] as const,
  },

  contasReceber: {
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["contasReceber", "list", tenantId, filters] as const,
  },

  dre: {
    gerencial: (tenantId: string, periodo: string) =>
      ["dre", "gerencial", tenantId, periodo] as const,
    projecao: (tenantId: string, startDate: string, endDate: string, cenario: string) =>
      ["dre", "projecao", tenantId, startDate, endDate, cenario] as const,
  },

  recebimentos: {
    all: (tenantId: string) => ["recebimentos", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["recebimentos", "list", tenantId, filters] as const,
  },

  vendas: {
    all: (tenantId: string) => ["vendas", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["vendas", "list", tenantId, filters] as const,
  },

  crm: {
    all: (tenantId: string) => ["crm", tenantId] as const,
    snapshot: (tenantId: string) => ["crm", "snapshot", tenantId] as const,
    playbooks: (tenantId: string) => ["crm", "playbooks", tenantId] as const,
    cadencias: (tenantId: string) => ["crm", "cadencias", tenantId] as const,
  },

  aulas: {
    sessoes: (tenantId: string, dateFrom: string, dateTo: string) =>
      ["aulas", "sessoes", tenantId, dateFrom, dateTo] as const,
    minhasReservas: (tenantId: string, alunoId: string) =>
      ["aulas", "reservas", tenantId, alunoId] as const,
  },

  grade: {
    all: (tenantId: string) => ["grade", tenantId] as const,
    week: (tenantId: string) => ["grade", "week", tenantId] as const,
  },

  crmTasks: {
    all: (tenantId: string) => ["crmTasks", tenantId] as const,
  },

  crmCampanhas: {
    all: (tenantId: string) => ["crmCampanhas", tenantId] as const,
    list: (tenantId: string, status?: string) =>
      ["crmCampanhas", "list", tenantId, status] as const,
  },

  whatsapp: {
    config: (tenantId: string) => ["whatsapp", "config", tenantId] as const,
    templates: (tenantId: string) => ["whatsapp", "templates", tenantId] as const,
    logs: (tenantId: string) => ["whatsapp", "logs", tenantId] as const,
  },

  conversas: {
    all: (tenantId: string) => ["conversas", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>, page: number) =>
      ["conversas", "list", tenantId, filters, page] as const,
    detail: (tenantId: string, id: string) =>
      ["conversas", "detail", tenantId, id] as const,
    thread: (tenantId: string, id: string, page: number) =>
      ["conversas", "thread", tenantId, id, page] as const,
  },

  credentials: {
    all: (tenantId: string) => ["whatsapp", "credentials", tenantId] as const,
    health: (tenantId: string, id: string) =>
      ["whatsapp", "credentials", "health", tenantId, id] as const,
  },

  agregadores: {
    all: (tenantId: string) => ["agregadores", tenantId] as const,
    list: (tenantId: string) => ["agregadores", "list", tenantId] as const,
  },

  catracaAcessos: {
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["catracaAcessos", "list", tenantId, filters] as const,
  },

  treinos: {
    detail: (tenantId: string, id: string) =>
      ["treinos", "detail", tenantId, id] as const,
    atribuidos: (tenantId: string) =>
      ["treinos", "atribuidos", tenantId] as const,
    exercicios: (tenantId: string, filters?: Record<string, unknown>) =>
      ["treinos", "exercicios", tenantId, filters] as const,
    gruposMusculares: (tenantId: string) =>
      ["treinos", "gruposMusculares", tenantId] as const,
  },

  meusTreinos: {
    list: (tenantId: string, userId: string) =>
      ["meusTreinos", tenantId, userId] as const,
  },

  checkIn: {
    presencas: (tenantId: string, userId: string) =>
      ["checkIn", "presencas", tenantId, userId] as const,
  },

  appCliente: {
    contexto: (tenantId: string) =>
      ["appCliente", "contexto", tenantId] as const,
    homeSnapshot: (tenantId: string) =>
      ["appCliente", "homeSnapshot", tenantId] as const,
    carteirinha: (tenantId: string) =>
      ["appCliente", "carteirinha", tenantId] as const,
    contratos: (tenantId: string) =>
      ["appCliente", "contratos", tenantId] as const,
    contratoDetalhe: (tenantId: string, id: string) =>
      ["appCliente", "contratos", tenantId, id] as const,
    cobrancas: (tenantId: string) =>
      ["appCliente", "cobrancas", tenantId] as const,
    cobrancaDetalhe: (tenantId: string, id: string) =>
      ["appCliente", "cobrancas", tenantId, id] as const,
    inadimplencia: (tenantId: string) =>
      ["appCliente", "inadimplencia", tenantId] as const,
  },

  funcionarios: {
    all: () => ["funcionarios"] as const,
  },

  bi: {
    filters: () => ["bi", "filters"] as const,
    snapshot: (
      scope: string,
      tenantId: string,
      academiaId: string,
      startDate: string,
      endDate: string,
      segmento: string,
    ) =>
      [
        "bi",
        "snapshot",
        scope,
        tenantId,
        academiaId,
        startDate,
        endDate,
        segmento,
      ] as const,
    receita: (tenantId: string, inicio?: string, fim?: string) =>
      ["bi", "receita", tenantId, inicio, fim] as const,
    retencao: (tenantId: string, meses?: number) =>
      ["bi", "retencao", tenantId, meses] as const,
    inadimplencia: (tenantId: string) =>
      ["bi", "inadimplencia", tenantId] as const,
  },
} as const;
