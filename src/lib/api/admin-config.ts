import type {
  FeatureFlagMatrix,
  FeatureFlagMatrixAcademia,
  FeatureFlagMatrixCell,
  FeatureFlagMatrixRow,
  FeatureFlagPropagationStatus,
  GlobalConfig,
  GlobalConfigEmailTemplate,
  IntegrationHealthStatus,
  IntegrationStatus,
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

type RawIntegrationStatus = {
  integrationKey?: unknown;
  key?: unknown;
  integrationName?: unknown;
  name?: unknown;
  providerLabel?: unknown;
  provider?: unknown;
  status?: unknown;
  uptimePercent?: unknown;
  uptime?: unknown;
  avgLatencyMs?: unknown;
  latencyMs?: unknown;
  pendingCount?: unknown;
  filaPendente?: unknown;
  lastCheckAt?: unknown;
  ultimaVerificacaoEm?: unknown;
  lastSuccessAt?: unknown;
  ultimaSucessoEm?: unknown;
  lastErrorMessage?: unknown;
  ultimoErro?: unknown;
  lastErrorAt?: unknown;
  ultimoErroEm?: unknown;
  docsHref?: unknown;
  documentationUrl?: unknown;
};

type RawGlobalConfigEmailTemplate = {
  id?: unknown;
  slug?: unknown;
  key?: unknown;
  nome?: unknown;
  name?: unknown;
  assunto?: unknown;
  subject?: unknown;
  canal?: unknown;
  channel?: unknown;
  ativo?: unknown;
  enabled?: unknown;
  bodyHtml?: unknown;
  html?: unknown;
  variables?: unknown;
  variaveis?: unknown;
  updatedAt?: unknown;
};

type RawGlobalConfigResponse = {
  emailTemplates?: unknown;
  templates?: unknown;
  termsOfUseHtml?: unknown;
  termosUsoHtml?: unknown;
  termsVersion?: unknown;
  versaoTermos?: unknown;
  termsUpdatedAt?: unknown;
  termosAtualizadosEm?: unknown;
  apiLimits?: {
    requestsPerMinute?: unknown;
    rpm?: unknown;
    burstLimit?: unknown;
    burst?: unknown;
    webhookRequestsPerMinute?: unknown;
    webhookRpm?: unknown;
    adminRequestsPerMinute?: unknown;
    adminRpm?: unknown;
  } | null;
  limitesApi?: {
    requestsPerMinute?: unknown;
    rpm?: unknown;
    burstLimit?: unknown;
    burst?: unknown;
    webhookRequestsPerMinute?: unknown;
    webhookRpm?: unknown;
    adminRequestsPerMinute?: unknown;
    adminRpm?: unknown;
  } | null;
  updatedAt?: unknown;
  updatedBy?: unknown;
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

function normalizeIntegrationHealthStatus(value: unknown): IntegrationHealthStatus {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "ONLINE" || normalized === "DEGRADED" || normalized === "OFFLINE" || normalized === "MAINTENANCE") {
    return normalized;
  }
  return "DEGRADED";
}

function normalizeIntegrationStatus(input: RawIntegrationStatus): IntegrationStatus | null {
  const integrationKey = cleanString(input.integrationKey) ?? cleanString(input.key);
  const integrationName = cleanString(input.integrationName) ?? cleanString(input.name);
  if (!integrationKey || !integrationName) return null;

  return {
    integrationKey: integrationKey as IntegrationStatus["integrationKey"],
    integrationName,
    providerLabel: cleanString(input.providerLabel) ?? cleanString(input.provider) ?? "Não informado",
    status: normalizeIntegrationHealthStatus(input.status),
    uptimePercent: toNumber(input.uptimePercent ?? input.uptime, 0),
    avgLatencyMs: toNumber(input.avgLatencyMs ?? input.latencyMs, 0),
    pendingCount: Math.max(0, toNumber(input.pendingCount ?? input.filaPendente, 0)),
    lastCheckAt: cleanString(input.lastCheckAt) ?? cleanString(input.ultimaVerificacaoEm),
    lastSuccessAt: cleanString(input.lastSuccessAt) ?? cleanString(input.ultimaSucessoEm),
    lastErrorMessage: cleanString(input.lastErrorMessage) ?? cleanString(input.ultimoErro),
    lastErrorAt: cleanString(input.lastErrorAt) ?? cleanString(input.ultimoErroEm),
    docsHref: cleanString(input.docsHref) ?? cleanString(input.documentationUrl),
  };
}

function normalizeEmailTemplate(input: RawGlobalConfigEmailTemplate, index: number): GlobalConfigEmailTemplate | null {
  const slug = cleanString(input.slug) ?? cleanString(input.key);
  const nome = cleanString(input.nome) ?? cleanString(input.name);
  if (!slug || !nome) return null;

  const variables = toArray<unknown>(input.variables ?? input.variaveis)
    .map((item) => cleanString(item))
    .filter((item): item is string => Boolean(item));

  return {
    id: cleanString(input.id) ?? `${slug}-${index + 1}`,
    slug,
    nome,
    assunto: cleanString(input.assunto) ?? cleanString(input.subject) ?? "",
    canal:
      cleanString(input.canal ?? input.channel)?.toUpperCase() === "SMS"
        ? "SMS"
        : cleanString(input.canal ?? input.channel)?.toUpperCase() === "WHATSAPP"
          ? "WHATSAPP"
          : "EMAIL",
    ativo: toBoolean(input.ativo ?? input.enabled, true),
    bodyHtml: cleanString(input.bodyHtml) ?? cleanString(input.html) ?? "<p></p>",
    variables,
    updatedAt: cleanString(input.updatedAt),
  };
}

function normalizeGlobalConfig(response: RawGlobalConfigResponse): GlobalConfig {
  const rawApiLimits = response.apiLimits ?? response.limitesApi;
  return {
    emailTemplates: toArray<RawGlobalConfigEmailTemplate>(response.emailTemplates ?? response.templates)
      .map(normalizeEmailTemplate)
      .filter((item): item is GlobalConfigEmailTemplate => item !== null),
    termsOfUseHtml: cleanString(response.termsOfUseHtml) ?? cleanString(response.termosUsoHtml) ?? "<p></p>",
    termsVersion: cleanString(response.termsVersion) ?? cleanString(response.versaoTermos) ?? "v1.0",
    termsUpdatedAt: cleanString(response.termsUpdatedAt) ?? cleanString(response.termosAtualizadosEm),
    apiLimits: {
      requestsPerMinute: Math.max(1, toNumber(rawApiLimits?.requestsPerMinute ?? rawApiLimits?.rpm, 120)),
      burstLimit: Math.max(1, toNumber(rawApiLimits?.burstLimit ?? rawApiLimits?.burst, 240)),
      webhookRequestsPerMinute: Math.max(1, toNumber(rawApiLimits?.webhookRequestsPerMinute ?? rawApiLimits?.webhookRpm, 90)),
      adminRequestsPerMinute: Math.max(1, toNumber(rawApiLimits?.adminRequestsPerMinute ?? rawApiLimits?.adminRpm, 60)),
    },
    updatedAt: cleanString(response.updatedAt),
    updatedBy: cleanString(response.updatedBy),
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

export async function getIntegrationStatusApi(): Promise<IntegrationStatus[]> {
  const response = await apiRequest<RawIntegrationStatus[] | { items?: RawIntegrationStatus[]; integrations?: RawIntegrationStatus[] }>({
    path: "/api/v1/admin/configuracoes/integracoes/status",
  });

  const items = Array.isArray(response) ? response : response.items ?? response.integrations ?? [];
  return items
    .map(normalizeIntegrationStatus)
    .filter((item): item is IntegrationStatus => item !== null);
}

export async function getGlobalConfigApi(): Promise<GlobalConfig> {
  const response = await apiRequest<RawGlobalConfigResponse>({
    path: "/api/v1/admin/configuracoes/global",
  });
  return normalizeGlobalConfig(response);
}

export async function updateGlobalConfigApi(input: GlobalConfig): Promise<GlobalConfig> {
  const response = await apiRequest<RawGlobalConfigResponse>({
    path: "/api/v1/admin/configuracoes/global",
    method: "PUT",
    body: {
      emailTemplates: input.emailTemplates.map((template) => ({
        id: template.id,
        slug: template.slug,
        nome: template.nome,
        assunto: template.assunto,
        canal: template.canal,
        ativo: template.ativo,
        bodyHtml: template.bodyHtml,
        variables: template.variables,
      })),
      termsOfUseHtml: input.termsOfUseHtml,
      termsVersion: input.termsVersion,
      apiLimits: {
        requestsPerMinute: input.apiLimits.requestsPerMinute,
        burstLimit: input.apiLimits.burstLimit,
        webhookRequestsPerMinute: input.apiLimits.webhookRequestsPerMinute,
        adminRequestsPerMinute: input.apiLimits.adminRequestsPerMinute,
      },
    },
  });
  return normalizeGlobalConfig(response);
}
