"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/admin-financeiro";
import type { NfseConfiguracao } from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export type TabLoadStatus = "idle" | "loading" | "ready" | "error";

export type NfseTabState = {
  tenantId: string | null;
  configuracao: NfseConfiguracao | null;
  status: TabLoadStatus;
  error: string | null;
};

function createIdleState(tenantId: string | null = null): NfseTabState {
  return { tenantId, configuracao: null, status: "idle", error: null };
}

export function useClienteNfse(deps: {
  activeTab: string;
  tenantId: string | null | undefined;
}) {
  const [state, setState] = useState<NfseTabState>(() => createIdleState());
  const stateRef = useRef(state);

  useEffect(() => { stateRef.current = state; }, [state]);

  const loadNfseTabData = useCallback(async (currentTenantId: string) => {
    const current = stateRef.current;
    if (
      current.tenantId === currentTenantId
      && (current.status === "loading" || current.status === "ready")
    ) return;

    setState({ tenantId: currentTenantId, configuracao: null, status: "loading", error: null });

    try {
      const configuracao = await getNfseConfiguracaoAtualApi({ tenantId: currentTenantId });
      setState((prev) =>
        prev.tenantId !== currentTenantId ? prev : { tenantId: currentTenantId, configuracao, status: "ready", error: null },
      );
    } catch (error) {
      const message = normalizeErrorMessage(error);
      setState((prev) =>
        prev.tenantId !== currentTenantId ? prev : { tenantId: currentTenantId, configuracao: null, status: "error", error: message },
      );
    }
  }, []);

  useEffect(() => {
    if (deps.activeTab !== "nfse" || !deps.tenantId) return;
    void loadNfseTabData(deps.tenantId);
  }, [deps.activeTab, deps.tenantId, loadNfseTabData]);

  function resetState(tenantId: string | null = null) {
    setState(createIdleState(tenantId));
  }

  return {
    nfseTabState: state,
    loadNfseTabData,
    resetNfseState: resetState,
  };
}
