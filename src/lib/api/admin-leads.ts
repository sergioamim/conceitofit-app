import type { LeadB2b, LeadB2bStats, StatusLeadB2b } from "@/lib/shared/types/lead-b2b";
import { apiRequest } from "./http";

type LeadB2bApiResponse = Partial<LeadB2b> & {
  id?: string | null;
  nome?: string | null;
  email?: string | null;
  telefone?: string | null;
  nomeAcademia?: string | null;
  quantidadeAlunos?: unknown;
  cidade?: string | null;
  estado?: string | null;
  origem?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  status?: StatusLeadB2b | null;
  notas?: string | null;
  dataCriacao?: string | null;
  dataAtualizacao?: string | null;
};

type LeadB2bStatsApiResponse = Partial<LeadB2bStats> & {
  total?: unknown;
  novos?: unknown;
  contatados?: unknown;
  qualificados?: unknown;
  negociando?: unknown;
  convertidos?: unknown;
  perdidos?: unknown;
};

type AnyListResponse<T> =
  | T[]
  | {
      items?: T[];
      content?: T[];
      data?: T[];
      rows?: T[];
      result?: T[];
      itens?: T[];
    };

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function extractItems<T>(response: AnyListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response.items ?? response.content ?? response.data ?? response.rows ?? response.result ?? response.itens ?? [];
}

function normalizeLeadB2b(input: LeadB2bApiResponse, fallback?: Partial<LeadB2b>): LeadB2b {
  return {
    id: cleanString(input.id) ?? fallback?.id ?? "",
    nome: cleanString(input.nome) ?? fallback?.nome ?? "",
    email: cleanString(input.email) ?? fallback?.email ?? "",
    telefone: cleanString(input.telefone) ?? fallback?.telefone ?? "",
    nomeAcademia: cleanString(input.nomeAcademia) ?? fallback?.nomeAcademia,
    quantidadeAlunos: toOptionalNumber(input.quantidadeAlunos) ?? fallback?.quantidadeAlunos,
    cidade: cleanString(input.cidade) ?? fallback?.cidade,
    estado: cleanString(input.estado) ?? fallback?.estado,
    origem: cleanString(input.origem) ?? fallback?.origem ?? "LANDING_PAGE",
    utmSource: cleanString(input.utmSource) ?? fallback?.utmSource,
    utmMedium: cleanString(input.utmMedium) ?? fallback?.utmMedium,
    utmCampaign: cleanString(input.utmCampaign) ?? fallback?.utmCampaign,
    status: input.status ?? fallback?.status ?? "NOVO",
    notas: cleanString(input.notas) ?? fallback?.notas,
    dataCriacao: cleanString(input.dataCriacao) ?? fallback?.dataCriacao ?? "",
    dataAtualizacao: cleanString(input.dataAtualizacao) ?? fallback?.dataAtualizacao,
  };
}

function normalizeLeadB2bStats(input: LeadB2bStatsApiResponse): LeadB2bStats {
  return {
    total: toNumber(input.total),
    novos: toNumber(input.novos),
    contatados: toNumber(input.contatados),
    qualificados: toNumber(input.qualificados),
    negociando: toNumber(input.negociando),
    convertidos: toNumber(input.convertidos),
    perdidos: toNumber(input.perdidos),
  };
}

export async function listAdminLeads(status?: StatusLeadB2b): Promise<LeadB2b[]> {
  const response = await apiRequest<AnyListResponse<LeadB2bApiResponse>>({
    path: "/api/v1/admin/leads",
    query: { status },
  });
  return extractItems(response).map((item) => normalizeLeadB2b(item));
}

export async function getAdminLeadStats(): Promise<LeadB2bStats> {
  const response = await apiRequest<LeadB2bStatsApiResponse>({
    path: "/api/v1/admin/leads/stats",
  });
  return normalizeLeadB2bStats(response);
}

export async function getAdminLead(id: string): Promise<LeadB2b> {
  const response = await apiRequest<LeadB2bApiResponse>({
    path: `/api/v1/admin/leads/${id}`,
  });
  return normalizeLeadB2b(response, { id });
}

export async function updateAdminLeadNotas(id: string, notas: string): Promise<LeadB2b> {
  const response = await apiRequest<LeadB2bApiResponse>({
    path: `/api/v1/admin/leads/${id}/notas`,
    method: "PATCH",
    body: { notas },
  });
  return normalizeLeadB2b(response, { id, notas });
}

export async function updateAdminLeadStatus(id: string, status: StatusLeadB2b): Promise<LeadB2b> {
  const response = await apiRequest<LeadB2bApiResponse>({
    path: `/api/v1/admin/leads/${id}/status`,
    method: "PATCH",
    body: { status },
  });
  return normalizeLeadB2b(response, { id, status });
}
