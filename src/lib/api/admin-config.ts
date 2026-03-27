import type {
  FeatureFlagMatrix,
  FeatureFlagMatrixAcademia,
  FeatureFlagMatrixCell,
  FeatureFlagMatrixRow,
  FeatureFlagPropagationStatus,
} from "@/lib/types";
import { apiRequest } from "./http";

type RawMatrixResponse = {
  academias?: unknown;
  features?: unknown;
  updatedAt?: unknown;
  matrix?: {
    academias?: unknown;
    features?: unknown;
    updatedAt?: unknown;
  } | null;
};

type RawAcademia = {
  academiaId?: unknown;
  id?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  totalUnits?: unknown;
  totalUnidades?: unknown;
  activeUnits?: unknown;
  unidadesAtivas?: unknown;
};

type RawCell = {
  academiaId?: unknown;
  id?: unknown;
  academiaNome?: unknown;
  nome?: unknown;
  enabled?: unknown;
  effectiveEnabled?: unknown;
  inheritedFromGlobal?: unknown;
  propagationStatus?: unknown;
  propagatedUnits?: unknown;
  unidadesPropagadas?: unknown;
  totalUnits?: unknown;
  totalUnidades?: unknown;
};

type RawFeature = {
  featureKey?: unknown;
  key?: unknown;
  featureLabel?: unknown;
  name?: unknown;
  moduleLabel?: unknown;
  module?: unknown;
  description?: unknown;
  globalEnabled?: unknown;
  enabled?: unknown;
  globalSource?: unknown;
  academias?: unknown;
  cells?: unknown;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim", "yes", "on", "ativa", "ativo"].includes(normalized)) return true;
    if (["false", "0", "nao", "não", "no", "off", "inativa", "inativo"].includes(normalized)) return false;
  }
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : fallback;
}

function toArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizePropagationStatus(value: unknown): FeatureFlagPropagationStatus {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "TOTAL" || normalized === "PARCIAL" || normalized === "PENDENTE") {
    return normalized;
  }
  return "PENDENTE";
}

function normalizeAcademia(input: RawAcademia): FeatureFlagMatrixAcademia | null {
  const academiaId = cleanString(input.academiaId) ?? cleanString(input.id);
  const academiaNome = cleanString(input.academiaNome) ?? cleanString(input.nome);
  if (!academiaId || !academiaNome) return null;

  return {
    academiaId,
    academiaNome,
    totalUnits: toNumber(input.totalUnits ?? input.totalUnidades, 0),
    activeUnits: toNumber(input.activeUnits ?? input.unidadesAtivas, 0),
  };
}

function normalizeCell(input: RawCell, academiaFallback?: FeatureFlagMatrixAcademia): FeatureFlagMatrixCell | null {
  const academiaId =
    cleanString(input.academiaId)
    ?? cleanString(input.id)
    ?? academiaFallback?.academiaId;
  if (!academiaId) return null;

  return {
    academiaId,
    academiaNome:
      cleanString(input.academiaNome)
      ?? cleanString(input.nome)
      ?? academiaFallback?.academiaNome,
    enabled: toBoolean(input.enabled),
    effectiveEnabled: toBoolean(input.effectiveEnabled ?? input.enabled),
    inheritedFromGlobal: toBoolean(input.inheritedFromGlobal),
    propagationStatus: normalizePropagationStatus(input.propagationStatus),
    propagatedUnits: toNumber(input.propagatedUnits ?? input.unidadesPropagadas, 0),
    totalUnits: toNumber(input.totalUnits ?? input.totalUnidades ?? academiaFallback?.totalUnits, 0),
  };
}

function normalizeFeature(
  input: RawFeature,
  academias: FeatureFlagMatrixAcademia[],
): FeatureFlagMatrixRow | null {
  const featureKey = cleanString(input.featureKey) ?? cleanString(input.key);
  if (!featureKey) return null;

  const mappedCells = toArray<RawCell>(input.academias ?? input.cells)
    .map((cell) => normalizeCell(cell))
    .filter((cell): cell is FeatureFlagMatrixCell => cell !== null);

  const cellsByAcademiaId = new Map(mappedCells.map((cell) => [cell.academiaId, cell] as const));
  const academiasCells = academias.map((academia) => {
    const existing = cellsByAcademiaId.get(academia.academiaId);
    if (existing) {
      return {
        ...existing,
        academiaNome: existing.academiaNome ?? academia.academiaNome,
        totalUnits: existing.totalUnits || academia.totalUnits,
      };
    }
    return normalizeCell(
      {
        academiaId: academia.academiaId,
        academiaNome: academia.academiaNome,
        enabled: input.globalEnabled ?? input.enabled,
        effectiveEnabled: input.globalEnabled ?? input.enabled,
        inheritedFromGlobal: true,
        propagationStatus: academia.totalUnits > 0 ? "TOTAL" : "PENDENTE",
        propagatedUnits: academia.totalUnits,
        totalUnits: academia.totalUnits,
      },
      academia,
    ) as FeatureFlagMatrixCell;
  });

  return {
    featureKey,
    featureLabel: cleanString(input.featureLabel) ?? cleanString(input.name) ?? featureKey,
    moduleLabel: cleanString(input.moduleLabel) ?? cleanString(input.module) ?? "Geral",
    description: cleanString(input.description),
    globalEnabled: toBoolean(input.globalEnabled ?? input.enabled, true),
    globalSource: cleanString(input.globalSource)?.toUpperCase() === "ACADEMIA" ? "ACADEMIA" : "GLOBAL",
    academias: academiasCells,
  };
}

function normalizeMatrix(response: RawMatrixResponse): FeatureFlagMatrix {
  const rawMatrix = response.matrix ?? response;
  const academias = toArray<RawAcademia>(rawMatrix.academias)
    .map(normalizeAcademia)
    .filter((item): item is FeatureFlagMatrixAcademia => item !== null);

  const features = toArray<RawFeature>(rawMatrix.features)
    .map((feature) => normalizeFeature(feature, academias))
    .filter((item): item is FeatureFlagMatrixRow => item !== null);

  return {
    academias,
    features,
    updatedAt: cleanString(rawMatrix.updatedAt),
  };
}

export async function getFeatureFlagsMatrixApi(): Promise<FeatureFlagMatrix> {
  const response = await apiRequest<RawMatrixResponse>({
    path: "/api/v1/admin/configuracoes/feature-flags/matrix",
  });
  return normalizeMatrix(response);
}

export async function toggleFeatureForAcademiaApi(input: {
  featureKey: string;
  enabled: boolean;
  academiaId?: string;
}): Promise<FeatureFlagMatrix> {
  const featureKey = encodeURIComponent(input.featureKey);
  const path = input.academiaId
    ? `/api/v1/admin/configuracoes/feature-flags/${featureKey}/academias/${input.academiaId}`
    : `/api/v1/admin/configuracoes/feature-flags/${featureKey}/global`;

  const response = await apiRequest<RawMatrixResponse>({
    path,
    method: "PATCH",
    body: {
      enabled: input.enabled,
    },
  });
  return normalizeMatrix(response);
}
