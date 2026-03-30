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
} as const;
