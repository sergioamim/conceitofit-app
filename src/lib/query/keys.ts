export const queryKeys = {
  dashboard: (tenantId: string, referenceDate: string) =>
    ["dashboard", tenantId, referenceDate] as const,

  billingConfig: (tenantId: string) =>
    ["billingConfig", tenantId] as const,

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

  funcionarios: {
    all: () => ["funcionarios"] as const,
  },
} as const;
