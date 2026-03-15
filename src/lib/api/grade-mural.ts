import type {
  Academia,
  DiaSemana,
  HorarioFuncionamento,
  Tenant,
  TenantThemePreset,
} from "@/lib/types";
import { apiRequest } from "./http";
import { getActiveTenantIdFromSession, getAvailableTenantsFromSession, getPreferredTenantId } from "./session";

export type GradeMuralItem = {
  id: string;
  horaInicio: string;
  horaFim: string;
  capacidade: number;
  checkinLiberadoMinutosAntes: number;
  local?: string;
  instrutor?: string;
  atividade?: {
    nome: string;
    permiteCheckin: boolean;
    checkinObrigatorio: boolean;
  };
  sala?: {
    nome: string;
  };
  funcionario?: {
    nome: string;
  };
};

export type GradeMuralDay = {
  dayTag: DiaSemana;
  date: string;
  horarioDia?: HorarioFuncionamento;
  itens: GradeMuralItem[];
};

export type GradeMuralSnapshot = {
  tenant: Tenant;
  academia: Academia;
  weekStart: string;
  weekEnd: string;
  days: GradeMuralDay[];
};

type GradeMuralApiItem = {
  id?: string;
  horaInicio?: string;
  horaFim?: string;
  capacidade?: unknown;
  checkinLiberadoMinutosAntes?: unknown;
  local?: string | null;
  instrutor?: string | null;
  atividadeNome?: string | null;
  salaNome?: string | null;
  funcionarioNome?: string | null;
  atividade?: {
    nome?: string | null;
    permiteCheckin?: boolean | null;
    checkinObrigatorio?: boolean | null;
  } | null;
  sala?: {
    nome?: string | null;
  } | null;
  funcionario?: {
    nome?: string | null;
  } | null;
};

type GradeMuralApiDay = {
  dayTag?: DiaSemana | null;
  dia?: DiaSemana | null;
  date?: string | null;
  data?: string | null;
  horarioDia?: HorarioFuncionamento | null;
  horario?: HorarioFuncionamento | null;
  itens?: GradeMuralApiItem[] | null;
  items?: GradeMuralApiItem[] | null;
  atividades?: GradeMuralApiItem[] | null;
};

type GradeMuralApiResponse = {
  tenant?: {
    id?: string | null;
    nome?: string | null;
    academiaId?: string | null;
    groupId?: string | null;
    branding?: {
      appName?: string | null;
      logoUrl?: string | null;
      themePreset?: TenantThemePreset | null;
      useCustomColors?: boolean | null;
      colors?: Record<string, string> | null;
    } | null;
  } | null;
  academia?: {
    id?: string | null;
    nome?: string | null;
    branding?: {
      appName?: string | null;
      logoUrl?: string | null;
      themePreset?: TenantThemePreset | null;
      useCustomColors?: boolean | null;
      colors?: Record<string, string> | null;
    } | null;
  } | null;
  weekStart?: string | null;
  weekEnd?: string | null;
  days?: GradeMuralApiDay[] | null;
};

type GradeMuralBrandingApi = {
  appName?: string | null;
  logoUrl?: string | null;
  themePreset?: TenantThemePreset | null;
  useCustomColors?: boolean | null;
  colors?: Record<string, string> | null;
} | null | undefined;

const DEFAULT_DAY_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

