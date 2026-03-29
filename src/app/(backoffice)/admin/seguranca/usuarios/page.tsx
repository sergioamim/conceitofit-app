"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Card, CardContent } from "@/components/ui/card";
import { TableCell } from "@/components/ui/table";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import { createGlobalSecurityUser } from "@/lib/backoffice/seguranca";
import { globalUserCreateFormSchema } from "@/lib/tenant/forms/security-user-create-schemas";
import { validateGlobalUserCreateDraft } from "@/lib/tenant/security-user-create";
import type { Academia, GlobalAdminUserSummary, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { UsuariosCreateForm } from "./usuarios-create-form";
import { UsuariosFilters } from "./usuarios-filters";
import {
  type Filters,
  type CreateGlobalUserForm,
  PAGE_SIZE,
  CREATE_USER_DEFAULT,
  StatCard,
  buildInitialFilters,
  getScopeLabel,
  loadUsersSnapshot,
} from "./usuarios-types";

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
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const createUserForm = useForm<CreateGlobalUserForm>({
    resolver: zodResolver(globalUserCreateFormSchema),
    defaultValues: CREATE_USER_DEFAULT,
  });
  const createForm = (useWatch({ control: createUserForm.control }) ?? CREATE_USER_DEFAULT) as CreateGlobalUserForm;

  const unidadesFiltradas = useMemo(() => {
    if (!filters.academiaId) return unidades;
    return unidades.filter((item) => (item.academiaId ?? item.groupId) === filters.academiaId);
  }, [filters.academiaId, unidades]);

  const createAcademiaUnits = useMemo(() => {
    if (!createForm.academiaId) return [];
    return unidades.filter((item) => (item.academiaId ?? item.groupId) === createForm.academiaId);
  }, [createForm.academiaId, unidades]);

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

  function toggleCreateTenant(tenantId: string) {
    const current = createForm.tenantIds ?? [];
    const tenantIds = current.includes(tenantId)
      ? current.filter((item) => item !== tenantId)
      : [...current, tenantId];
    createUserForm.setValue("tenantIds", tenantIds, { shouldDirty: true });
    createUserForm.setValue(
      "defaultTenantId",
      (createForm.defaultTenantId && tenantIds.includes(createForm.defaultTenantId)) ? createForm.defaultTenantId : tenantIds[0] ?? "",
      { shouldDirty: true }
    );
  }

  async function handleCreateUser(values: CreateGlobalUserForm) {
    setCreateFeedback(null);
    setCreateError(null);
    setCreatingUser(true);

    try {
      const payload = validateGlobalUserCreateDraft(values);
      await createGlobalSecurityUser(payload);
      const responseItems = await loadUsersSnapshot(appliedFilters);
      setAllItems(responseItems);
      setShowCreateForm(false);
      createUserForm.reset(CREATE_USER_DEFAULT);
      setCreateFeedback("Usuário criado na segurança global.");
    } catch (submitError) {
      setCreateError(normalizeErrorMessage(submitError));
    } finally {
      setCreatingUser(false);
    }
  }

  return (
    <GlobalSecurityShell
      title="Usuários e acessos"
      description="Procure uma pessoa por rede, identificador e escopo. A leitura separa identidade, unidade-base, unidade ativa e vínculos operacionais."
      actions={
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setShowCreateForm((current) => !current)}>
            {showCreateForm ? "Fechar criação" : "Novo usuário"}
          </Button>
          <Button asChild variant="outline" className="border-border">
            <Link href="/admin/seguranca/revisoes">Abrir fila de revisões</Link>
          </Button>
        </div>
      }
    >
      {showCreateForm ? (
        <UsuariosCreateForm
          createUserForm={createUserForm}
          academias={academias}
          unidades={unidades}
          createAcademiaUnits={createAcademiaUnits}
          creatingUser={creatingUser}
          createFeedback={createFeedback}
          createError={createError}
          onSubmit={handleCreateUser}
          toggleCreateTenant={toggleCreateTenant}
          loadingCatalog={loadingCatalog}
          createForm={createForm}
          onResetForm={() => {
            createUserForm.reset(CREATE_USER_DEFAULT);
            setCreateError(null);
            setCreateFeedback(null);
          }}
        />
      ) : null}

      {createFeedback && !showCreateForm ? (
        <Card>
          <CardContent className="px-6 py-4 text-sm text-gym-teal">{createFeedback}</CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <StatCard title="Resultados" value={loading ? "…" : String(allItems.length)} subtitle="Pessoas no recorte atual" />
        <StatCard title="Acessos amplos" value={loading ? "…" : String(summary.broadAccess)} subtitle="Pessoas acima do padrão esperado" />
        <StatCard title="Revisões acionáveis" value={loading ? "…" : String(summary.pendingReview)} subtitle="Pendentes ou vencidas" />
        <StatCard title="Exceções visíveis" value={loading ? "…" : String(summary.exceptions)} subtitle="Somatório de exceções no recorte" />
      </div>

      <UsuariosFilters
        filters={filters}
        setFilters={setFilters}
        academias={academias}
        unidadesFiltradas={unidadesFiltradas}
        contextualNetworkNames={contextualNetworkNames}
        onApply={applyFilters}
        onClear={clearFilters}
        loading={loading || loadingCatalog}
      />

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
