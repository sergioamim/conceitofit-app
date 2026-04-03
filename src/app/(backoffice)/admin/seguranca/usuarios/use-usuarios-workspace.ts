"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Power, Shield } from "lucide-react";
import { listGlobalAcademias, listGlobalUnidades } from "@/lib/backoffice/admin";
import { createGlobalSecurityUser } from "@/lib/backoffice/seguranca";
import type { BulkAction } from "@/components/shared/bulk-action-bar";
import { globalUserCreateFormSchema } from "@/lib/tenant/forms/security-user-create-schemas";
import { validateGlobalUserCreateDraft } from "@/lib/tenant/security-user-create";
import type { Academia, GlobalAdminUserSummary, Tenant } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  type Filters,
  type CreateGlobalUserForm,
  PAGE_SIZE,
  CREATE_USER_DEFAULT,
  buildInitialFilters,
  loadUsersSnapshot,
} from "./usuarios-types";

export function useUsuariosWorkspace() {
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  const summary = useMemo(() => ({
    broadAccess: allItems.filter((item) => item.broadAccess).length,
    pendingReview: allItems.filter((item) => item.reviewStatus === "PENDENTE" || item.reviewStatus === "VENCIDA").length,
    compatibility: allItems.filter((item) => item.compatibilityMode).length,
    exceptions: allItems.reduce((total, item) => total + (item.exceptionsCount ?? 0), 0),
  }), [allItems]);

  const contextualNetworkNames = useMemo(() => {
    return [...new Set(allItems.map((item) => item.networkName).filter((value): value is string => Boolean(value)))];
  }, [allItems]);

  const handleBulkDeactivate = useCallback(
    (ids: string[]) => {
      // TODO: integrar com endpoint de desativacao em lote
      // eslint-disable-next-line no-console
      console.log("[bulk] Desativar usuários:", ids);
      setSelectedIds([]);
    },
    [],
  );

  const handleBulkChangeProfile = useCallback(
    (ids: string[]) => {
      // TODO: integrar com endpoint de alteracao de perfil em lote
      // eslint-disable-next-line no-console
      console.log("[bulk] Alterar perfil dos usuários:", ids);
      setSelectedIds([]);
    },
    [],
  );

  const bulkActions: BulkAction[] = useMemo(
    () => [
      {
        label: "Desativar selecionados",
        icon: Power,
        variant: "destructive" as const,
        onClick: handleBulkDeactivate,
      },
      {
        label: "Alterar perfil",
        icon: Shield,
        variant: "secondary" as const,
        onClick: handleBulkChangeProfile,
      },
    ],
    [handleBulkDeactivate, handleBulkChangeProfile],
  );

  useEffect(() => {
    const next = buildInitialFilters(searchParams);
    setFilters(next);
    setAppliedFilters(next);
    setPage(0);
    setSelectedIds([]);
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
    return () => { mounted = false; };
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
    return () => { mounted = false; };
  }, [appliedFilters]);

  useEffect(() => {
    if (page > 0 && page * PAGE_SIZE >= allItems.length) {
      setPage(0);
    }
  }, [allItems.length, page]);

  function applyFilters() {
    setSelectedIds([]);
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
    setSelectedIds([]);
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

  function resetCreateForm() {
    createUserForm.reset(CREATE_USER_DEFAULT);
    setCreateError(null);
    setCreateFeedback(null);
  }

  return {
    academias,
    unidades,
    filters,
    setFilters,
    appliedFilters,
    page,
    setPage,
    allItems,
    pagedItems,
    hasNext,
    summary,
    contextualNetworkNames,
    unidadesFiltradas,
    createAcademiaUnits,
    loadingCatalog,
    loading,
    error,
    selectedIds,
    setSelectedIds,
    bulkActions,
    showCreateForm,
    setShowCreateForm,
    creatingUser,
    createFeedback,
    createError,
    createUserForm,
    createForm,
    applyFilters,
    clearFilters,
    toggleCreateTenant,
    handleCreateUser,
    resetCreateForm,
  };
}
