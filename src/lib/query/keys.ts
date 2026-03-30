export const queryKeys = {
  dashboard: (tenantId: string, referenceDate: string) =>
    ["dashboard", tenantId, referenceDate] as const,

  clientes: {
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
  },
} as const;
