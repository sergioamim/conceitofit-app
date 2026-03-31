import { buildBiOperationalSnapshot } from "@/lib/tenant/bi/analytics";
import { getBusinessMonthRange } from "@/lib/business-date";
import { FILTER_ALL } from "@/lib/shared/constants/filters";
import { listContasReceberOperacionais } from "@/lib/tenant/financeiro/recebimentos";
import type {
  Academia,
  AtividadeGrade,
  BiEscopo,
  BiOperationalSnapshot,
  BiSegmento,
  Matricula,
  Pagamento,
  Prospect,
  Tenant,
} from "@/lib/types";
import { extractAlunosFromListResponse, listAlunosApi } from "./alunos";
import { listAtividadeGradesApi } from "./administrativo";
import { getActiveTenantIdFromSession, getAvailableTenantsFromSession, getPreferredTenantId } from "./session";
import { ApiRequestError } from "./http";
import { listAcademiasApi, listUnidadesApi, setTenantContextApi } from "./contexto-unidades";
import { listProspectsApi } from "./crm";
import { listMatriculasApi } from "./matriculas";
import { listReservasAulaApi } from "./reservas";

type GetBiOperacionalSnapshotInput = {
  scope?: BiEscopo;
  tenantId?: string;
  academiaId?: string;
  startDate?: string;
  endDate?: string;
  segmento?: BiSegmento;
  canViewNetwork?: boolean;
};

type TenantBiDataset = {
  prospects: Prospect[];
  matriculas: Matricula[];
  pagamentos: Pagamento[];
  atividadeGrades: AtividadeGrade[];
  reservasAulas: Awaited<ReturnType<typeof listReservasAulaApi>>;
  alunos: ReturnType<typeof extractAlunosFromListResponse>;
};

function resolveVisibleTenants(tenants: Tenant[]): Tenant[] {
  const availableTenantIds = new Set(
    getAvailableTenantsFromSession()
      .map((item) => item.tenantId.trim())
      .filter(Boolean)
  );

  if (availableTenantIds.size === 0) {
    return tenants;
  }

  const visible = tenants.filter((tenant) => availableTenantIds.has(tenant.id));
  return visible.length > 0 ? visible : tenants;
}

function resolveDefaultTenantId(tenants: Tenant[]): string | undefined {
  const current = getActiveTenantIdFromSession()?.trim();
  if (current) return current;

  const preferred = getPreferredTenantId()?.trim();
  if (preferred) return preferred;

  return (
    getAvailableTenantsFromSession()
      .map((item) => item.tenantId.trim())
      .find(Boolean) ?? tenants[0]?.id
  );
}

function resolveRequestedAcademiaId(input: {
  academias: Academia[];
  tenants: Tenant[];
  scope: BiEscopo;
  tenantId?: string;
  academiaId?: string;
}): string | undefined {
  if (input.scope === "ACADEMIA" && input.academiaId) {
    return input.academiaId;
  }

  if (input.tenantId) {
    const tenant = input.tenants.find((item) => item.id === input.tenantId);
    const tenantAcademiaId = tenant?.academiaId ?? tenant?.groupId;
    if (tenantAcademiaId) return tenantAcademiaId;
  }

  return input.academias[0]?.id;
}

function resolveTargetTenantIds(input: {
  scope: BiEscopo;
  tenantId?: string;
  academiaId?: string;
  tenants: Tenant[];
  canViewNetwork: boolean;
}): string[] {
  const effectiveScope =
    input.scope === "ACADEMIA" && input.canViewNetwork ? "ACADEMIA" : "UNIDADE";

  if (effectiveScope === "ACADEMIA") {
    const targetAcademiaId = input.academiaId;
    if (!targetAcademiaId) {
      return input.tenantId ? [input.tenantId] : [];
    }

    const tenantIds = input.tenants
      .filter((tenant) => (tenant.academiaId ?? tenant.groupId) === targetAcademiaId)
      .map((tenant) => tenant.id);

    return tenantIds.length > 0 ? tenantIds : input.tenantId ? [input.tenantId] : [];
  }

  return input.tenantId ? [input.tenantId] : [];
}

