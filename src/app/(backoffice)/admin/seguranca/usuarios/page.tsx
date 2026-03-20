"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GlobalSecurityShell } from "@/components/security/global-security-shell";
import {
  SecurityActiveBadge,
  SecurityBroadAccessBadge,
  SecurityCompatibilityBadge,
  SecurityEligibilityBadge,
  SecurityReviewBadge,
  SecurityRiskBadge,
} from "@/components/security/security-badges";
import { SecuritySectionFeedback } from "@/components/security/security-feedback";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import { listGlobalSecurityUsers } from "@/lib/backoffice/seguranca";
import type { Academia, GlobalAdminReviewStatus, GlobalAdminUserSummary, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type Filters = {
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

const PAGE_SIZE = 20;
const SNAPSHOT_PAGE_SIZE = 100;
const SNAPSHOT_MAX_PAGES = 10;

function buildInitialFilters(searchParams: URLSearchParams): Filters {
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

function matchesUserFilters(item: GlobalAdminUserSummary, filters: Filters) {
  if (filters.scopeType && item.scopeType !== filters.scopeType) return false;
  if (filters.reviewStatus && item.reviewStatus !== filters.reviewStatus) return false;
  if (filters.broadAccessOnly && !item.broadAccess) return false;
  if (filters.exceptionsOnly && (item.exceptionsCount ?? 0) <= 0) return false;
  return true;
}

function getScopeLabel(scopeType?: GlobalAdminUserSummary["scopeType"]) {
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

async function loadUsersSnapshot(filters: Filters) {
  const items: GlobalAdminUserSummary[] = [];

  for (let currentPage = 0; currentPage < SNAPSHOT_MAX_PAGES; currentPage += 1) {
    const response = await listGlobalSecurityUsers({
      query: filters.query,
      academiaId: filters.academiaId || undefined,
      tenantId: filters.tenantId || undefined,
      status: filters.status === "TODOS" ? undefined : filters.status,
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

export default function AdminSegurancaUsuariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [filters, setFilters] = useState<Filters>(() => buildInitialFilters(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => buildInitialFilters(searchParams));
  const [page, setPage] = useState(0);
  const [allItems, setAllItems] = useState<GlobalAdminUserSummary[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unidadesFiltradas = useMemo(() => {
    if (!filters.academiaId) return unidades;
    return unidades.filter((item) => (item.academiaId ?? item.groupId) === filters.academiaId);
  }, [filters.academiaId, unidades]);

  const pagedItems = useMemo(() => {
    const start = page * PAGE_SIZE;
    return allItems.slice(start, start + PAGE_SIZE);
  }, [allItems, page]);

  const hasNext = useMemo(() => (page + 1) * PAGE_SIZE < allItems.length, [allItems.length, page]);

  const summary = useMemo(() => {
    return {
      broadAccess: allItems.filter((item) => item.broadAccess).length,
      pendingReview: allItems.filter((item) => item.reviewStatus === "PENDENTE" || item.reviewStatus === "VENCIDA")
        .length,
      compatibility: allItems.filter((item) => item.compatibilityMode).length,
      exceptions: allItems.reduce((total, item) => total + (item.exceptionsCount ?? 0), 0),
    };
  }, [allItems]);

  const contextualNetworkNames = useMemo(() => {
    return [...new Set(allItems.map((item) => item.networkName).filter((value): value is string => Boolean(value)))];
  }, [allItems]);

  useEffect(() => {
    const next = buildInitialFilters(searchParams);
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
  }, [searchParams]);

  useEffect(() => {
    let mounted = true;

    async function loadCatalog() {
      setLoadingCatalog(true);
      try {
        const [academiasResponse, unidadesResponse] = await Promise.all([
          listGlobalAcademias(),
          listGlobalUnidades(),
        ]);
        if (!mounted) return;
        setAcademias(academiasResponse);
        setUnidades(unidadesResponse);
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
      } finally {
        if (mounted) setLoadingCatalog(false);
      }
    }

    void loadCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setLoading(true);
      try {
        setError(null);
        const responseItems = await loadUsersSnapshot(appliedFilters);
        if (!mounted) return;
        setAllItems(responseItems);
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
        setAllItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      mounted = false;
    };
  }, [appliedFilters]);

  useEffect(() => {
    if (page > 0 && page * PAGE_SIZE >= allItems.length) {
      setPage(0);
    }
  }, [allItems.length, page]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("query", filters.query.trim());
    if (filters.academiaId) params.set("academiaId", filters.academiaId);
    if (filters.tenantId) params.set("tenantId", filters.tenantId);
    if (filters.status && filters.status !== "ATIVO") params.set("status", filters.status);
    if (filters.profile.trim()) params.set("profile", filters.profile.trim());
    if (filters.scopeType) params.set("scopeType", filters.scopeType);
    if (filters.eligibleOnly) params.set("eligible", "1");
    if (filters.reviewStatus) params.set("reviewStatus", filters.reviewStatus);
    if (filters.broadAccessOnly) params.set("broadAccess", "1");
    if (filters.exceptionsOnly) params.set("exceptions", "1");
    setAppliedFilters(filters);
    setPage(0);
    router.replace(`/admin/seguranca/usuarios${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clearFilters() {
    const next = {
      query: "",
      academiaId: "",
      tenantId: "",
      status: "ATIVO",
      profile: "",
      scopeType: "",
      eligibleOnly: false,
      reviewStatus: "",
      broadAccessOnly: false,
      exceptionsOnly: false,
    } satisfies Filters;
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
    router.replace("/admin/seguranca/usuarios");
  }

  return (
    <GlobalSecurityShell
      title="Usuários e acessos"
      description="Procure uma pessoa por rede, identificador e escopo. A leitura separa identidade, unidade-base, unidade ativa e vínculos operacionais."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/admin/seguranca/revisoes">Abrir fila de revisões</Link>
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Resultados" value={loading ? "…" : String(allItems.length)} subtitle="Pessoas no recorte atual" />
        <StatCard title="Acessos amplos" value={loading ? "…" : String(summary.broadAccess)} subtitle="Pessoas acima do padrão esperado" />
        <StatCard title="Revisões acionáveis" value={loading ? "…" : String(summary.pendingReview)} subtitle="Pendentes ou vencidas" />
        <StatCard title="Exceções visíveis" value={loading ? "…" : String(summary.exceptions)} subtitle="Somatório de exceções no recorte" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de operação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-9">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="security-user-query">Pessoa, e-mail ou CPF</Label>
            <Input
              id="security-user-query"
              placeholder="Buscar por nome, e-mail ou CPF"
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Academia</Label>
            <Select
              value={filters.academiaId || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  academiaId: value === "__all__" ? "" : value,
                  tenantId: value === "__all__" ? current.tenantId : "",
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {academias.map((academia) => (
                  <SelectItem key={academia.id} value={academia.id}>
                    {academia.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Unidade</Label>
            <Select
              value={filters.tenantId || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({ ...current, tenantId: value === "__all__" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                {unidadesFiltradas.map((tenant) => (
                  <SelectItem key={tenant.id} value={tenant.id}>
                    {tenant.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || "ATIVO"}
              onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATIVO">Ativos</SelectItem>
                <SelectItem value="INATIVO">Inativos</SelectItem>
                <SelectItem value="PENDENTE">Pendentes</SelectItem>
                <SelectItem value="TODOS">Todos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="security-user-profile">Papel em uso</Label>
            <Input
              id="security-user-profile"
              placeholder="Administrador"
              value={filters.profile}
              onChange={(event) => setFilters((current) => ({ ...current, profile: event.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Escopo</Label>
            <Select
              value={filters.scopeType || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  scopeType: value === "__all__" ? "" : (value as Filters["scopeType"]),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                <SelectItem value="UNIDADE">Unidade</SelectItem>
                <SelectItem value="REDE">Rede</SelectItem>
                <SelectItem value="GLOBAL">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Novas unidades</Label>
            <Select
              value={filters.eligibleOnly ? "SIM" : "TODOS"}
              onValueChange={(value) => setFilters((current) => ({ ...current, eligibleOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="SIM">Só com propagação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Revisão</Label>
            <Select
              value={filters.reviewStatus || "__all__"}
              onValueChange={(value) =>
                setFilters((current) => ({
                  ...current,
                  reviewStatus: value === "__all__" ? "" : (value as GlobalAdminReviewStatus),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas</SelectItem>
                <SelectItem value="EM_DIA">Em dia</SelectItem>
                <SelectItem value="PENDENTE">Pendente</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Acesso amplo</Label>
            <Select
              value={filters.broadAccessOnly ? "SIM" : "TODOS"}
              onValueChange={(value) => setFilters((current) => ({ ...current, broadAccessOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="SIM">Só amplos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Exceções</Label>
            <Select
              value={filters.exceptionsOnly ? "SIM" : "TODOS"}
              onValueChange={(value) => setFilters((current) => ({ ...current, exceptionsOnly: value === "SIM" }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="SIM">Só com exceção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 md:col-span-3 xl:col-span-8">
            <Button onClick={applyFilters} disabled={loading || loadingCatalog}>
              Aplicar filtros
            </Button>
            <Button variant="outline" className="border-border" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {contextualNetworkNames.length > 0 ? (
        <Card>
          <CardContent className="flex flex-wrap items-center gap-2 px-6 py-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Redes no recorte:</span>
            <span>{contextualNetworkNames.join(" · ")}</span>
          </CardContent>
        </Card>
      ) : null}

      <SecuritySectionFeedback loading={loadingCatalog || loading} error={error} />

      <PaginatedTable
        columns={[
          { label: "Pessoa e login" },
          { label: "Rede e escopo" },
          { label: "Vínculos operacionais" },
          { label: "Papéis em uso" },
          { label: "Governança" },
          { label: "Estado" },
          { label: "Ações", className: "text-right" },
        ]}
        items={pagedItems}
        emptyText={
          appliedFilters.scopeType
            ? `Nenhuma pessoa administrativa encontrada para o escopo ${getScopeLabel(appliedFilters.scopeType).toLowerCase()}.`
            : "Nenhuma pessoa administrativa encontrada para os filtros atuais."
        }
        getRowKey={(item) => item.id}
        itemLabel="pessoas"
        page={page}
        pageSize={PAGE_SIZE}
        total={allItems.length}
        hasNext={hasNext}
        onPrevious={() => setPage((current) => Math.max(0, current - 1))}
        onNext={() => setPage((current) => current + 1)}
        renderCells={(item) => (
          <>
            <TableCell className="px-4 py-3">
              <div className="space-y-1">
                <p className="font-medium">{item.fullName || item.name}</p>
                <p className="text-xs text-muted-foreground">{item.email}</p>
                {item.loginIdentifiers?.length ? (
                  <p className="text-xs text-muted-foreground">
                    {item.loginIdentifiers.map((identifier) => `${identifier.label}: ${identifier.value}`).join(" · ")}
                  </p>
                ) : null}
              </div>
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">{item.networkName || "Rede não informada"}</p>
              <p className="text-xs">Escopo efetivo: {getScopeLabel(item.scopeType)}</p>
              {item.domainLinksSummary?.length ? (
                <p className="text-xs">{item.domainLinksSummary.join(" · ")}</p>
              ) : (
                <p className="text-xs">{item.userKind ? `Tipo: ${item.userKind}` : "Sem agregações gerenciais informadas"}</p>
              )}
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
              <p>{item.membershipsAtivos} acessos ativos</p>
              <p className="text-xs">{item.academias.map((academia) => academia.nome).join(", ") || "Sem academia vinculada"}</p>
              <p className="text-xs">
                Base: {item.defaultTenantName || "não definida"}
                {item.activeTenantName && item.activeTenantName !== item.defaultTenantName
                  ? ` · Ativa: ${item.activeTenantName}`
                  : ""}
              </p>
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {item.perfis.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Sem papel atribuído</span>
                ) : (
                  item.perfis.slice(0, 3).map((perfil) => (
                    <span key={`${item.id}-${perfil}`} className="rounded-full bg-secondary px-2 py-1 text-[11px]">
                      {perfil}
                    </span>
                  ))
                )}
              </div>
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="flex flex-wrap gap-2">
                <SecurityRiskBadge level={item.riskLevel} />
                <SecurityReviewBadge status={item.reviewStatus} />
                <SecurityEligibilityBadge eligible={item.eligibleForNewUnits} />
                <SecurityBroadAccessBadge broadAccess={item.broadAccess} />
                <SecurityCompatibilityBadge compatibilityMode={item.compatibilityMode} />
              </div>
              {(item.exceptionsCount ?? 0) > 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">{item.exceptionsCount} exceção(ões) visíveis</p>
              ) : null}
            </TableCell>
            <TableCell className="px-4 py-3">
              <div className="space-y-1 text-sm">
                <SecurityActiveBadge active={item.active} activeLabel={item.status} inactiveLabel={item.status} />
                <p className="text-xs text-muted-foreground">
                  {item.defaultTenantName ? `Base: ${item.defaultTenantName}` : "Sem unidade base"}
                </p>
              </div>
            </TableCell>
            <TableCell className="px-4 py-3 text-right">
              <Button asChild size="sm" variant="outline" className="border-border">
                <Link href={`/admin/seguranca/usuarios/${item.id}`}>Abrir governança</Link>
              </Button>
            </TableCell>
          </>
        )}
      />
    </GlobalSecurityShell>
  );
}

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
