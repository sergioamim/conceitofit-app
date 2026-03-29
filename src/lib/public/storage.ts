import type { PublicCheckoutSummary, PublicSignupDraft } from "@/lib/public/services";
import { logger } from "@/lib/shared/logger";

export type PublicJourneyDraft = {
  tenantRef?: string;
  planId?: string;
  trialLeadId?: string;
  trialLeadNome?: string;
  signup?: PublicSignupDraft;
  checkout?: PublicCheckoutSummary;
};

const STORAGE_PREFIX = "academia-public-journey";

/**
 * Cache em memória — funciona em SSR (sem acesso a window) e no cliente.
 * Dados vivem apenas durante a sessão da tab (sessionStorage) e são
 * espelhados no cache em memória para acesso síncrono sem hidratação.
 */
const memoryCache = new Map<string, PublicJourneyDraft>();

function getStorageKey(tenantId: string): string {
  return `${STORAGE_PREFIX}:${tenantId}`;
}

function readFromSession(key: string): PublicJourneyDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as PublicJourneyDraft;
  } catch (error) {
    logger.warn("[PublicJourneyStorage] Failed to read from sessionStorage", { error });
    return null;
  }
}

function writeToSession(key: string, draft: PublicJourneyDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(draft));
  } catch (error) {
    logger.warn("[PublicJourneyStorage] sessionStorage write failed (full or unavailable)", { error });
  }
}

export function loadPublicJourneyDraft(tenantId: string): PublicJourneyDraft {
  const key = getStorageKey(tenantId);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const fromSession = readFromSession(key);
  if (fromSession) {
    memoryCache.set(key, fromSession);
    return fromSession;
  }

  return {};
}

export function savePublicJourneyDraft(
  tenantId: string,
  patch: Partial<PublicJourneyDraft>
): PublicJourneyDraft {
  const key = getStorageKey(tenantId);
  const current = loadPublicJourneyDraft(tenantId);
  const next = { ...current, ...patch };
  memoryCache.set(key, next);
  writeToSession(key, next);
  return next;
}

export function clearPublicJourneyDraft(tenantId: string): void {
  const key = getStorageKey(tenantId);
  memoryCache.delete(key);
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem(key);
  }
}
