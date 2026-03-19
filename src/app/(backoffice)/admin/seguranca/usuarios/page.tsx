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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TableCell } from "@/components/ui/table";
import { PaginatedTable } from "@/components/shared/paginated-table";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import { listGlobalSecurityUsers } from "@/lib/backoffice/seguranca";
import type { Academia, GlobalAdminUserSummary, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

type Filters = {
  query: string;
  academiaId: string;
  tenantId: string;
  status: string;
  profile: string;
  eligibleOnly: boolean;
};

const PAGE_SIZE = 20;

function buildInitialFilters(searchParams: URLSearchParams): Filters {
  return {
    query: searchParams.get("query")?.trim() ?? "",
    academiaId: searchParams.get("academiaId")?.trim() ?? "",
    tenantId: searchParams.get("tenantId")?.trim() ?? "",
    status: searchParams.get("status")?.trim() ?? "ATIVO",
    profile: searchParams.get("profile")?.trim() ?? "",
    eligibleOnly: searchParams.get("eligible") === "1",
  };
}

export default function AdminSegurancaUsuariosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [academias, setAcademias] = useState<Academia[]>([]);
  const [unidades, setUnidades] = useState<Tenant[]>([]);
  const [filters, setFilters] = useState<Filters>(() => buildInitialFilters(searchParams));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() => buildInitialFilters(searchParams));
  const [page, setPage] = useState(0);
  const [result, setResult] = useState({
    items: [] as GlobalAdminUserSummary[],
    total: 0,
    hasNext: false,
  });
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unidadesFiltradas = useMemo(() => {
    if (!filters.academiaId) return unidades;
    return unidades.filter((item) => (item.academiaId ?? item.groupId) === filters.academiaId);
  }, [filters.academiaId, unidades]);

  const summary = useMemo(() => {
    const pageItems = result.items;
    return {
      broadAccess: pageItems.filter((item) => item.broadAccess).length,
      pendingReview: pageItems.filter((item) => item.reviewStatus === "PENDENTE" || item.reviewStatus === "VENCIDA").length,
      compatibility: pageItems.filter((item) => item.compatibilityMode).length,
      exceptions: pageItems.reduce((total, item) => total + (item.exceptionsCount ?? 0), 0),
    };
  }, [result.items]);

  useEffect(() => {
    setFilters(buildInitialFilters(searchParams));
    setAppliedFilters(buildInitialFilters(searchParams));
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
        const response = await listGlobalSecurityUsers({
          query: appliedFilters.query,
          academiaId: appliedFilters.academiaId || undefined,
          tenantId: appliedFilters.tenantId || undefined,
          status: appliedFilters.status === "TODOS" ? undefined : appliedFilters.status,
          profile: appliedFilters.profile || undefined,
          eligibleForNewUnits: appliedFilters.eligibleOnly || undefined,
          page,
          size: PAGE_SIZE,
        });
        if (!mounted) return;
        setResult({
          items: response.items,
          total: response.total ?? response.items.length,
          hasNext: response.hasNext,
        });
      } catch (loadError) {
        if (!mounted) return;
        setError(normalizeErrorMessage(loadError));
        setResult({ items: [], total: 0, hasNext: false });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadUsers();
    return () => {
      mounted = false;
    };
  }, [appliedFilters, page]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (filters.query.trim()) params.set("query", filters.query.trim());
    if (filters.academiaId) params.set("academiaId", filters.academiaId);
    if (filters.tenantId) params.set("tenantId", filters.tenantId);
    if (filters.status && filters.status !== "ATIVO") params.set("status", filters.status);
    if (filters.profile.trim()) params.set("profile", filters.profile.trim());
    if (filters.eligibleOnly) params.set("eligible", "1");
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
      eligibleOnly: false,
    } satisfies Filters;
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
    router.replace("/admin/seguranca/usuarios");
  }

  return (
    <GlobalSecurityShell
      title="Usuários e acessos"
      description="Procure uma pessoa, entenda onde ela opera, quais papéis estão ativos e quais sinais de risco exigem ação."
      actions={
        <Button asChild variant="outline" className="border-border">
          <Link href="/admin/seguranca/revisoes">Abrir fila de revisões</Link>
        </Button>
      }
    >
      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Resultados" value={loading ? "…" : String(result.total)} subtitle="Pessoas encontradas para o recorte atual" />
        <StatCard title="Acessos amplos" value={loading ? "…" : String(summary.broadAccess)} subtitle="Pessoas com alcance acima do padrão" />
        <StatCard title="Revisões acionáveis" value={loading ? "…" : String(summary.pendingReview)} subtitle="Pendentes ou vencidas no recorte" />
        <StatCard title="Exceções visíveis" value={loading ? "…" : String(summary.exceptions)} subtitle="Somatório do que precisa governança" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de operação</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <div className="space-y-2 xl:col-span-2">
            <Label htmlFor="security-user-query">Pessoa ou e-mail</Label>
            <Input
              id="security-user-query"
              placeholder="Buscar pessoa"
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
            <Select value={filters.status || "ATIVO"} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
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

          <div className="flex gap-2 md:col-span-3 xl:col-span-6">
            <Button onClick={applyFilters} disabled={loading || loadingCatalog}>
              Aplicar filtros
            </Button>
            <Button variant="outline" className="border-border" onClick={clearFilters}>
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      <SecuritySectionFeedback loading={loadingCatalog || loading} error={error} />

      <PaginatedTable
        columns={[
          { label: "Pessoa" },
          { label: "Cobertura operacional" },
          { label: "Papéis em uso" },
          { label: "Governança" },
          { label: "Estado" },
          { label: "Ações", className: "text-right" },
        ]}
        items={result.items}
        emptyText="Nenhuma pessoa administrativa encontrada para os filtros atuais."
        getRowKey={(item) => item.id}
        itemLabel="pessoas"
        page={page}
        pageSize={PAGE_SIZE}
        total={result.total}
        hasNext={result.hasNext}
        onPrevious={() => setPage((current) => Math.max(0, current - 1))}
        onNext={() => setPage((current) => current + 1)}
        renderCells={(item) => (
          <>
            <TableCell className="px-4 py-3">
              <div className="space-y-1">
                <p className="font-medium">{item.fullName || item.name}</p>
                <p className="text-xs text-muted-foreground">{item.email}</p>
              </div>
            </TableCell>
            <TableCell className="px-4 py-3 text-sm text-muted-foreground">
              <p>{item.membershipsAtivos} acessos ativos</p>
              <p className="text-xs">{item.academias.map((academia) => academia.nome).join(", ") || "Sem academia vinculada"}</p>
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
