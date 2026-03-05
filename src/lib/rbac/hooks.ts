import { useCallback, useEffect, useMemo, useState } from "react";
import { getCurrentTenant } from "@/lib/mock/services";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import {
  createPerfilService,
  listAuditoriaService,
  listFeaturesService,
  listGrantsService,
  listPerfisService,
  listUserPerfisService,
  listUsersService,
  linkPerfilUsuarioService,
  removePerfilService,
  saveGrantService,
  unlinkPerfilUsuarioService,
  updateFeatureService,
  updatePerfilService,
} from "./services";
import type {
  RbacAuditoriaItem,
  RbacFeature,
  RbacPerfil,
  RbacPerfilCreatePayload,
  RbacPerfilUpdatePayload,
  RbacPermission,
  RbacUser,
} from "@/lib/types";

export function useRbacTenant() {
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("Tenant ativo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tenant = await getCurrentTenant();
      setTenantId(tenant.id);
      setTenantName(tenant.nome);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    tenantId,
    tenantName,
    loading,
    error,
    refreshTenant: load,
  };
}

export function usePerfisManager(tenantId: string) {
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [hasNext, setHasNext] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback(async (nextPage = page, nextSize = pageSize) => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await listPerfisService({
        tenantId,
        includeInactive: true,
        page: nextPage,
        size: nextSize,
      });
      setPerfis(response.items);
      setPage(response.page);
      setPageSize(response.size || nextSize);
      setHasNext(response.hasNext);
      setTotal(response.total ?? response.items.length);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId, page, pageSize]);

  const goToPreviousPage = useCallback(() => {
    if (page <= 0 || loading || actionLoading) return;
    void load(page - 1, pageSize);
  }, [actionLoading, load, loading, page, pageSize]);

  const goToNextPage = useCallback(() => {
    if (!hasNext || loading || actionLoading) return;
    void load(page + 1, pageSize);
  }, [actionLoading, hasNext, load, loading, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePerfil = useCallback(
    async (input: {
      id?: string;
      data: RbacPerfilCreatePayload | RbacPerfilUpdatePayload;
    }) => {
      if (!tenantId) return;
      setActionLoading(true);
      setError(null);
      try {
        if (input.id) {
          await updatePerfilService({
            tenantId,
            perfilId: input.id,
            data: input.data,
          });
        } else {
          await createPerfilService({
            tenantId,
            data: input.data as RbacPerfilCreatePayload,
          });
        }
        await load();
      } catch (saveError) {
        throw new Error(normalizeErrorMessage(saveError));
      } finally {
        setActionLoading(false);
      }
    },
    [load, tenantId]
  );

  const deactivatePerfil = useCallback(
    async (perfil: RbacPerfil) => {
      if (!tenantId) return;
      setActionLoading(true);
      setError(null);
      try {
        await updatePerfilService({
          tenantId,
          perfilId: perfil.id,
          data: {
            active: false,
            displayName: perfil.displayName,
            roleName: perfil.roleName,
            description: perfil.description,
          },
        });
        await load();
      } catch (deactivateError) {
        setError(normalizeErrorMessage(deactivateError));
      } finally {
        setActionLoading(false);
      }
    },
    [load, tenantId]
  );

  const removePerfil = useCallback(
    async (perfilId: string) => {
      if (!tenantId) return;
      setActionLoading(true);
      setError(null);
      try {
        await removePerfilService({ tenantId, perfilId });
        await load();
      } catch (deleteError) {
        setError(normalizeErrorMessage(deleteError));
      } finally {
        setActionLoading(false);
      }
    },
    [load, tenantId]
  );

  const activePerfis = useMemo(() => perfis.filter((item) => item.active), [perfis]);

  return {
    perfis,
    activePerfis,
    loading,
    actionLoading,
    page,
    pageSize,
    hasNext,
    total,
    error,
    goToPreviousPage,
    goToNextPage,
    reload: load,
    savePerfil,
    deactivatePerfil,
    removePerfil,
  };
}

export function useUserPerfilManager(tenantId: string) {
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [userPerfis, setUserPerfis] = useState<RbacPerfil[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingPerfis, setLoadingPerfis] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    if (!tenantId) return;
    setLoadingUsers(true);
    setError(null);
    try {
      const loaded = await listUsersService({ tenantId });
      setUsers(loaded);
      setSelectedUserId((current) => current || loaded[0]?.id || "");
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoadingUsers(false);
    }
  }, [tenantId]);

  const loadPerfisUsuario = useCallback(async (userId: string) => {
    if (!tenantId || !userId) {
      setUserPerfis([]);
      return;
    }
    setLoadingPerfis(true);
    setError(null);
    try {
      const loaded = await listUserPerfisService({
        tenantId,
        userId,
      });
      setUserPerfis(loaded);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoadingPerfis(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadPerfisUsuario(selectedUserId);
  }, [loadPerfisUsuario, selectedUserId]);

  const assignPerfil = useCallback(
    async (perfilId: string) => {
      if (!tenantId || !selectedUserId) return;
      setSaving(true);
      setError(null);
      try {
        await linkPerfilUsuarioService({
          tenantId,
          userId: selectedUserId,
          perfilId,
        });
        await loadPerfisUsuario(selectedUserId);
      } catch (assignError) {
        setError(normalizeErrorMessage(assignError));
      } finally {
        setSaving(false);
      }
    },
    [loadPerfisUsuario, selectedUserId, tenantId]
  );

  const removePerfil = useCallback(
    async (perfilId: string) => {
      if (!tenantId || !selectedUserId) return;
      setSaving(true);
      setError(null);
      try {
        await unlinkPerfilUsuarioService({
          tenantId,
          userId: selectedUserId,
          perfilId,
        });
        await loadPerfisUsuario(selectedUserId);
      } catch (removeError) {
        setError(normalizeErrorMessage(removeError));
      } finally {
        setSaving(false);
      }
    },
    [loadPerfisUsuario, selectedUserId, tenantId]
  );

  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null;

  return {
    users,
    selectedUser,
    selectedUserId,
    setSelectedUserId,
    userPerfis,
    loadingUsers,
    loadingPerfis,
    saving,
    error,
    reload: loadUsers,
    assignPerfil,
    removePerfil,
  };
}

export function useGrantManager(tenantId: string) {
  const [features, setFeatures] = useState<RbacFeature[]>([]);
  const [grants, setGrants] = useState<import("@/lib/types").RbacGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [featuresResult, grantsResult] = await Promise.all([
        listFeaturesService({ tenantId }),
        listGrantsService({ tenantId }),
      ]);
      setFeatures(featuresResult);
      setGrants(grantsResult);
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveFeature = useCallback(
    async (featureKey: string, data: { enabled: boolean; rollout: number }) => {
      if (!tenantId) return;
      setActionLoading(true);
      setError(null);
      try {
        await updateFeatureService({
          tenantId,
          featureKey,
          ...data,
        });
        await reload();
      } catch (featureError) {
        setError(normalizeErrorMessage(featureError));
      } finally {
        setActionLoading(false);
      }
    },
    [reload, tenantId]
  );

  const saveGrant = useCallback(
    async (input: {
      roleName: string;
      featureKey: string;
      permission: RbacPermission;
      allowed: boolean;
    }) => {
      if (!tenantId) return;
      setActionLoading(true);
      setError(null);
      try {
        await saveGrantService({
          tenantId,
          perfilRoleName: input.roleName,
          featureKey: input.featureKey,
          permission: input.permission,
          allowed: input.allowed,
        });
        await reload();
      } catch (grantError) {
        setError(normalizeErrorMessage(grantError));
      } finally {
        setActionLoading(false);
      }
    },
    [reload, tenantId]
  );

  const grantsByProfile = useMemo(() => {
    const map = new Map<string, typeof grants>();
    for (const grant of grants) {
      const key = `${grant.roleName}::${grant.featureKey}::${grant.permission}`;
      map.set(key, [...(map.get(key) ?? []), grant]);
    }
    return map;
  }, [grants]);

  return {
    features,
    grants,
    loading,
    actionLoading,
    error,
    reload,
    saveFeature,
    saveGrant,
  };
}

export function useAuditoriaManager(tenantId: string) {
  const [items, setItems] = useState<RbacAuditoriaItem[]>([]);
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const loaded = await listAuditoriaService({
        tenantId,
        action: action || undefined,
        resourceType: resourceType || undefined,
        limit,
      });
      const sorted = [...loaded].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setItems(sorted);
    } catch (loadError) {
      setItems([]);
      const message = normalizeErrorMessage(loadError);
      const hint = message.includes("500")
        ? "Auditoria indisponível no momento (erro 500). Verifique permissões ADMIN ou logs do backend."
        : message;
      setError(hint);
    } finally {
      setLoading(false);
    }
  }, [action, limit, resourceType, tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    items,
    action,
    resourceType,
    limit,
    loading,
    error,
    setAction,
    setResourceType,
    setLimit,
    refresh: load,
  };
}
