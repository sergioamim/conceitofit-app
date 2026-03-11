"use client";

import { useEffect, useState } from "react";
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
    context: null,
    draft: {},
    loading: true,
    error: "",
  });

  useEffect(() => {
    let active = true;
    setState((current) => ({
      ...current,
      loading: true,
      error: "",
    }));

    async function load() {
      try {
        const context = await getPublicJourneyContext(tenantRef);
        if (!active) return;
        setState({
          context,
          draft: loadPublicJourneyDraft(context.tenant.id),
          loading: false,
          error: "",
        });
      } catch (error) {
        if (!active) return;
        setState({
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

  function refreshDraft() {
    if (!state.context) return;
    setState((current) => ({
      ...current,
      draft: loadPublicJourneyDraft(state.context!.tenant.id),
    }));
  }

  function persistDraft(patch: Partial<PublicJourneyDraft>) {
    if (!state.context) return;
    const next = savePublicJourneyDraft(state.context.tenant.id, patch);
    setState((current) => ({
      ...current,
      draft: next,
    }));
  }

  function resetDraft() {
    if (!state.context) return;
    clearPublicJourneyDraft(state.context.tenant.id);
    setState((current) => ({
      ...current,
      draft: {},
    }));
  }

  return {
    ...state,
    tenantRef,
    planId,
    checkoutId,
    resolvedTenantRef: state.context?.tenantRef ?? tenantRef ?? "",
    persistDraft,
    refreshDraft,
    resetDraft,
  };
}
