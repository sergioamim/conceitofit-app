"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createCartaoClienteService,
  deleteCartaoClienteService,
  listBandeirasCartaoService,
  listCartoesClienteService,
  setCartaoPadraoService,
} from "@/lib/tenant/comercial/runtime";
import type { BandeiraCartao, CartaoCliente } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export type TabLoadStatus = "idle" | "loading" | "ready" | "error";

export type CartoesTabState = {
  tenantId: string | null;
  cartoes: CartaoCliente[];
  bandeiras: BandeiraCartao[];
  status: TabLoadStatus;
  error: string | null;
};

function createIdleState(tenantId: string | null = null): CartoesTabState {
  return { tenantId, cartoes: [], bandeiras: [], status: "idle", error: null };
}

export function useClienteCartoes(deps: {
  activeTab: string;
  tenantId: string | null | undefined;
  alunoId: string | null | undefined;
}) {
  const [state, setState] = useState<CartoesTabState>(() => createIdleState());
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  const loadCartoesTabData = useCallback(async (
    currentTenantId: string,
    alunoId: string,
    options?: { force?: boolean },
  ) => {
    const current = stateRef.current;
    if (
      !options?.force
      && current.tenantId === currentTenantId
      && (current.status === "loading" || current.status === "ready")
    ) return;
    if (current.tenantId === currentTenantId && current.status === "loading") return;

    setState({ tenantId: currentTenantId, cartoes: [], bandeiras: [], status: "loading", error: null });

    try {
      const [cartoes, bandeiras] = await Promise.all([
        listCartoesClienteService({ tenantId: currentTenantId, alunoId }),
        listBandeirasCartaoService({ apenasAtivas: true }),
      ]);
      setState((prev) =>
        prev.tenantId !== currentTenantId ? prev : { tenantId: currentTenantId, cartoes, bandeiras, status: "ready", error: null },
      );
    } catch (error) {
      const message = normalizeErrorMessage(error);
      setState((prev) =>
        prev.tenantId !== currentTenantId ? prev : { tenantId: currentTenantId, cartoes: [], bandeiras: [], status: "error", error: message },
      );
    }
  }, []);

  useEffect(() => {
    if (deps.activeTab !== "cartoes" || !deps.tenantId || !deps.alunoId) return;
    void loadCartoesTabData(deps.tenantId, deps.alunoId);
  }, [deps.activeTab, deps.alunoId, deps.tenantId, loadCartoesTabData]);

  async function handleCreateCartao(tenantId: string, alunoId: string, data: Parameters<typeof createCartaoClienteService>[0]["data"]) {
    await createCartaoClienteService({ tenantId, alunoId, data });
    await loadCartoesTabData(tenantId, alunoId, { force: true });
  }

  async function handleDeleteCartao(tenantId: string, id: string) {
    await deleteCartaoClienteService({ tenantId, id });
  }

  async function handleReloadCartoes(tenantId: string, alunoId: string) {
    await loadCartoesTabData(tenantId, alunoId, { force: true });
  }

  async function handleSetDefaultCartao(tenantId: string, id: string) {
    await setCartaoPadraoService({ tenantId, id });
  }

  function resetState(tenantId: string | null = null) {
    setState(createIdleState(tenantId));
  }

  return {
    cartoesTabState: state,
    loadCartoesTabData,
    handleCreateCartao,
    handleDeleteCartao,
    handleReloadCartoes,
    handleSetDefaultCartao,
    resetCartoesState: resetState,
  };
}
