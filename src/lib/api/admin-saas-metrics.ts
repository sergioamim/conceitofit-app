import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Types — espelham DTOs do backend SaasMetricsController
// ---------------------------------------------------------------------------

export interface SaasMetricsResponse {
  geradoEm: string;
  totalAcademias: number;
  academiasAtivas: number;
  academiasDemo: number;
  totalTenants: number;
  tenantsAtivos: number;
  totalAlunosAtivos: number;
  academiasNovas30d: number;
  leadsB2bNovos30d: number;
  leadsB2bConvertidos: number;
  mrr: number;
  churnRate: number;
  ticketMedio: number;
}

export interface SaasPontoSerie {
  data: string;
  valor: number;
}

export interface SaasSeriesResponse {
  metrica: string;
  periodo: string;
  pontos: SaasPontoSerie[];
}

export interface AcademiaOnboarding {
  academiaId: string;
  nome: string;
  subdominio: string;
  demo: boolean;
  ativa: boolean;
  dataOnboarding: string;
  dataCriacao: string;
  totalAlunos: number;
  totalTenants: number;
}

export interface SaasOnboardingResponse {
  academias: AcademiaOnboarding[];
  total: number;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** GET /api/v1/admin/metrics/saas — métricas SaaS consolidadas */
export async function getSaasMetrics(): Promise<SaasMetricsResponse> {
  return apiRequest<SaasMetricsResponse>({
    path: "/api/v1/admin/metrics/saas",
  });
}

/** GET /api/v1/admin/metrics/saas/series — série temporal de métricas */
export async function getSaasSeries(params?: {
  metrica?: string;
  periodo?: string;
}): Promise<SaasSeriesResponse> {
  return apiRequest<SaasSeriesResponse>({
    path: "/api/v1/admin/metrics/saas/series",
    query: params,
  });
}

/** GET /api/v1/admin/metrics/saas/onboarding — academias em onboarding */
export async function getSaasOnboarding(): Promise<SaasOnboardingResponse> {
  return apiRequest<SaasOnboardingResponse>({
    path: "/api/v1/admin/metrics/saas/onboarding",
  });
}
