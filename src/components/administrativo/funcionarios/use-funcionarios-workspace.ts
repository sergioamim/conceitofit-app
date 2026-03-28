"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listCargosApi, listFuncionariosApi } from "@/lib/api/administrativo";
import { listPerfisApi } from "@/lib/api/rbac";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import type { Cargo, Funcionario, RbacPerfil } from "@/lib/types";
import { FALLBACK_PERFIS } from "./shared";

export function useFuncionariosWorkspace() {
  const tenantContext = useTenantContext();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [perfis, setPerfis] = useState<RbacPerfil[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tenantOptions = useMemo(
    () => tenantContext.availableTenants.filter((tenant) => tenant.ativo !== false),
    [tenantContext.availableTenants]
  );

  const loadWorkspace = useCallback(async () => {
    if (!tenantContext.tenantId) return;
    setLoading(true);
    setError(null);
    try {
      const [funcsResult, cargosResult, perfisResult] = await Promise.allSettled([
        listFuncionariosApi(false),
        listCargosApi(false),
        listPerfisApi({
          tenantId: tenantContext.tenantId,
          includeInactive: false,
          page: 0,
          size: 100,
        }),
      ]);

      setFuncionarios(funcsResult.status === "fulfilled" ? funcsResult.value : []);
      setCargos(cargosResult.status === "fulfilled" ? cargosResult.value : []);
      setPerfis(
        perfisResult.status === "fulfilled"
          ? perfisResult.value.items
          : FALLBACK_PERFIS.map((perfil) => ({ ...perfil, tenantId: tenantContext.tenantId as string }))
      );

      if (funcsResult.status === "rejected") {
        setError(normalizeErrorMessage(funcsResult.reason));
      } else if (cargosResult.status === "rejected") {
        setError(normalizeErrorMessage(cargosResult.reason));
      }
    } catch (loadError) {
      setError(normalizeErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [tenantContext.tenantId]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const activePerfis = useMemo(
    () => perfis.filter((perfil) => perfil.active && perfil.roleName.trim().toUpperCase() !== "CUSTOMER"),
    [perfis]
  );

  return {
    tenantContext,
    tenantOptions,
    funcionarios,
    setFuncionarios,
    cargos,
    perfis,
    activePerfis,
    loading,
    error,
    setError,
    loadWorkspace,
  };
}
