export const queryKeys = {
  dashboard: (tenantId: string, referenceDate: string) =>
    ["dashboard", tenantId, referenceDate] as const,

  clientes: {
    all: (tenantId: string) => ["clientes", tenantId] as const,
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["clientes", "list", tenantId, filters] as const,
  },

  pagamentos: {
    list: (tenantId: string, filters: Record<string, unknown>) =>
      ["pagamentos", "list", tenantId, filters] as const,
  },

  matriculas: {
    dashboard: (tenantId: string, monthKey: string, page: number) =>
      ["matriculas", "dashboard", tenantId, monthKey, page] as const,
  },

  prospects: {
    all: (tenantId: string) => ["prospects", tenantId] as const,
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
} as const;
