"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getPublicJourneyContext,
  type PublicTenantContext,
} from "@/lib/public/services";
import {
  clearPublicJourneyDraft,
  loadPublicJourneyDraft,
  savePublicJourneyDraft,
  type PublicJourneyDraft,
} from "@/lib/public/storage";

type UsePublicJourneyState = {
  tenantRef: string | null;
  context: PublicTenantContext | null;
  draft: PublicJourneyDraft;
  loading: boolean;
  error: string;
};

export function usePublicJourney() {
  const searchParams = useSearchParams();
  const tenantRef = searchParams.get("tenant");
  const planId = searchParams.get("plan");
  const checkoutId = searchParams.get("checkout");

  const [state, setState] = useState<UsePublicJourneyState>({
    tenantRef,
    context: null,
    draft: {},
    loading: true,
    error: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const context = await getPublicJourneyContext(tenantRef);
        if (!active) return;
        setState({
          tenantRef,
          context,
          draft: loadPublicJourneyDraft(context.tenant.id),
          loading: false,
          error: "",
        });
      } catch (error) {
        if (!active) return;
        setState({
          tenantRef,
          context: null,
          draft: {},
          loading: false,
          error: error instanceof Error ? error.message : "Falha ao carregar a jornada pública.",
        });
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [tenantRef]);

  const isCurrentTenant = state.tenantRef === tenantRef;

  const refreshDraft = useCallback(() => {
    if (!state.context) return;
    setState((current) => ({
      ...current,
      draft: loadPublicJourneyDraft(state.context!.tenant.id),
    }));
  }, [state.context]);

  const persistDraft = useCallback((patch: Partial<PublicJourneyDraft>) => {
    if (!state.context) return;
    const next = savePublicJourneyDraft(state.context.tenant.id, patch);
    setState((current) => ({
      ...current,
      draft: next,
    }));
  }, [state.context]);

  const resetDraft = useCallback(() => {
    if (!state.context) return;
    clearPublicJourneyDraft(state.context.tenant.id);
    setState((current) => ({
      ...current,
      draft: {},
    }));
  }, [state.context]);

  return {
    context: isCurrentTenant ? state.context : null,
    draft: isCurrentTenant ? state.draft : {},
    loading: !isCurrentTenant || state.loading,
    error: isCurrentTenant ? state.error : "",
    tenantRef,
    planId,
    checkoutId,
    resolvedTenantRef: state.context?.tenantRef ?? tenantRef ?? "",
    persistDraft,
    refreshDraft,
    resetDraft,
  };
}
