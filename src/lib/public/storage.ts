import type { PublicCheckoutSummary, PublicSignupDraft } from "@/lib/public/services";

export type PublicJourneyDraft = {
  tenantRef?: string;
  planId?: string;
  trialLeadId?: string;
  trialLeadNome?: string;
  signup?: PublicSignupDraft;
  checkout?: PublicCheckoutSummary;
};

const STORAGE_PREFIX = "academia-public-journey";

function getStorageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}:${tenantId}`;
}

export function loadPublicJourneyDraft(tenantId: string): PublicJourneyDraft {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(getStorageKey(tenantId));
    if (!raw) return {};
    return JSON.parse(raw) as PublicJourneyDraft;
  } catch {
    return {};
  }
}

export function savePublicJourneyDraft(
  tenantId: string,
  patch: Partial<PublicJourneyDraft>
): PublicJourneyDraft {
  const current = loadPublicJourneyDraft(tenantId);
  const next = {
    ...current,
    ...patch,
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(getStorageKey(tenantId), JSON.stringify(next));
  }
  return next;
}

export function clearPublicJourneyDraft(tenantId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getStorageKey(tenantId));
}
