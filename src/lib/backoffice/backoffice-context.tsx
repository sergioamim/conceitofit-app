"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getImpersonationSession,
  isImpersonating,
  IMPERSONATION_SESSION_UPDATED_EVENT,
  type ImpersonationSessionState,
} from "@/lib/api/session";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BackofficeMode = "platform" | "tenant";

export interface InspectedTenant {
  tenantId: string;
  tenantName?: string;
}

export interface BackofficeContextValue {
  /** Modo atual: `platform` = visão global, `tenant` = inspecionando unidade. */
  mode: BackofficeMode;
  /** Dados do tenant sendo inspecionado (só em modo `tenant`). */
  inspectedTenant: InspectedTenant | null;
  /** Se o usuário atual está em sessão de impersonation. */
  impersonating: boolean;
  /** Snapshot da sessão de impersonation (se ativa). */
  impersonationSession: ImpersonationSessionState | null;
  /** Entrar em modo inspeção de tenant. */
  inspectTenant: (tenant: InspectedTenant) => void;
  /** Voltar para modo plataforma. */
  exitInspection: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const BackofficeContext = createContext<BackofficeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function BackofficeContextProvider({ children }: { children: ReactNode }) {
  const [inspectedTenant, setInspectedTenant] = useState<InspectedTenant | null>(null);
  const [impersonationSnapshot, setImpersonationSnapshot] =
    useState<ImpersonationSessionState | null>(null);

  // Sync impersonation state on mount and on changes
  useEffect(() => {
    function sync() {
      setImpersonationSnapshot(getImpersonationSession());
    }

    sync();
    window.addEventListener(IMPERSONATION_SESSION_UPDATED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(IMPERSONATION_SESSION_UPDATED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const inspectTenant = useCallback((tenant: InspectedTenant) => {
    setInspectedTenant(tenant);
  }, []);

  const exitInspection = useCallback(() => {
    setInspectedTenant(null);
  }, []);

  const value = useMemo<BackofficeContextValue>(
    () => ({
      mode: inspectedTenant ? "tenant" : "platform",
      inspectedTenant,
      impersonating: isImpersonating(),
      impersonationSession: impersonationSnapshot,
      inspectTenant,
      exitInspection,
    }),
    [inspectedTenant, impersonationSnapshot, inspectTenant, exitInspection],
  );

  return (
    <BackofficeContext.Provider value={value}>
      {children}
    </BackofficeContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBackofficeContext(): BackofficeContextValue {
  const ctx = useContext(BackofficeContext);
  if (!ctx) {
    throw new Error(
      "useBackofficeContext deve ser usado dentro de <BackofficeContextProvider>",
    );
  }
  return ctx;
}
