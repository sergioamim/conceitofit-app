import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listGlobalSecurityUsers } from "@/backoffice/lib/seguranca";
import type { GlobalAdminReviewStatus, GlobalAdminUserSummary } from "@/lib/types";
import type { GlobalAdminNewUnitsPolicyScope } from "@/lib/types";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

export type Filters = {
  query: string;
  academiaId: string;
  tenantId: string;
  status: string;
  profile: string;
  scopeType: "" | "UNIDADE" | "REDE" | "GLOBAL";
  eligibleOnly: boolean;
  reviewStatus: "" | GlobalAdminReviewStatus;
  broadAccessOnly: boolean;
  exceptionsOnly: boolean;
};

export const PAGE_SIZE = 20;
export const SNAPSHOT_PAGE_SIZE = 100;
export const SNAPSHOT_MAX_PAGES = 10;

export type CreateGlobalUserForm = {
  name: string;
  email: string;
  cpf: string;
  userKind: string;
  scopeType: "UNIDADE" | "REDE" | "GLOBAL";
  academiaId: string;
  tenantIds: string[];
  defaultTenantId: string;
  broadAccess: boolean;
  eligibleForNewUnits: boolean;
  policyScope: GlobalAdminNewUnitsPolicyScope;
};

export const CREATE_USER_DEFAULT: CreateGlobalUserForm = {
  name: "",
  email: "",
  cpf: "",
  userKind: "OPERADOR",
  scopeType: "REDE",
  academiaId: "",
  tenantIds: [],
  defaultTenantId: "",
  broadAccess: false,
  eligibleForNewUnits: false,
  policyScope: "ACADEMIA_ATUAL",
};

export function buildInitialFilters(searchParams: URLSearchParams): Filters {
  const reviewStatusRaw = searchParams.get("reviewStatus")?.trim() ?? "";
  const reviewStatus =
    reviewStatusRaw === "EM_DIA" || reviewStatusRaw === "PENDENTE" || reviewStatusRaw === "VENCIDA"
      ? reviewStatusRaw
      : "";
  const scopeTypeRaw = searchParams.get("scopeType")?.trim() ?? "";
  const scopeType =
    scopeTypeRaw === "UNIDADE" || scopeTypeRaw === "REDE" || scopeTypeRaw === "GLOBAL"
      ? scopeTypeRaw
      : "";

  return {
    query: searchParams.get("query")?.trim() ?? "",
    academiaId: searchParams.get("academiaId")?.trim() ?? "",
    tenantId: searchParams.get("tenantId")?.trim() ?? "",
    status: searchParams.get("status")?.trim() ?? "ATIVO",
    profile: searchParams.get("profile")?.trim() ?? "",
    scopeType,
    eligibleOnly: searchParams.get("eligible") === "1",
    reviewStatus,
    broadAccessOnly: searchParams.get("broadAccess") === "1",
    exceptionsOnly: searchParams.get("exceptions") === "1",
  };
}

export function matchesUserFilters(item: GlobalAdminUserSummary, filters: Filters) {
  if (filters.scopeType && item.scopeType !== filters.scopeType) return false;
  if (filters.reviewStatus && item.reviewStatus !== filters.reviewStatus) return false;
  if (filters.broadAccessOnly && !item.broadAccess) return false;
  if (filters.exceptionsOnly && (item.exceptionsCount ?? 0) <= 0) return false;
  return true;
}

export function getScopeLabel(scopeType?: GlobalAdminUserSummary["scopeType"]) {
  switch (scopeType) {
    case "GLOBAL":
      return "Global";
    case "REDE":
      return "Rede";
    case "UNIDADE":
      return "Unidade";
    default:
      return "Não informado";
  }
}

export async function loadUsersSnapshot(filters: Filters) {
  const items: GlobalAdminUserSummary[] = [];

  for (let currentPage = 0; currentPage < SNAPSHOT_MAX_PAGES; currentPage += 1) {
    const response = await listGlobalSecurityUsers({
      query: filters.query,
      academiaId: filters.academiaId || undefined,
      tenantId: filters.tenantId || undefined,
      status: filters.status === FILTER_ALL ? undefined : filters.status,
      profile: filters.profile || undefined,
      scopeType: filters.scopeType || undefined,
      eligibleForNewUnits: filters.eligibleOnly || undefined,
      page: currentPage,
      size: SNAPSHOT_PAGE_SIZE,
    });
    items.push(...response.items);
    if (!response.hasNext || response.items.length === 0) {
      break;
    }
  }

  return items.filter((item) => matchesUserFilters(item, filters));
}

export { StatCard };

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <p className="text-3xl font-display font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </CardContent>
    </Card>
  );
}
