import type { Page, Request } from "@playwright/test";
import { installBackofficeGlobalSession } from "../backoffice-global-session";
import { fulfillJson } from "../protected-shell-mocks";
import { navigateAndWaitForHeading } from "../interactions";

type AcademiaSeed = {
  id: string;
  nome: string;
  ativo: boolean;
  documento?: string;
  subdomain?: string;
};

type UnidadeSeed = {
  id: string;
  academiaId: string;
  groupId: string;
  nome: string;
  ativo: boolean;
};

type AcademiaHealthSeed = {
  academiaId: string;
  academiaNome: string;
  alunosAtivos: number;
  churnMensal: number;
  inadimplenciaPercentual?: number;
  ultimoLoginAdmin?: string;
  alertasRisco: string[];
  healthLevel: "SAUDAVEL" | "RISCO" | "CRITICO";
};

type AlertaSeed = {
  id: string;
  academiaId: string;
  academiaNome: string;
  unidadeNome?: string;
  tipo:
    | "SEM_LOGIN_ADMIN"
    | "SEM_MATRICULAS_ATIVAS"
    | "PICO_CANCELAMENTOS"
    | "CONTRATO_VENCENDO"
    | "INADIMPLENCIA_ALTA"
    | "OUTRO";
  severidade: "CRITICAL" | "WARNING" | "INFO";
  titulo: string;
  descricao: string;
  data: string;
};

type FeatureUsageSeed = {
  academiaId: string;
  academiaNome: string;
  treinos: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
  crm: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
  catraca: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
  vendasOnline: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
  bi: { ativa: boolean; emUso: boolean; ultimoUsoEm?: string };
};

type BiSnapshotSeed = {
  kpis: {
    conversaoPct: number;
    ocupacaoPct: number;
    inadimplenciaPct: number;
    retencaoPct: number;
    receita: number;
    ativos: number;
    prospects: number;
    conversoes: number;
    lugaresOcupados: number;
    lugaresDisponiveis: number;
    valorInadimplente: number;
    valorEmAberto: number;
  };
  deltas: {
    conversaoPct: number;
    ocupacaoPct: number;
    inadimplenciaPct: number;
    retencaoPct: number;
    receita: number;
    ativos: number;
  };
  series: Array<{
    label: string;
    periodoInicio: string;
    periodoFim: string;
    receita: number;
    conversaoPct: number;
    ocupacaoPct: number;
    inadimplenciaPct: number;
    retencaoPct: number;
  }>;
};

type SecurityReviewItemSeed = {
  id: string;
  userId?: string;
  userName: string;
  title: string;
  description?: string;
  severity: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  dueAt?: string;
  category:
    | "REVISAO_PENDENTE"
    | "EXCECAO_EXPIRANDO"
    | "MUDANCA_RECENTE"
    | "ACESSO_AMPLO"
    | "PERFIL_SEM_DONO";
};

