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

  grade: {
    all: (tenantId: string) => ["grade", tenantId] as const,
    week: (tenantId: string) => ["grade", "week", tenantId] as const,
  },
} as const;