function resolveTenantId(explicitTenantId?: string): string | undefined {
  const normalizedExplicit = explicitTenantId?.trim();
  if (normalizedExplicit) return normalizedExplicit;

  const active = getActiveTenantIdFromSession()?.trim();
  if (active) return active;

  const preferred = getPreferredTenantId()?.trim();
  if (preferred) return preferred;

  return getAvailableTenantsFromSession()
    .map((item) => item.tenantId.trim())
    .find(Boolean);
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function normalizeBranding(input: GradeMuralBrandingApi) {
  if (!input) return undefined;
  return {
    appName: input.appName ?? undefined,
    logoUrl: input.logoUrl ?? undefined,
    themePreset: input.themePreset ?? undefined,
    useCustomColors: input.useCustomColors ?? false,
    colors: input.colors ?? undefined,
  };
}

function normalizeTenant(input: GradeMuralApiResponse["tenant"], tenantId: string): Tenant {
  return {
    id: input?.id ?? tenantId,
    nome: input?.nome ?? "Unidade ativa",
    academiaId: input?.academiaId ?? undefined,
    groupId: input?.groupId ?? undefined,
    ativo: true,
    branding: normalizeBranding(input?.branding),
  };
}

function normalizeAcademia(input: GradeMuralApiResponse["academia"]): Academia {
  return {
    id: input?.id ?? "academia-mural",
    nome: input?.nome ?? "Academia",
    ativo: true,
    branding: normalizeBranding(input?.branding),
  };
}

function normalizeHorarioDia(input?: HorarioFuncionamento | null): HorarioFuncionamento | undefined {
  if (!input) return undefined;
  return {
    dia: input.dia,
    abre: input.abre,
    fecha: input.fecha,
    fechado: input.fechado ?? false,
  };
}

function normalizeItem(input: GradeMuralApiItem): GradeMuralItem {
  const atividadeNome = input.atividade?.nome ?? input.atividadeNome ?? "Atividade";
  const salaNome = input.sala?.nome ?? input.salaNome ?? undefined;
  const funcionarioNome = input.funcionario?.nome ?? input.funcionarioNome ?? undefined;

  return {
    id: input.id ?? `${atividadeNome}-${input.horaInicio ?? "00:00"}`,
    horaInicio: input.horaInicio ?? "00:00",
    horaFim: input.horaFim ?? "00:00",
    capacidade: toNumber(input.capacidade),
    checkinLiberadoMinutosAntes: toNumber(input.checkinLiberadoMinutosAntes),
    local: input.local ?? salaNome ?? undefined,
    instrutor: input.instrutor ?? funcionarioNome ?? undefined,
    atividade: {
      nome: atividadeNome,
      permiteCheckin: input.atividade?.permiteCheckin ?? true,
      checkinObrigatorio: input.atividade?.checkinObrigatorio ?? false,
    },
    sala: salaNome ? { nome: salaNome } : undefined,
    funcionario: funcionarioNome ? { nome: funcionarioNome } : undefined,
  };
}

function normalizeDay(input: GradeMuralApiDay, index: number): GradeMuralDay {
  const dayTag = input.dayTag ?? input.dia ?? DEFAULT_DAY_ORDER[index] ?? "SEG";
  const items = input.itens ?? input.items ?? input.atividades ?? [];

  return {
    dayTag,
    date: input.date ?? input.data ?? "",
    horarioDia: normalizeHorarioDia(input.horarioDia ?? input.horario),
    itens: items.map(normalizeItem),
  };
}

function resolveWeekBounds(days: GradeMuralDay[]): { weekStart: string; weekEnd: string } {
  const dates = days.map((day) => day.date).filter(Boolean).sort();
  return {
    weekStart: dates[0] ?? "",
    weekEnd: dates[dates.length - 1] ?? "",
  };
}

export async function getGradeMuralSnapshotApi(input: {
  tenantId?: string;
  date?: string;
}): Promise<GradeMuralSnapshot> {
  const tenantId = resolveTenantId(input.tenantId);
  if (!tenantId) {
    throw new Error("Nenhuma unidade disponível para carregar o mural.");
  }

  const response = await apiRequest<GradeMuralApiResponse>({
    path: `/api/v1/grade/mural/${tenantId}`,
    query: {
      date: input.date,
    },
  });

  const days = (response.days ?? []).map(normalizeDay);
  const bounds = resolveWeekBounds(days);

  return {
    tenant: normalizeTenant(response.tenant, tenantId),
    academia: normalizeAcademia(response.academia),
    weekStart: response.weekStart ?? bounds.weekStart,
    weekEnd: response.weekEnd ?? bounds.weekEnd,
    days,
  };
}