type CatalogoSeed = {
  id: string;
  featureKey: string;
  moduleKey: string;
  moduleLabel: string;
  capabilityLabel: string;
  businessLabel: string;
  description: string;
  riskLevel: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  scopes: Array<"UNIDADE" | "ACADEMIA" | "REDE">;
  requiresAudit: boolean;
  requiresApproval: boolean;
  requiresMfa: boolean;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type PerfilPadraoSeed = {
  key: string;
  displayName: string;
  description?: string;
  objective: string;
  recommendedScope: "UNIDADE" | "ACADEMIA" | "REDE";
  riskLevel: "BAIXO" | "MEDIO" | "ALTO" | "CRITICO";
  active: boolean;
  versaoAtual: number;
};

type PerfilVersaoSeed = {
  versao: number;
  descricao: string;
  grants: Array<{ featureKey: string; permission: string; allowed: boolean }>;
  criadoEm: string;
  criadoPor?: string;
};

type WhatsAppConfigSeed = {
  id: string;
  tenantId: string;
  provedor: "EVOLUTION_API" | "WHATSAPP_BUSINESS" | "OUTRO";
  apiUrl?: string;
  apiKey?: string;
  instanciaId?: string;
  numeroRemetente?: string;
  ativo: boolean;
  updatedAt?: string;
};

type WhatsAppTemplateSeed = {
  id: string;
  tenantId?: string;
  evento: "WELCOME" | "COBRANCA_PENDENTE" | "COBRANCA_VENCIDA" | "MATRICULA_VENCENDO" | "PROSPECT_FOLLOWUP" | "ANIVERSARIO" | "CUSTOM";
  nome: string;
  slug?: string;
  tipo?: "WELCOME" | "COBRANCA_PENDENTE" | "COBRANCA_VENCIDA" | "MATRICULA_VENCENDO" | "PROSPECT_FOLLOWUP" | "ANIVERSARIO" | "CUSTOM";
  conteudo: string;
  ativo: boolean;
  variaveis: string[];
  variables?: string[];
  criadoEm?: string;
  atualizadoEm?: string;
};

type WhatsAppLogSeed = {
  id: string;
  tenantId?: string;
  templateId?: string;
  templateNome?: string;
  evento: "WELCOME" | "COBRANCA_PENDENTE" | "COBRANCA_VENCIDA" | "MATRICULA_VENCENDO" | "PROSPECT_FOLLOWUP" | "ANIVERSARIO" | "CUSTOM";
  destinatario: string;
  destinatarioNome?: string;
  conteudo: string;
  status: "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHA";
  erroMensagem?: string;
  enviadoEm: string;
};

type WhatsAppCredentialSeed = {
  id: string;
  tenantId: string;
  academiaId: string | null;
  unidadeId: string | null;
  businessAccountId: string;
  wabaId: string;
  phoneId: string;
  phoneNumber: string;
  mode: "UNIT_NUMBER" | "NETWORK_SHARED_NUMBER";
  accessTokenExpiresAt: string;
  webhookVerifyToken: string | null;
  onboardingStatus: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED";
  onboardingStep: "CREATED" | "PHONE_REGISTERED" | "VERIFIED" | "TEMPLATES_APPROVED";
  lastHealthCheckAt: string | null;
  createdAt: string;
  updatedAt: string;
  tokenExpiringSoon: boolean;
  tokenExpired: boolean;
};

type SearchResultSeed = {
  id: string;
  tipo: "ALUNO" | "FUNCIONARIO" | "ADMIN";
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  academiaId?: string;
  academiaNome?: string;
  tenantId?: string;
  unidadeNome?: string;
  status?: string;
};

type ImportacaoOnboardingSeed = {
  tenantId: string;
  academiaId: string;
  estrategia: "PREPARAR_ETL";
  status: "AGUARDANDO_IMPORTACAO" | "EM_IMPORTACAO" | "PRONTA";
  evoFilialId?: string;
  ultimaMensagem?: string;
  eventos: unknown[];
};

export type BackofficeWaveCState = {
  academias: AcademiaSeed[];
  unidades: UnidadeSeed[];
  operacionalGlobal: {
    totalAlunosAtivos: number;
    totalMatriculasAtivas: number;
    vendasMesQuantidade: number;
    vendasMesValor: number;
    ticketMedioGlobal: number;
    novosAlunosMes: number;
    novosAlunosMesAnterior: number;
    tendenciaCrescimentoPercentual: number;
    evolucaoNovosAlunos: Array<{ referencia: string; label: string; total: number }>;
    distribuicaoAcademias: Array<{
      academiaId: string;
      academiaNome: string;
      unidades: number;
      alunosAtivos: number;
      matriculasAtivas: number;
      vendasMesQuantidade: number;
      vendasMesValor: number;
    }>;
  };
  saude: AcademiaHealthSeed[];
  alertas: AlertaSeed[];
  featureUsage: FeatureUsageSeed[];
  biByAcademia: Record<string, BiSnapshotSeed>;
  securityOverview: {
    totalUsers: number;
    activeMemberships: number;
    defaultUnitsConfigured: number;
    eligibleForNewUnits: number;
    broadAccessUsers: number;
    expiringExceptions: number;
    pendingReviews: number;
    rolloutPercentage: number;
    compatibilityModeUsers: number;
  };
  reviewBoard: {
    pendingReviews: SecurityReviewItemSeed[];
    expiringExceptions: SecurityReviewItemSeed[];
    recentChanges: SecurityReviewItemSeed[];
    broadAccess: SecurityReviewItemSeed[];
    orphanProfiles: SecurityReviewItemSeed[];
  };
  catalogo: CatalogoSeed[];
  perfisPadrao: PerfilPadraoSeed[];
  perfisVersoes: Record<string, PerfilVersaoSeed[]>;
  whatsAppConfig: WhatsAppConfigSeed;
  whatsAppTemplates: WhatsAppTemplateSeed[];
  whatsAppLogs: WhatsAppLogSeed[];
  whatsAppCredentials: WhatsAppCredentialSeed[];
  searchResults: SearchResultSeed[];
  onboarding: ImportacaoOnboardingSeed[];
};

export const BACKOFFICE_WAVE_C_BASE_STATE: BackofficeWaveCState = {
  academias: [
    {
      id: "academia-norte",
      nome: "Rede Norte Fitness",
      ativo: true,
      documento: "12.345.678/0001-10",
      subdomain: "rede-norte",
    },
    {
      id: "academia-sul",
      nome: "Rede Sul Performance",
      ativo: true,
      documento: "98.765.432/0001-10",
      subdomain: "rede-sul",
    },
    {
      id: "academia-oeste",
      nome: "Academia Oeste Prime",
      ativo: true,
      documento: "21.222.333/0001-99",
      subdomain: "oeste-prime",
    },
  ],
  unidades: [
    {
      id: "tenant-centro",
      academiaId: "academia-norte",
      groupId: "academia-norte",
      nome: "Unidade Centro",
      ativo: true,
    },
    {
      id: "tenant-barra",
      academiaId: "academia-norte",
      groupId: "academia-norte",
      nome: "Unidade Barra",
      ativo: true,
    },
    {
      id: "tenant-zona-sul",
      academiaId: "academia-sul",
      groupId: "academia-sul",
      nome: "Unidade Zona Sul",
      ativo: true,
    },
  ],
  operacionalGlobal: {
    totalAlunosAtivos: 3580,
    totalMatriculasAtivas: 3342,
    vendasMesQuantidade: 218,
    vendasMesValor: 184320,
    ticketMedioGlobal: 845,
    novosAlunosMes: 164,
    novosAlunosMesAnterior: 137,
    tendenciaCrescimentoPercentual: 18.4,
    evolucaoNovosAlunos: [
      { referencia: "2025-11", label: "Nov/25", total: 102 },
      { referencia: "2025-12", label: "Dez/25", total: 118 },
      { referencia: "2026-01", label: "Jan/26", total: 129 },
      { referencia: "2026-02", label: "Fev/26", total: 141 },
      { referencia: "2026-03", label: "Mar/26", total: 152 },
      { referencia: "2026-04", label: "Abr/26", total: 164 },
    ],
    distribuicaoAcademias: [
      {
        academiaId: "academia-norte",
        academiaNome: "Rede Norte Fitness",
        unidades: 2,
        alunosAtivos: 2140,
        matriculasAtivas: 2010,
        vendasMesQuantidade: 134,
        vendasMesValor: 112540,
      },
      {
        academiaId: "academia-sul",
        academiaNome: "Rede Sul Performance",
        unidades: 1,
        alunosAtivos: 980,
        matriculasAtivas: 915,
        vendasMesQuantidade: 54,
        vendasMesValor: 48700,
      },
      {
        academiaId: "academia-oeste",
        academiaNome: "Academia Oeste Prime",
        unidades: 1,
        alunosAtivos: 460,
        matriculasAtivas: 417,
        vendasMesQuantidade: 30,
        vendasMesValor: 23080,
      },
    ],
  },
  saude: [
    {
      academiaId: "academia-norte",
      academiaNome: "Rede Norte Fitness",
      alunosAtivos: 2140,
      churnMensal: 2.1,
      inadimplenciaPercentual: 4.8,
      ultimoLoginAdmin: "2026-04-10T09:30:00Z",
      alertasRisco: [],
      healthLevel: "SAUDAVEL",
    },
    {
      academiaId: "academia-sul",
      academiaNome: "Rede Sul Performance",
      alunosAtivos: 980,
      churnMensal: 6.8,
      inadimplenciaPercentual: 14.2,
      ultimoLoginAdmin: "2026-04-08T10:15:00Z",
      alertasRisco: ["Oscilação de ocupação no período"],
      healthLevel: "RISCO",
    },
    {
      academiaId: "academia-oeste",
      academiaNome: "Academia Oeste Prime",
      alunosAtivos: 460,
      churnMensal: 11.7,
      inadimplenciaPercentual: 26.4,
      ultimoLoginAdmin: "2026-03-29T14:00:00Z",
      alertasRisco: ["Sem login admin recente", "Cancelamentos acima da meta"],
      healthLevel: "CRITICO",
    },
  ],
  alertas: [
    {
      id: "alerta-critico-oeste",
      academiaId: "academia-oeste",
      academiaNome: "Academia Oeste Prime",
      unidadeNome: "Unidade Oeste",
      tipo: "SEM_LOGIN_ADMIN",
      severidade: "CRITICAL",
      titulo: "Sem login administrativo há 12 dias",
      descricao: "Nenhum acesso de backoffice local registrado no período.",
      data: "2026-04-11T08:00:00Z",
    },
    {
      id: "alerta-warning-sul",
      academiaId: "academia-sul",
      academiaNome: "Rede Sul Performance",
      unidadeNome: "Unidade Zona Sul",
      tipo: "PICO_CANCELAMENTOS",
      severidade: "WARNING",
      titulo: "Pico de cancelamentos na última semana",
      descricao: "Volume 24% acima da média histórica.",
      data: "2026-04-10T11:30:00Z",
    },
    {
      id: "alerta-info-norte",
      academiaId: "academia-norte",
      academiaNome: "Rede Norte Fitness",
      unidadeNome: "Unidade Centro",
      tipo: "CONTRATO_VENCENDO",
      severidade: "INFO",
      titulo: "Contrato vencendo em 7 dias",
      descricao: "Reforçar acompanhamento comercial da renovação.",
      data: "2026-04-09T15:10:00Z",
    },
  ],
  featureUsage: [
    {
      academiaId: "academia-norte",
      academiaNome: "Rede Norte Fitness",
      treinos: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-11T07:50:00Z" },
      crm: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-11T07:40:00Z" },
      catraca: { ativa: true, emUso: false, ultimoUsoEm: "2026-04-02T09:00:00Z" },
      vendasOnline: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-10T18:10:00Z" },
      bi: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-11T06:30:00Z" },
    },
    {
      academiaId: "academia-sul",
      academiaNome: "Rede Sul Performance",
      treinos: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-10T20:20:00Z" },
      crm: { ativa: true, emUso: false, ultimoUsoEm: "2026-03-20T10:00:00Z" },
      catraca: { ativa: false, emUso: false },
      vendasOnline: { ativa: true, emUso: false, ultimoUsoEm: "2026-03-25T14:00:00Z" },
      bi: { ativa: true, emUso: true, ultimoUsoEm: "2026-04-09T08:15:00Z" },
    },
    {
      academiaId: "academia-oeste",
      academiaNome: "Academia Oeste Prime",
      treinos: { ativa: true, emUso: false, ultimoUsoEm: "2026-03-18T12:00:00Z" },
      crm: { ativa: true, emUso: false, ultimoUsoEm: "2026-03-15T09:30:00Z" },
      catraca: { ativa: false, emUso: false },
      vendasOnline: { ativa: false, emUso: false },
      bi: { ativa: true, emUso: false, ultimoUsoEm: "2026-03-21T10:45:00Z" },
    },
  ],
  biByAcademia: {
    "academia-norte": {
      kpis: {
        conversaoPct: 41.2,
        ocupacaoPct: 87.4,
        inadimplenciaPct: 2.8,
        retencaoPct: 91.5,
        receita: 112540,
        ativos: 2140,
        prospects: 340,
        conversoes: 140,
        lugaresOcupados: 874,
        lugaresDisponiveis: 1000,
        valorInadimplente: 7320,
        valorEmAberto: 12880,
      },
      deltas: {
        conversaoPct: 4.3,
        ocupacaoPct: 1.1,
        inadimplenciaPct: -0.6,
        retencaoPct: 2.4,
        receita: 12400,
        ativos: 85,
      },
      series: [
        { label: "Jan/26", periodoInicio: "2026-01-01", periodoFim: "2026-01-31", receita: 94100, conversaoPct: 35.2, ocupacaoPct: 79.1, inadimplenciaPct: 3.6, retencaoPct: 88.1 },
        { label: "Fev/26", periodoInicio: "2026-02-01", periodoFim: "2026-02-28", receita: 98220, conversaoPct: 37.8, ocupacaoPct: 81.4, inadimplenciaPct: 3.2, retencaoPct: 89.4 },
        { label: "Mar/26", periodoInicio: "2026-03-01", periodoFim: "2026-03-31", receita: 105340, conversaoPct: 39.5, ocupacaoPct: 84.2, inadimplenciaPct: 3.0, retencaoPct: 90.1 },
        { label: "Abr/26", periodoInicio: "2026-04-01", periodoFim: "2026-04-30", receita: 112540, conversaoPct: 41.2, ocupacaoPct: 87.4, inadimplenciaPct: 2.8, retencaoPct: 91.5 },
      ],
    },
    "academia-sul": {
      kpis: {
        conversaoPct: 33.1,
        ocupacaoPct: 74.9,
        inadimplenciaPct: 5.2,
        retencaoPct: 86.4,
        receita: 48700,
        ativos: 980,
        prospects: 210,
        conversoes: 69,
        lugaresOcupados: 449,
        lugaresDisponiveis: 600,
        valorInadimplente: 6240,
        valorEmAberto: 8180,
      },
      deltas: {
        conversaoPct: -1.2,
        ocupacaoPct: 0.8,
        inadimplenciaPct: 0.4,
        retencaoPct: -0.9,
        receita: 3100,
        ativos: 24,
      },
      series: [
        { label: "Jan/26", periodoInicio: "2026-01-01", periodoFim: "2026-01-31", receita: 40120, conversaoPct: 29.6, ocupacaoPct: 70.1, inadimplenciaPct: 4.6, retencaoPct: 84.5 },
        { label: "Fev/26", periodoInicio: "2026-02-01", periodoFim: "2026-02-28", receita: 42210, conversaoPct: 31.2, ocupacaoPct: 72.4, inadimplenciaPct: 4.9, retencaoPct: 85.1 },
        { label: "Mar/26", periodoInicio: "2026-03-01", periodoFim: "2026-03-31", receita: 45600, conversaoPct: 34.3, ocupacaoPct: 73.6, inadimplenciaPct: 4.8, retencaoPct: 87.3 },
        { label: "Abr/26", periodoInicio: "2026-04-01", periodoFim: "2026-04-30", receita: 48700, conversaoPct: 33.1, ocupacaoPct: 74.9, inadimplenciaPct: 5.2, retencaoPct: 86.4 },
      ],
    },
    "academia-oeste": {
      kpis: {
        conversaoPct: 26.4,
        ocupacaoPct: 61.2,
        inadimplenciaPct: 8.1,
        retencaoPct: 79.4,
        receita: 23080,
        ativos: 460,
        prospects: 122,
        conversoes: 32,
        lugaresOcupados: 184,
        lugaresDisponiveis: 300,
        valorInadimplente: 3980,
        valorEmAberto: 4720,
      },
      deltas: {
        conversaoPct: -3.2,
        ocupacaoPct: -2.1,
        inadimplenciaPct: 1.3,
        retencaoPct: -4.7,
        receita: -1280,
        ativos: -19,
      },
      series: [
        { label: "Jan/26", periodoInicio: "2026-01-01", periodoFim: "2026-01-31", receita: 26420, conversaoPct: 31.1, ocupacaoPct: 69.2, inadimplenciaPct: 6.1, retencaoPct: 84.2 },
        { label: "Fev/26", periodoInicio: "2026-02-01", periodoFim: "2026-02-28", receita: 25110, conversaoPct: 29.5, ocupacaoPct: 66.8, inadimplenciaPct: 6.8, retencaoPct: 82.7 },
        { label: "Mar/26", periodoInicio: "2026-03-01", periodoFim: "2026-03-31", receita: 24360, conversaoPct: 27.9, ocupacaoPct: 63.5, inadimplenciaPct: 7.6, retencaoPct: 80.8 },
        { label: "Abr/26", periodoInicio: "2026-04-01", periodoFim: "2026-04-30", receita: 23080, conversaoPct: 26.4, ocupacaoPct: 61.2, inadimplenciaPct: 8.1, retencaoPct: 79.4 },
      ],
    },
  },
  securityOverview: {
    totalUsers: 18,
    activeMemberships: 27,
    defaultUnitsConfigured: 17,
    eligibleForNewUnits: 6,
    broadAccessUsers: 3,
    expiringExceptions: 2,
    pendingReviews: 2,
    rolloutPercentage: 84,
    compatibilityModeUsers: 1,
  },
  reviewBoard: {
    pendingReviews: [
      {
        id: "review-ana",
        userId: "user-ana",
        userName: "Ana Admin",
        title: "Recertificação trimestral do financeiro",
        description: "Usuária manteve acesso amplo desde a última revisão.",
        severity: "ALTO",
        dueAt: "2026-04-15T10:00:00Z",
        category: "REVISAO_PENDENTE",
      },
      {
        id: "review-caio",
        userId: "user-caio",
        userName: "Caio Compliance",
        title: "Confirmar permanência no escopo de LGPD",
        description: "Acesso herdado por rollout global.",
        severity: "MEDIO",
        dueAt: "2026-04-18T16:00:00Z",
        category: "REVISAO_PENDENTE",
      },
    ],
    expiringExceptions: [
      {
        id: "exception-001",
        userId: "user-ana",
        userName: "Ana Admin",
        title: "Acesso temporário ao financeiro",
        description: "Cobertura de férias do controller regional.",
        severity: "ALTO",
        dueAt: "2026-04-20T09:00:00Z",
        category: "EXCECAO_EXPIRANDO",
      },
    ],
    recentChanges: [
      {
        id: "change-001",
        userId: "user-lucia",
        userName: "Lúcia Auditoria",
        title: "Escopo reduzido em RH",
        description: "Remoção do perfil de gestão ampla.",
        severity: "BAIXO",
        dueAt: "2026-04-10T12:00:00Z",
        category: "MUDANCA_RECENTE",
      },
    ],
    broadAccess: [
      {
        id: "broad-001",
        userId: "user-pedro",
        userName: "Pedro Implantação",
        title: "Acesso de rede com 9 unidades",
        description: "Escopo elevado há 45 dias.",
        severity: "CRITICO",
        dueAt: "2026-04-14T14:00:00Z",
        category: "ACESSO_AMPLO",
      },
    ],
    orphanProfiles: [
      {
        id: "orphan-001",
        userName: "Perfil Financeiro Legado",
        title: "Perfil sem owner formal",
        description: "Sem steward definido após rollout.",
        severity: "MEDIO",
        dueAt: "2026-04-30T10:00:00Z",
        category: "PERFIL_SEM_DONO",
      },
    ],
  },
  catalogo: [
    {
      id: "catalogo-financeiro",
      featureKey: "financeiro.pagamentos",
      moduleKey: "financeiro",
      moduleLabel: "Financeiro",
      capabilityLabel: "Pagamentos",
      businessLabel: "Gestão de pagamentos",
      description: "Permite operar recebimentos e conciliações.",
      riskLevel: "ALTO",
      scopes: ["UNIDADE", "ACADEMIA"],
      requiresAudit: true,
      requiresApproval: true,
      requiresMfa: false,
      active: true,
      createdAt: "2026-03-01T10:00:00Z",
      updatedAt: "2026-04-01T09:00:00Z",
    },
    {
      id: "catalogo-bi",
      featureKey: "bi.executivo",
      moduleKey: "bi",
      moduleLabel: "BI",
      capabilityLabel: "Executivo",
      businessLabel: "BI executivo",
      description: "Indicadores de receita, retenção e ocupação.",
      riskLevel: "MEDIO",
      scopes: ["ACADEMIA", "REDE"],
      requiresAudit: false,
      requiresApproval: false,
      requiresMfa: false,
      active: true,
      createdAt: "2026-03-02T10:00:00Z",
      updatedAt: "2026-04-01T09:30:00Z",
    },
    {
      id: "catalogo-whatsapp",
      featureKey: "atendimento.whatsapp",
      moduleKey: "atendimento",
      moduleLabel: "Atendimento",
      capabilityLabel: "WhatsApp",
      businessLabel: "Mensageria WhatsApp",
      description: "Envio transacional e operação de templates.",
      riskLevel: "CRITICO",
      scopes: ["UNIDADE"],
      requiresAudit: true,
      requiresApproval: true,
      requiresMfa: true,
      active: true,
      createdAt: "2026-03-03T10:00:00Z",
      updatedAt: "2026-04-01T10:00:00Z",
    },
  ],
  perfisPadrao: [
    {
      key: "financeiro-gestor",
      displayName: "Financeiro Gestor",
      description: "Perfil padrão para liderança financeira.",
      objective: "Operação financeira com governança.",
      recommendedScope: "ACADEMIA",
      riskLevel: "ALTO",
      active: true,
      versaoAtual: 3,
    },
  ],
  perfisVersoes: {
    "financeiro-gestor": [
      {
        versao: 3,
        descricao: "Inclui conciliação e exportação bancária.",
        grants: [{ featureKey: "financeiro.pagamentos", permission: "MANAGE", allowed: true }],
        criadoEm: "2026-04-01T09:00:00Z",
        criadoPor: "Lúcia Auditoria",
      },
      {
        versao: 2,
        descricao: "Versão anterior sem exportações.",
        grants: [{ featureKey: "financeiro.pagamentos", permission: "EDIT", allowed: true }],
        criadoEm: "2026-03-10T09:00:00Z",
        criadoPor: "Lúcia Auditoria",
      },
    ],
  },
  whatsAppConfig: {
    id: "wa-config-001",
    tenantId: "tenant-centro",
    provedor: "EVOLUTION_API",
    apiUrl: "https://wa.conceito.fit",
    apiKey: "token-antigo-001",
    instanciaId: "instancia-centro",
    numeroRemetente: "+5511999990001",
    ativo: true,
    updatedAt: "2026-04-09T10:00:00Z",
  },
  whatsAppTemplates: [
    {
      id: "tpl-welcome",
      tenantId: "tenant-centro",
      evento: "WELCOME",
      tipo: "WELCOME",
      nome: "Boas-vindas aluno",
      slug: "welcome-student",
      conteudo: "Olá {{NOME}}, bem-vindo à {{ACADEMIA}}.",
      ativo: true,
      variaveis: ["NOME", "ACADEMIA"],
      variables: ["NOME", "ACADEMIA"],
      criadoEm: "2026-04-01T09:00:00Z",
      atualizadoEm: "2026-04-05T09:00:00Z",
    },
    {
      id: "tpl-cobranca",
      tenantId: "tenant-centro",
      evento: "COBRANCA_PENDENTE",
      tipo: "COBRANCA_PENDENTE",
      nome: "Cobrança pendente",
      slug: "billing-pending",
      conteudo: "Seu pagamento está pendente, {{NOME}}.",
      ativo: true,
      variaveis: ["NOME"],
      variables: ["NOME"],
      criadoEm: "2026-04-02T09:00:00Z",
      atualizadoEm: "2026-04-05T09:00:00Z",
    },
  ],
  whatsAppLogs: [
    {
      id: "log-wa-001",
      tenantId: "tenant-centro",
      templateId: "tpl-welcome",
      templateNome: "Boas-vindas aluno",
      evento: "WELCOME",
      destinatario: "+5511999991111",
      destinatarioNome: "Marina Lima",
      conteudo: "Olá Marina, bem-vinda!",
      status: "ENTREGUE",
      enviadoEm: "2026-04-10T10:00:00Z",
    },
    {
      id: "log-wa-002",
      tenantId: "tenant-centro",
      templateId: "tpl-cobranca",
      templateNome: "Cobrança pendente",
      evento: "COBRANCA_PENDENTE",
      destinatario: "+5511999992222",
      destinatarioNome: "João Castro",
      conteudo: "Seu pagamento está pendente.",
      status: "FALHA",
      erroMensagem: "Número inválido.",
      enviadoEm: "2026-04-10T11:00:00Z",
    },
  ],
  whatsAppCredentials: [
    {
      id: "cred-wa-001",
      tenantId: "tenant-centro",
      academiaId: "academia-norte",
      unidadeId: "tenant-centro",
      businessAccountId: "biz-001",
      wabaId: "waba-001",
      phoneId: "phone-001",
      phoneNumber: "+5511999990001",
      mode: "UNIT_NUMBER",
      accessTokenExpiresAt: "2026-05-10T10:00:00Z",
      webhookVerifyToken: "verify-token",
      onboardingStatus: "VERIFIED",
      onboardingStep: "TEMPLATES_APPROVED",
      lastHealthCheckAt: "2026-04-10T09:30:00Z",
      createdAt: "2026-03-20T09:00:00Z",
      updatedAt: "2026-04-10T09:30:00Z",
      tokenExpiringSoon: false,
      tokenExpired: false,
    },
  ],
  searchResults: [
    {
      id: "aluno-marina",
      tipo: "ALUNO",
      nome: "Marina Lima",
      cpf: "12345678901",
      email: "marina@cliente.com",
      telefone: "11999991111",
      academiaId: "academia-norte",
      academiaNome: "Rede Norte Fitness",
      tenantId: "tenant-centro",
      unidadeNome: "Unidade Centro",
      status: "ATIVA",
    },
    {
      id: "func-joao",
      tipo: "FUNCIONARIO",
      nome: "João Castro",
      cpf: "22233344455",
      email: "joao@rede-sul.fit",
      telefone: "11999992222",
      academiaId: "academia-sul",
      academiaNome: "Rede Sul Performance",
      tenantId: "tenant-zona-sul",
      unidadeNome: "Unidade Zona Sul",
      status: "ATIVO",
    },
    {
      id: "admin-lucia",
      tipo: "ADMIN",
      nome: "Lúcia Auditoria",
      cpf: "99988877766",
      email: "lucia@conceito.fit",
      telefone: "11999993333",
      academiaId: "academia-norte",
      academiaNome: "Rede Norte Fitness",
      tenantId: "tenant-centro",
      unidadeNome: "Unidade Centro",
      status: "ATIVO",
    },
  ],
  onboarding: [
    {
      tenantId: "tenant-barra",
      academiaId: "academia-norte",
      estrategia: "PREPARAR_ETL",
      status: "AGUARDANDO_IMPORTACAO",
      evoFilialId: "777",
      ultimaMensagem: "Aguardando upload do pacote EVO.",
      eventos: [],
    },
  ],
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizePath(pathname: string) {
  return pathname.replace(/^\/backend/, "");
}

function parseBody<T = Record<string, unknown>>(request: Request): T {
  try {
    const raw = request.postData();
    return raw ? (JSON.parse(raw) as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function buildState(overrides?: Partial<BackofficeWaveCState>): BackofficeWaveCState {
  const state = clone(BACKOFFICE_WAVE_C_BASE_STATE);
  if (!overrides) return state;

  return {
    academias: overrides.academias ? clone(overrides.academias) : state.academias,
    unidades: overrides.unidades ? clone(overrides.unidades) : state.unidades,
    operacionalGlobal: overrides.operacionalGlobal ? clone(overrides.operacionalGlobal) : state.operacionalGlobal,
    saude: overrides.saude ? clone(overrides.saude) : state.saude,
    alertas: overrides.alertas ? clone(overrides.alertas) : state.alertas,
    featureUsage: overrides.featureUsage ? clone(overrides.featureUsage) : state.featureUsage,
    biByAcademia: overrides.biByAcademia ? clone(overrides.biByAcademia) : state.biByAcademia,
    securityOverview: overrides.securityOverview ? clone(overrides.securityOverview) : state.securityOverview,
    reviewBoard: overrides.reviewBoard ? clone(overrides.reviewBoard) : state.reviewBoard,
    catalogo: overrides.catalogo ? clone(overrides.catalogo) : state.catalogo,
    perfisPadrao: overrides.perfisPadrao ? clone(overrides.perfisPadrao) : state.perfisPadrao,
    perfisVersoes: overrides.perfisVersoes ? clone(overrides.perfisVersoes) : state.perfisVersoes,
    whatsAppConfig: overrides.whatsAppConfig ? clone(overrides.whatsAppConfig) : state.whatsAppConfig,
    whatsAppTemplates: overrides.whatsAppTemplates ? clone(overrides.whatsAppTemplates) : state.whatsAppTemplates,
    whatsAppLogs: overrides.whatsAppLogs ? clone(overrides.whatsAppLogs) : state.whatsAppLogs,
    whatsAppCredentials: overrides.whatsAppCredentials ? clone(overrides.whatsAppCredentials) : state.whatsAppCredentials,
    searchResults: overrides.searchResults ? clone(overrides.searchResults) : state.searchResults,
    onboarding: overrides.onboarding ? clone(overrides.onboarding) : state.onboarding,
  };
}

function buildBiStats(state: BackofficeWaveCState) {
  const total = state.whatsAppLogs.length;
  const entregues = state.whatsAppLogs.filter((log) => log.status === "ENTREGUE" || log.status === "LIDA").length;
  const lidas = state.whatsAppLogs.filter((log) => log.status === "LIDA").length;
  const falhas = state.whatsAppLogs.filter((log) => log.status === "FALHA").length;

  return {
    total,
    enviadas: total,
    entregues,
    lidas,
    falhas,
    taxaEntrega: total > 0 ? (entregues / total) * 100 : 0,
    taxaLeitura: total > 0 ? (lidas / total) * 100 : 0,
  };
}

function buildSearchResponse(state: BackofficeWaveCState, query: string) {
  const normalized = query.trim().toLowerCase();
  const items = state.searchResults.filter((item) => {
    if (!normalized) return false;
    return [
      item.nome,
      item.cpf,
      item.email,
      item.telefone,
      item.academiaNome,
      item.unidadeNome,
    ]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalized));
  });

  return {
    items,
    total: items.length,
    query,
  };
}

async function installImportacaoMocks(page: Page) {
  let arquivosSelecionadosNoJob = [
    "clientes",
    "contratos",
    "funcionarios",
    "funcionarios_funcoes",
    "funcionarios_funcoes_exercidas",
    "tipos_funcionarios",
    "funcionarios_tipos",
    "funcionarios_horarios",
    "permissoes",
  ];
  const pollingCountByJob = new Map<string, number>();

  await page.route("**/admin/unidades/*/onboarding/job-status", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      tenantId?: string;
      academiaId?: string;
      jobId?: string;
      importStatus?: string;
    };

    await route.fulfill({
      status: 200,
      json: {
        tenantId: body.tenantId ?? "tenant-barra",
        academiaId: body.academiaId ?? "academia-norte",
        estrategia: "PREPARAR_ETL",
        status: body.importStatus === "CONCLUIDO" ? "PRONTA" : "EM_IMPORTACAO",
        evoFilialId: "777",
        ultimaMensagem:
          body.importStatus === "CONCLUIDO"
            ? "Importação finalizada com sucesso."
            : `Job ${body.jobId ?? "job-evo-777"} em processamento.`,
        eventos: [],
      },
    });
  });

  await page.route("**/admin/unidades/*/onboarding", async (route) => {
    if (route.request().method() !== "PUT") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      tenantId?: string;
      academiaId?: string;
      estrategia?: string;
      status?: string;
      evoFilialId?: string;
      ultimaMensagem?: string;
    };

    await route.fulfill({
      status: 200,
      json: {
        tenantId: body.tenantId ?? "tenant-barra",
        academiaId: body.academiaId ?? "academia-norte",
        estrategia: body.estrategia ?? "PREPARAR_ETL",
        status: body.status ?? "AGUARDANDO_IMPORTACAO",
        evoFilialId: body.evoFilialId ?? "777",
        ultimaMensagem: body.ultimaMensagem ?? "Aguardando importação.",
        eventos: [],
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/evo/p0/pacote", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    await route.fulfill({
      status: 200,
      json: {
        uploadId: "upload-evo-777",
        tenantId: "tenant-barra",
        evoUnidadeId: 777,
        filialResolvida: {
          evoFilialId: 777,
          evoAcademiaId: 99,
          nome: "Rede Norte Fitness - Barra",
          documento: "12.345.678/0001-90",
          cidade: "Rio de Janeiro",
          bairro: "Barra",
          email: "barra@qa.local",
          telefone: "1133334444",
          abreviacao: "Barra",
        },
        filiaisEncontradas: [
          {
            evoFilialId: 777,
            evoAcademiaId: 99,
            nome: "Rede Norte Fitness - Barra",
          },
        ],
        criadoEm: "2026-03-13T10:00:00Z",
        expiraEm: "2026-03-13T11:00:00Z",
        totalArquivosDisponiveis: 10,
        arquivos: [
          {
            chave: "clientes",
            rotulo: "Clientes",
            arquivoEsperado: "CLIENTES.csv",
            disponivel: true,
            nomeArquivoEnviado: "CLIENTES.csv",
            tamanhoBytes: 128,
            ultimoProcessamento: {
              jobId: "job-clientes-1",
              alias: "Carga clientes completa",
              status: "CONCLUIDO",
              processadoEm: "2026-03-12T09:00:00Z",
              resumo: { total: 20, processadas: 20, criadas: 12, atualizadas: 8, rejeitadas: 0 },
              retrySomenteErrosSuportado: false,
            },
          },
          {
            chave: "contratos",
            rotulo: "Contratos",
            arquivoEsperado: "CONTRATOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "CONTRATOS.csv",
            tamanhoBytes: 96,
            ultimoProcessamento: {
              jobId: "job-contratos-1",
              status: "CONCLUIDO_COM_REJEICOES",
              processadoEm: "2026-03-12T09:30:00Z",
              resumo: { total: 6, processadas: 6, criadas: 4, atualizadas: 2, rejeitadas: 0 },
              parcial: true,
              mensagemParcial: "Um contrato exigiu reconciliação manual de vigência.",
              retrySomenteErrosSuportado: false,
            },
          },
          {
            chave: "recebimentos",
            rotulo: "Recebimentos",
            arquivoEsperado: "RECEBIMENTOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "RECEBIMENTOS.csv",
            tamanhoBytes: 64,
          },
          {
            chave: "funcionarios",
            rotulo: "Cadastro principal",
            arquivoEsperado: "FUNCIONARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS.csv",
            tamanhoBytes: 256,
            dominio: "colaboradores",
            bloco: "fichaPrincipal",
            descricao: "Base do colaborador.",
          },
          {
            chave: "funcionarios_funcoes",
            rotulo: "Catálogo de funções",
            arquivoEsperado: "FUNCIONARIOS_FUNCOES.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_FUNCOES.csv",
            tamanhoBytes: 84,
            dominio: "colaboradores",
            bloco: "funcoes",
            descricao: "Catálogo legado de funções.",
          },
          {
            chave: "funcionarios_funcoes_exercidas",
            rotulo: "Funções exercidas",
            arquivoEsperado: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_FUNCOES_EXERCIDAS.csv",
            tamanhoBytes: 111,
            dominio: "colaboradores",
            bloco: "funcoes",
            descricao: "Relaciona colaboradores às funções.",
            ultimoProcessamento: {
              jobId: "job-funcoes-1",
              alias: "Funções com inconsistências",
              status: "CONCLUIDO_COM_REJEICOES",
              processadoEm: "2026-03-12T10:10:00Z",
              resumo: { total: 8, processadas: 8, criadas: 0, atualizadas: 5, rejeitadas: 3 },
              parcial: true,
              mensagemParcial: "Três vínculos vieram com função inexistente.",
              retrySomenteErrosSuportado: false,
            },
          },
          {
            chave: "tipos_funcionarios",
            rotulo: "Tipos operacionais",
            arquivoEsperado: "TIPOS_FUNCIONARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "TIPOS_FUNCIONARIOS.csv",
            tamanhoBytes: 73,
            dominio: "colaboradores",
            bloco: "tiposOperacionais",
            descricao: "Catálogo de tipos.",
          },
          {
            chave: "funcionarios_tipos",
            rotulo: "Contratação e vínculos",
            arquivoEsperado: "FUNCIONARIOS_TIPOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_TIPOS.csv",
            tamanhoBytes: 79,
            dominio: "colaboradores",
            bloco: "contratacao",
            descricao: "Vínculo do colaborador com tipos operacionais.",
          },
          {
            chave: "funcionarios_horarios",
            rotulo: "Horários semanais",
            arquivoEsperado: "FUNCIONARIOS_HORARIOS.csv",
            disponivel: true,
            nomeArquivoEnviado: "FUNCIONARIOS_HORARIOS.csv",
            tamanhoBytes: 91,
            dominio: "colaboradores",
            bloco: "horarios",
            descricao: "Jornada semanal do colaborador.",
          },
          {
            chave: "permissoes",
            rotulo: "Perfil legado",
            arquivoEsperado: "PERMISSOES.csv",
            disponivel: true,
            nomeArquivoEnviado: "PERMISSOES.csv",
            tamanhoBytes: 72,
            dominio: "colaboradores",
            bloco: "perfilLegado",
            descricao: "Permissões legadas.",
          },
        ],
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/evo/p0/pacote/*/job", async (route) => {
    if (route.request().method() !== "POST") {
      await route.fallback();
      return;
    }

    const body = route.request().postDataJSON() as {
      arquivos?: string[];
      apelido?: string;
      evoUnidadeId?: number;
    };
    if ("evoUnidadeId" in body) {
      await route.fulfill({
        status: 400,
        json: {
          message: "evoUnidadeId nao faz parte do DTO atual do create job do pacote EVO",
        },
      });
      return;
    }
    arquivosSelecionadosNoJob = body.arquivos ?? arquivosSelecionadosNoJob;

    await route.fulfill({
      status: 202,
      json: {
        jobId: "job-evo-777",
        status: "PROCESSANDO",
        solicitadoEm: "2026-03-13T10:05:00Z",
        dryRun: false,
        tenantIds: ["tenant-barra"],
        apelido: body.apelido ?? "Carga EVO Barra",
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/*/p0**", async (route) => {
    const jobId = route.request().url().split("/jobs/")[1]?.split("/")[0] ?? "job-evo-777";
    const pollingCount = (pollingCountByJob.get(jobId) ?? 0) + 1;
    pollingCountByJob.set(jobId, pollingCount);
    const status = pollingCount >= 2 ? "CONCLUIDO" : "PROCESSANDO";

    await route.fulfill({
      status: 200,
      json: {
        jobId,
        status,
        alias: "Carga EVO Barra",
        resumo: {
          total: 114,
          processadas: status === "CONCLUIDO" ? 114 : 68,
          criadas: 81,
          atualizadas: 33,
          rejeitadas: 2,
        },
        colaboradoresResumo: {
          total: 44,
          processadas: 41,
          criadas: 15,
          atualizadas: 26,
          rejeitadas: 3,
          blocos: {
            funcoes: { total: 12, processadas: 9, criadas: 2, atualizadas: 7, rejeitadas: 3 },
            tiposOperacionais: { total: 10, processadas: 10, criadas: 3, atualizadas: 7, rejeitadas: 0 },
            contratacao: { total: 8, processadas: 8, criadas: 4, atualizadas: 4, rejeitadas: 0 },
            horarios: { total: 0, processadas: 0, criadas: 0, atualizadas: 0, rejeitadas: 0 },
            perfilLegado: { total: 14, processadas: 14, criadas: 6, atualizadas: 8, rejeitadas: 0 },
          },
        },
        arquivosSelecionados: arquivosSelecionadosNoJob,
        arquivosIgnorados: ["recebimentos"],
        rejeicoes: [
          {
            id: "rej-001",
            entidade: "FUNCIONARIOS_HORARIOS",
            bloco: "horarios",
            arquivo: "FUNCIONARIOS_HORARIOS.csv",
            linha: 8,
            motivo: "Horário inválido no payload legado.",
            payload: { inicio: "25:00", fim: "18:00" },
            retryDisponivel: true,
            mensagemOperacional: "Corrija o horário legado e reenvie apenas o bloco semanal.",
          },
        ],
      },
    });
  });

  await page.route("**/admin/integracoes/importacao-terceiros/jobs/*/rejeicoes**", async (route) => {
    await route.fulfill({
      status: 200,
      json: {
        items: [
          {
            id: "rej-001",
            entidade: "FUNCIONARIOS_HORARIOS",
            bloco: "horarios",
            arquivo: "FUNCIONARIOS_HORARIOS.csv",
            linha: 8,
            motivo: "Horário inválido no payload legado.",
            payload: { inicio: "25:00", fim: "18:00" },
            retryDisponivel: true,
            mensagemOperacional: "Corrija o horário legado e reenvie apenas o bloco semanal.",
          },
        ],
        total: 1,
      },
    });
  });
}

export async function installBackofficeWaveCMocks(
  page: Page,
  overrides?: Partial<BackofficeWaveCState>,
) {
  const state = buildState(overrides);

  page.on("dialog", (dialog) => {
    void dialog.accept();
  });

  await installBackofficeGlobalSession(page, {
    session: {
      activeTenantId: "tenant-centro",
      baseTenantId: "tenant-centro",
      availableTenants: [
        { tenantId: "tenant-centro", defaultTenant: true },
        { tenantId: "tenant-barra", defaultTenant: false },
        { tenantId: "tenant-zona-sul", defaultTenant: false },
      ],
      userId: "user-root-admin",
      userKind: "COLABORADOR",
      displayName: "Root Admin",
      roles: ["OWNER", "ADMIN"],
      availableScopes: ["GLOBAL"],
      broadAccess: true,
      networkId: "rede-e2e",
      networkSlug: "rede-e2e",
      networkName: "Conceito Fit QA",
    },
    shell: {
      currentTenantId: "tenant-centro",
      tenants: state.unidades,
      user: {
        id: "user-root-admin",
        userId: "user-root-admin",
        nome: "Root Admin",
        displayName: "Root Admin",
        email: "root@qa.local",
        roles: ["OWNER", "ADMIN"],
        userKind: "COLABORADOR",
        activeTenantId: "tenant-centro",
        tenantBaseId: "tenant-centro",
        availableTenants: [
          { tenantId: "tenant-centro", defaultTenant: true },
          { tenantId: "tenant-barra", defaultTenant: false },
          { tenantId: "tenant-zona-sul", defaultTenant: false },
        ],
        availableScopes: ["GLOBAL"],
        broadAccess: true,
        redeId: "rede-e2e",
        redeNome: "Conceito Fit QA",
        redeSlug: "conceito-fit-qa",
      },
      academia: {
        id: "academia-norte",
        nome: "Rede Norte Fitness",
        ativo: true,
      },
      capabilities: {
        canAccessElevatedModules: true,
        canDeleteClient: true,
      },
    },
  });

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = normalizePath(url.pathname);
    const method = request.method();

    if (path === "/api/v1/auth/refresh") {
      await fulfillJson(route, { token: "token-e2e", refreshToken: "refresh-e2e", type: "Bearer" });
      return;
    }

    if (path === "/api/v1/admin/academias" && method === "GET") {
      await fulfillJson(route, state.academias);
      return;
    }

    if (/^\/api\/v1\/admin\/academias\/[^/]+$/.test(path) && method === "GET") {
      const academiaId = decodeURIComponent(path.split("/").at(-1) ?? "");
      const academia = state.academias.find((item) => item.id === academiaId);
      await fulfillJson(route, academia ?? { message: "Academia não encontrada." }, academia ? 200 : 404);
      return;
    }

    if (path === "/api/v1/admin/unidades" && method === "GET") {
      await fulfillJson(route, state.unidades);
      return;
    }

    if (path === "/api/v1/admin/unidades/onboarding" && method === "GET") {
      await fulfillJson(route, state.onboarding);
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/global" && method === "GET") {
      await fulfillJson(route, state.operacionalGlobal);
      return;
    }

    if (path === "/api/v1/admin/metricas/operacionais/saude" && method === "GET") {
      await fulfillJson(route, { items: state.saude });
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

    const biAcademiaMatch = path.match(/^\/api\/v1\/admin\/bi\/academias\/([^/]+)\/executivo\/(resumo|comparativo|serie)$/);
    if (biAcademiaMatch && method === "GET") {
      const academiaId = decodeURIComponent(biAcademiaMatch[1] ?? "");
      const snapshot = state.biByAcademia[academiaId];
      if (!snapshot) {
        await fulfillJson(route, { message: "Academia não encontrada." }, 404);
        return;
      }

      const segment = biAcademiaMatch[2];
      if (segment === "resumo") {
        await fulfillJson(route, snapshot.kpis);
        return;
      }
      if (segment === "comparativo") {
        await fulfillJson(route, snapshot.deltas);
        return;
      }
      await fulfillJson(route, snapshot.series);
      return;
    }

    if (path === "/api/v1/admin/seguranca/overview" && method === "GET") {
      await fulfillJson(route, state.securityOverview);
      return;
    }

    if (path === "/api/v1/admin/seguranca/reviews" && method === "GET") {
      await fulfillJson(route, state.reviewBoard);
      return;
    }

    if (path === "/api/v1/admin/seguranca/catalogo-funcionalidades" && method === "GET") {
      await fulfillJson(route, state.catalogo);
      return;
    }

    if (path === "/api/v1/admin/seguranca/catalogo-funcionalidades" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: CatalogoSeed = {
        id: `catalogo-${state.catalogo.length + 1}`,
        featureKey: String(body.featureKey ?? ""),
        moduleKey: String(body.moduleKey ?? ""),
        moduleLabel: String(body.moduleLabel ?? ""),
        capabilityLabel: String(body.capabilityLabel ?? ""),
        businessLabel: String(body.businessLabel ?? ""),
        description: String(body.description ?? ""),
        riskLevel: (body.riskLevel as CatalogoSeed["riskLevel"]) ?? "BAIXO",
        scopes: Array.isArray(body.scopes) ? (body.scopes as CatalogoSeed["scopes"]) : ["UNIDADE"],
        requiresAudit: Boolean(body.requiresAudit),
        requiresApproval: Boolean(body.requiresApproval),
        requiresMfa: Boolean(body.requiresMfa),
        active: body.active !== false,
      };
      state.catalogo.unshift(created);
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/admin\/seguranca\/catalogo-funcionalidades\/[^/]+$/.test(path) && method === "PUT") {
      const featureId = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const item = state.catalogo.find((entry) => entry.id === featureId);
      if (!item) {
        await fulfillJson(route, { message: "Funcionalidade não encontrada." }, 404);
        return;
      }

      item.businessLabel = String(body.businessLabel ?? item.businessLabel);
      item.description = String(body.description ?? item.description);
      item.moduleLabel = String(body.moduleLabel ?? item.moduleLabel);
      item.moduleKey = String(body.moduleKey ?? item.moduleKey);
      item.capabilityLabel = String(body.capabilityLabel ?? item.capabilityLabel);
      item.riskLevel = (body.riskLevel as CatalogoSeed["riskLevel"]) ?? item.riskLevel;
      item.requiresAudit = body.requiresAudit == null ? item.requiresAudit : Boolean(body.requiresAudit);
      item.requiresApproval = body.requiresApproval == null ? item.requiresApproval : Boolean(body.requiresApproval);
      item.requiresMfa = body.requiresMfa == null ? item.requiresMfa : Boolean(body.requiresMfa);
      item.updatedAt = "2026-04-11T10:30:00Z";
      await fulfillJson(route, item);
      return;
    }

    if (path === "/api/v1/admin/seguranca/perfis-padrao" && method === "GET") {
      await fulfillJson(route, state.perfisPadrao);
      return;
    }

    if (path === "/api/v1/admin/seguranca/perfis-padrao" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: PerfilPadraoSeed = {
        key: String(body.key ?? ""),
        displayName: String(body.displayName ?? ""),
        description: String(body.description ?? ""),
        objective: String(body.objective ?? ""),
        recommendedScope: (body.recommendedScope as PerfilPadraoSeed["recommendedScope"]) ?? "UNIDADE",
        riskLevel: (body.riskLevel as PerfilPadraoSeed["riskLevel"]) ?? "BAIXO",
        active: true,
        versaoAtual: 1,
      };
      state.perfisPadrao.unshift(created);
      state.perfisVersoes[created.key] = [
        {
          versao: 1,
          descricao: "Versão inicial",
          grants: [],
          criadoEm: "2026-04-11T10:40:00Z",
          criadoPor: "Root Admin",
        },
      ];
      await fulfillJson(route, created, 201);
      return;
    }

    const perfilVersoesMatch = path.match(/^\/api\/v1\/admin\/seguranca\/perfis-padrao\/([^/]+)\/versoes$/);
    if (perfilVersoesMatch && method === "GET") {
      const key = decodeURIComponent(perfilVersoesMatch[1] ?? "");
      await fulfillJson(route, state.perfisVersoes[key] ?? []);
      return;
    }

    if (path === "/api/v1/admin/seguranca/excecoes" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: SecurityReviewItemSeed = {
        id: `exception-${state.reviewBoard.expiringExceptions.length + 10}`,
        userId: String(body.userId ?? ""),
        userName: `Usuário ${String(body.userId ?? "sem-id")}`,
        title: String(body.title ?? "Exceção"),
        description: String(body.justification ?? ""),
        severity: "MEDIO",
        dueAt: typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : "2026-04-30T10:00:00Z",
        category: "EXCECAO_EXPIRANDO",
      };
      state.reviewBoard.expiringExceptions.unshift(created);
      state.securityOverview.expiringExceptions += 1;
      await fulfillJson(route, {
        id: created.id,
        title: created.title,
        justification: created.description,
        expiresAt: created.dueAt,
        active: true,
      }, 201);
      return;
    }

    const revisaoExceptionMatch = path.match(/^\/api\/v1\/admin\/seguranca\/excecoes\/([^/]+)\/revisao$/);
    if (revisaoExceptionMatch && method === "PUT") {
      const exceptionId = decodeURIComponent(revisaoExceptionMatch[1] ?? "");
      state.reviewBoard.expiringExceptions = state.reviewBoard.expiringExceptions.filter((item) => item.id !== exceptionId);
      state.securityOverview.expiringExceptions = Math.max(0, state.securityOverview.expiringExceptions - 1);
      const body = parseBody<Record<string, unknown>>(request);
      await fulfillJson(route, {
        id: `review-${exceptionId}`,
        excecaoId: exceptionId,
        decisao: String(body.decisao ?? "APROVADA"),
        comentario: String(body.comentario ?? ""),
        revisadoPor: "Root Admin",
        revisadoEm: "2026-04-11T10:45:00Z",
      });
      return;
    }

    if (path === "/api/v1/admin/seguranca/usuarios" && method === "GET") {
      const onlyEligible = url.searchParams.get("eligibleForNewUnits") === "true";
      const academiaId = url.searchParams.get("academiaId") ?? "";
      const items = [
        {
          id: "user-ana",
          nome: "Ana Admin",
          email: "ana@conceito.fit",
          active: true,
          status: "ATIVO",
          eligibleForNewUnits: true,
          academias: [{ id: "academia-norte", nome: "Rede Norte Fitness" }],
        },
        {
          id: "user-caio",
          nome: "Caio Compliance",
          email: "caio@conceito.fit",
          active: true,
          status: "ATIVO",
          eligibleForNewUnits: true,
          academias: [{ id: "academia-sul", nome: "Rede Sul Performance" }],
        },
      ].filter((item) => {
        if (onlyEligible && !item.eligibleForNewUnits) return false;
        if (academiaId && !item.academias.some((academia) => academia.id === academiaId)) return false;
        return true;
      });

      await fulfillJson(route, {
        page: 0,
        size: items.length,
        total: items.length,
        hasNext: false,
        items,
      });
      return;
    }

    if (path === "/api/v1/whatsapp/config" && method === "GET") {
      await fulfillJson(route, state.whatsAppConfig);
      return;
    }

    if (path === "/api/v1/whatsapp/config" && method === "PUT") {
      const body = parseBody<Record<string, unknown>>(request);
      state.whatsAppConfig = {
        ...state.whatsAppConfig,
        provedor: (body.provedor as WhatsAppConfigSeed["provedor"]) ?? state.whatsAppConfig.provedor,
        apiUrl: String(body.apiUrl ?? state.whatsAppConfig.apiUrl ?? ""),
        apiKey: String(body.apiKey ?? state.whatsAppConfig.apiKey ?? ""),
        instanciaId: String(body.instanciaId ?? state.whatsAppConfig.instanciaId ?? ""),
        numeroRemetente: String(body.numeroRemetente ?? state.whatsAppConfig.numeroRemetente ?? ""),
        ativo: body.ativo == null ? state.whatsAppConfig.ativo : Boolean(body.ativo),
        updatedAt: "2026-04-11T11:00:00Z",
      };
      await fulfillJson(route, state.whatsAppConfig);
      return;
    }

    if (path === "/api/v1/whatsapp/config/test" && method === "POST") {
      await fulfillJson(route, { success: true, message: "Conexão validada com sucesso." });
      return;
    }

    if (path === "/api/v1/whatsapp/templates" && method === "GET") {
      await fulfillJson(route, state.whatsAppTemplates);
      return;
    }

    if (path === "/api/v1/whatsapp/templates" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: WhatsAppTemplateSeed = {
        id: `tpl-${state.whatsAppTemplates.length + 1}`,
        tenantId: "tenant-centro",
        evento: (body.evento as WhatsAppTemplateSeed["evento"]) ?? (body.tipo as WhatsAppTemplateSeed["evento"]) ?? "CUSTOM",
        tipo: (body.tipo as WhatsAppTemplateSeed["tipo"]) ?? "CUSTOM",
        nome: String(body.nome ?? ""),
        slug: String(body.slug ?? ""),
        conteudo: String(body.conteudo ?? ""),
        ativo: body.ativo !== false,
        variaveis: Array.isArray(body.variaveis) ? (body.variaveis as string[]) : [],
        variables: Array.isArray(body.variaveis) ? (body.variaveis as string[]) : [],
        criadoEm: "2026-04-11T11:05:00Z",
        atualizadoEm: "2026-04-11T11:05:00Z",
      };
      state.whatsAppTemplates.unshift(created);
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/whatsapp\/templates\/[^/]+$/.test(path) && method === "PUT") {
      const templateId = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const template = state.whatsAppTemplates.find((item) => item.id === templateId);
      if (!template) {
        await fulfillJson(route, { message: "Template não encontrado." }, 404);
        return;
      }
      template.nome = String(body.nome ?? template.nome);
      template.slug = String(body.slug ?? template.slug ?? "");
      template.tipo = (body.tipo as WhatsAppTemplateSeed["tipo"]) ?? template.tipo;
      template.evento = template.tipo ?? template.evento;
      template.conteudo = String(body.conteudo ?? template.conteudo);
      template.ativo = body.ativo == null ? template.ativo : Boolean(body.ativo);
      template.variaveis = Array.isArray(body.variaveis) ? (body.variaveis as string[]) : template.variaveis;
      template.variables = template.variaveis;
      template.atualizadoEm = "2026-04-11T11:10:00Z";
      await fulfillJson(route, template);
      return;
    }

    if (/^\/api\/v1\/whatsapp\/templates\/[^/]+$/.test(path) && method === "DELETE") {
      const templateId = decodeURIComponent(path.split("/").at(-1) ?? "");
      state.whatsAppTemplates = state.whatsAppTemplates.filter((item) => item.id !== templateId);
      await fulfillJson(route, {});
      return;
    }

    if (path === "/api/v1/whatsapp/logs" && method === "GET") {
      await fulfillJson(route, state.whatsAppLogs);
      return;
    }

    if (path === "/api/v1/whatsapp/stats" && method === "GET") {
      await fulfillJson(route, buildBiStats(state));
      return;
    }

    if (path === "/api/v1/whatsapp/send" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: WhatsAppLogSeed = {
        id: `log-wa-${state.whatsAppLogs.length + 1}`,
        tenantId: "tenant-centro",
        evento: (body.evento as WhatsAppLogSeed["evento"]) ?? "CUSTOM",
        destinatario: String(body.destinatario ?? ""),
        destinatarioNome: String(body.destinatarioNome ?? "Teste"),
        conteudo: "Mensagem de teste",
        status: "ENVIADA",
        enviadoEm: "2026-04-11T11:15:00Z",
      };
      state.whatsAppLogs.unshift(created);
      await fulfillJson(route, created, 201);
      return;
    }

    if (path === "/api/v1/whatsapp/credentials" && method === "GET") {
      await fulfillJson(route, state.whatsAppCredentials);
      return;
    }

    if (path === "/api/v1/whatsapp/credentials" && method === "POST") {
      const body = parseBody<Record<string, unknown>>(request);
      const created: WhatsAppCredentialSeed = {
        id: `cred-wa-${state.whatsAppCredentials.length + 1}`,
        tenantId: "tenant-centro",
        academiaId: String(body.academiaId ?? "academia-norte"),
        unidadeId: String(body.unidadeId ?? "tenant-centro"),
        businessAccountId: String(body.businessAccountId ?? ""),
        wabaId: String(body.wabaId ?? ""),
        phoneId: String(body.phoneId ?? ""),
        phoneNumber: String(body.phoneNumber ?? ""),
        mode: (body.mode as WhatsAppCredentialSeed["mode"]) ?? "UNIT_NUMBER",
        accessTokenExpiresAt: String(body.accessTokenExpiresAt ?? "2026-05-20T10:00:00Z"),
        webhookVerifyToken: String(body.webhookVerifyToken ?? ""),
        onboardingStatus: "PENDING",
        onboardingStep: "CREATED",
        lastHealthCheckAt: null,
        createdAt: "2026-04-11T11:20:00Z",
        updatedAt: "2026-04-11T11:20:00Z",
        tokenExpiringSoon: false,
        tokenExpired: false,
      };
      state.whatsAppCredentials.unshift(created);
      await fulfillJson(route, created, 201);
      return;
    }

    if (/^\/api\/v1\/whatsapp\/credentials\/[^/]+$/.test(path) && method === "PUT") {
      const credentialId = decodeURIComponent(path.split("/").at(-1) ?? "");
      const body = parseBody<Record<string, unknown>>(request);
      const credential = state.whatsAppCredentials.find((item) => item.id === credentialId);
      if (!credential) {
        await fulfillJson(route, { message: "Credencial não encontrada." }, 404);
        return;
      }
      credential.businessAccountId = String(body.businessAccountId ?? credential.businessAccountId);
      credential.wabaId = String(body.wabaId ?? credential.wabaId);
      credential.phoneId = String(body.phoneId ?? credential.phoneId);
      credential.phoneNumber = String(body.phoneNumber ?? credential.phoneNumber);
      credential.mode = (body.mode as WhatsAppCredentialSeed["mode"]) ?? credential.mode;
      credential.accessTokenExpiresAt = String(body.accessTokenExpiresAt ?? credential.accessTokenExpiresAt);
      credential.updatedAt = "2026-04-11T11:25:00Z";
      await fulfillJson(route, credential);
      return;
    }

    if (/^\/api\/v1\/whatsapp\/credentials\/[^/]+$/.test(path) && method === "DELETE") {
      const credentialId = decodeURIComponent(path.split("/").at(-1) ?? "");
      state.whatsAppCredentials = state.whatsAppCredentials.filter((item) => item.id !== credentialId);
      await fulfillJson(route, {});
      return;
    }

    const refreshCredentialMatch = path.match(/^\/api\/v1\/whatsapp\/credentials\/([^/]+)\/refresh-token$/);
    if (refreshCredentialMatch && method === "POST") {
      const credentialId = decodeURIComponent(refreshCredentialMatch[1] ?? "");
      const credential = state.whatsAppCredentials.find((item) => item.id === credentialId);
      if (!credential) {
        await fulfillJson(route, { message: "Credencial não encontrada." }, 404);
        return;
      }
      credential.tokenExpiringSoon = false;
      credential.tokenExpired = false;
      credential.updatedAt = "2026-04-11T11:30:00Z";
      credential.lastHealthCheckAt = "2026-04-11T11:30:00Z";
      await fulfillJson(route, credential);
      return;
    }

    if (path === "/api/v1/admin/search/pessoas" && method === "GET") {
      await fulfillJson(route, buildSearchResponse(state, url.searchParams.get("q") ?? ""));
      return;
    }

    await route.fallback();
  });

  await installImportacaoMocks(page);

  return state;
}

export async function openBackofficeWaveCPage(
  page: Page,
  path: string,
  headingName: string | RegExp,
  overrides?: Partial<BackofficeWaveCState>,
) {
  const state = await installBackofficeWaveCMocks(page, overrides);
  await navigateAndWaitForHeading(page, path, headingName);
  return state;
}
