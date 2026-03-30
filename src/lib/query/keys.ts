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

  crmCampanhas: {
    all: (tenantId: string) => ["crmCampanhas", tenantId] as const,
    list: (tenantId: string, status?: string) =>
      ["crmCampanhas", "list", tenantId, status] as const,
  },
} as const;
