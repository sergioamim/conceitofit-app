import type {
  BiOperationalSnapshot,
  BiResumoOperacional,
  BiDeltaOperacional,
  BiSeriePonto,
} from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { apiRequest } from "@/lib/api/http";

// ---------------------------------------------------------------------------
// Response shapes (backend admin BI endpoints)
// ---------------------------------------------------------------------------

type Envelope<T> =
  | T
  | { data?: T; content?: T; result?: T };

interface AdminBiResumoResponse {
  conversaoPct?: number;
  ocupacaoPct?: number;
  inadimplenciaPct?: number;
  retencaoPct?: number;
  receita?: number;
  ativos?: number;
  prospects?: number;
  conversoes?: number;
  lugaresOcupados?: number;
  lugaresDisponiveis?: number;
  valorInadimplente?: number;
  valorEmAberto?: number;
}

interface AdminBiComparativoResponse {
  conversaoPct?: number;
  ocupacaoPct?: number;
  inadimplenciaPct?: number;
  retencaoPct?: number;
  receita?: number;
  ativos?: number;
}

interface AdminBiSerieItemResponse {
  label?: string;
  periodoInicio?: string;
  periodoFim?: string;
  receita?: number;
  conversaoPct?: number;
  ocupacaoPct?: number;
  inadimplenciaPct?: number;
  retencaoPct?: number;
}

interface AdminBiResumoGeralResponse {
  academiaId?: string;
  academiaNome?: string;
  scope?: string;
  startDate?: string;
  endDate?: string;
  kpis?: AdminBiResumoResponse;
  deltas?: AdminBiComparativoResponse;
  series?: AdminBiSerieItemResponse[];
  generatedAt?: string;
}

// ---------------------------------------------------------------------------
// Extractors
// ---------------------------------------------------------------------------

function extractPayload<T>(response: Envelope<T>): T {
  if (!response || typeof response !== "object") return {} as T;
  if ("data" in response || "content" in response || "result" in response) {
    const wrapped = response as Exclude<Envelope<T>, T>;
    return wrapped.data ?? wrapped.content ?? wrapped.result ?? ({} as T);
  }
  return response as T;
}

function num(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalizeKpis(raw?: AdminBiResumoResponse): BiResumoOperacional {
  const r = raw ?? {};
  return {
    conversaoPct: num(r.conversaoPct),
    ocupacaoPct: num(r.ocupacaoPct),
    inadimplenciaPct: num(r.inadimplenciaPct),
    retencaoPct: num(r.retencaoPct),
    receita: num(r.receita),
    ativos: num(r.ativos),
    prospects: num(r.prospects),
    conversoes: num(r.conversoes),
    lugaresOcupados: num(r.lugaresOcupados),
    lugaresDisponiveis: num(r.lugaresDisponiveis),
    valorInadimplente: num(r.valorInadimplente),
    valorEmAberto: num(r.valorEmAberto),
  };
}

function normalizeDeltas(raw?: AdminBiComparativoResponse): BiDeltaOperacional {
  const r = raw ?? {};
  return {
    conversaoPct: num(r.conversaoPct),
    ocupacaoPct: num(r.ocupacaoPct),
    inadimplenciaPct: num(r.inadimplenciaPct),
    retencaoPct: num(r.retencaoPct),
    receita: num(r.receita),
    ativos: num(r.ativos),
  };
}

function normalizeSerie(items?: AdminBiSerieItemResponse[]): BiSeriePonto[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) => ({
    label: str(item.label) || "—",
    periodoInicio: str(item.periodoInicio),
    periodoFim: str(item.periodoFim),
    receita: num(item.receita),
    conversaoPct: num(item.conversaoPct),
    ocupacaoPct: num(item.ocupacaoPct),
    inadimplenciaPct: num(item.inadimplenciaPct),
    retencaoPct: num(item.retencaoPct),
  }));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getAdminBiResumoApi(academiaId: string): Promise<BiResumoOperacional> {
  const response = await apiRequest<Envelope<AdminBiResumoResponse>>({
    path: `/api/v1/admin/bi/academias/${academiaId}/executivo/resumo`,
  });
  return normalizeKpis(extractPayload(response));
}

export async function getAdminBiComparativoApi(academiaId: string): Promise<BiDeltaOperacional> {
  const response = await apiRequest<Envelope<AdminBiComparativoResponse>>({
    path: `/api/v1/admin/bi/academias/${academiaId}/executivo/comparativo`,
  });
  return normalizeDeltas(extractPayload(response));
}

export async function getAdminBiSerieApi(academiaId: string): Promise<BiSeriePonto[]> {
  const response = await apiRequest<Envelope<AdminBiSerieItemResponse[]>>({
    path: `/api/v1/admin/bi/academias/${academiaId}/executivo/serie`,
  });
  return normalizeSerie(extractPayload(response));
}

async function getAdminBiResumoGeralApi(academiaId: string): Promise<BiOperationalSnapshot> {
  const response = await apiRequest<Envelope<AdminBiResumoGeralResponse>>({
    path: `/api/v1/admin/bi/academias/${academiaId}/resumo`,
  });
  const payload = extractPayload(response);
  return {
    scope: (payload.scope as "UNIDADE" | "ACADEMIA") ?? "ACADEMIA",
    startDate: str(payload.startDate),
    endDate: str(payload.endDate),
    academiaId: str(payload.academiaId) || academiaId,
    academiaNome: str(payload.academiaNome),
    segmento: FILTER_ALL,
    kpis: normalizeKpis(payload.kpis),
    deltas: normalizeDeltas(payload.deltas),
    series: normalizeSerie(payload.series),
    benchmark: [],
    quality: [],
    generatedAt: str(payload.generatedAt) || new Date().toISOString(),
  };
}

export type AdminBiExecutivoData = {
  kpis: BiResumoOperacional;
  deltas: BiDeltaOperacional;
  series: BiSeriePonto[];
};

export async function getAdminBiExecutivoCompleto(academiaId: string): Promise<AdminBiExecutivoData> {
  const [kpis, deltas, series] = await Promise.all([
    getAdminBiResumoApi(academiaId),
    getAdminBiComparativoApi(academiaId),
    getAdminBiSerieApi(academiaId),
  ]);
  return { kpis, deltas, series };
}