function canIgnoreReservasCapability(error: unknown): boolean {
  if (error instanceof ApiRequestError) {
    return [404, 405, 501].includes(error.status);
  }

  return (
    error instanceof Error
    && /(reserva|agenda)/i.test(error.message)
    && /contrato backend/i.test(error.message)
  );
}

async function listReservasAulaSafe(tenantId: string) {
  try {
    return await listReservasAulaApi({ tenantId });
  } catch (error) {
    if (canIgnoreReservasCapability(error)) {
      return [];
    }
    throw error;
  }
}

async function loadTenantDataset(tenantId: string): Promise<TenantBiDataset> {
  const [prospects, alunosResponse, matriculas, pagamentosPagos, pagamentosPendentes, pagamentosVencidos, atividadeGrades, reservasAulas] = await Promise.all([
    listProspectsApi({ tenantId }),
    listAlunosApi({ tenantId, page: 0, size: 1000 }),
    listMatriculasApi({ tenantId, status: "ATIVA" }),
    listContasReceberOperacionais({ tenantId, status: "PAGO" }),
    listContasReceberOperacionais({ tenantId, status: "PENDENTE" }),
    listContasReceberOperacionais({ tenantId, status: "VENCIDO" }),
    listAtividadeGradesApi({ tenantId, apenasAtivas: true }),
    listReservasAulaSafe(tenantId),
  ]);

  const pagamentosById = new Map(
    [...pagamentosPagos, ...pagamentosPendentes, ...pagamentosVencidos].map((pagamento) => [pagamento.id, pagamento] as const)
  );

  return {
    prospects,
    alunos: extractAlunosFromListResponse(alunosResponse),
    matriculas,
    pagamentos: Array.from(pagamentosById.values()),
    atividadeGrades,
    reservasAulas,
  };
}

async function loadDatasetsForTenants(
  targetTenantIds: string[],
  restoreTenantId?: string
): Promise<TenantBiDataset[]> {
  if (targetTenantIds.length <= 1) {
    return Promise.all(targetTenantIds.map((tenantId) => loadTenantDataset(tenantId)));
  }

  const datasets: TenantBiDataset[] = [];

  try {
    for (const tenantId of targetTenantIds) {
      await setTenantContextApi(tenantId);
      datasets.push(await loadTenantDataset(tenantId));
    }
  } finally {
    if (restoreTenantId) {
      try {
        await setTenantContextApi(restoreTenantId);
      } catch {
        // Avoid masking a successful snapshot because the context restore failed.
      }
    }
  }

  return datasets;
}

export async function getBiOperacionalSnapshotApi(
  input: GetBiOperacionalSnapshotInput = {}
): Promise<BiOperationalSnapshot> {
  const { start, end } = getBusinessMonthRange();
  const [academiasResponse, tenantsResponse] = await Promise.all([listAcademiasApi(), listUnidadesApi()]);
  const tenants = resolveVisibleTenants(tenantsResponse);
  const tenantId = input.tenantId ?? resolveDefaultTenantId(tenants);
  const scope = input.scope ?? "UNIDADE";
  const academiaId = resolveRequestedAcademiaId({
    academias: academiasResponse,
    tenants,
    scope,
    tenantId,
    academiaId: input.academiaId,
  });

  const targetTenantIds = resolveTargetTenantIds({
    scope,
    tenantId,
    academiaId,
    tenants,
    canViewNetwork: input.canViewNetwork ?? false,
  });

  const datasets = await loadDatasetsForTenants(targetTenantIds, tenantId);

  return buildBiOperationalSnapshot({
    academias: academiasResponse,
    tenants,
    prospects: datasets.flatMap((dataset) => dataset.prospects),
    alunos: datasets.flatMap((dataset) => dataset.alunos),
    matriculas: datasets.flatMap((dataset) => dataset.matriculas),
    pagamentos: datasets.flatMap((dataset) => dataset.pagamentos),
    atividadeGrades: datasets.flatMap((dataset) => dataset.atividadeGrades),
    reservasAulas: datasets.flatMap((dataset) => dataset.reservasAulas),
    scope,
    tenantId,
    academiaId,
    startDate: input.startDate ?? start,
    endDate: input.endDate ?? end,
    segmento: input.segmento ?? FILTER_ALL,
    canViewNetwork: input.canViewNetwork ?? false,
    nowIso: new Date().toISOString(),
  });
}
