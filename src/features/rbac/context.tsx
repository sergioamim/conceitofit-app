"use client";

import { createContext, useContext, useMemo } from "react";

import type { Dominio } from "./api/types";

interface RbacContextValue {
  /** Prefixo das rotas — `/admin/gestao-acessos` no backoffice ou `/gestao-acessos` no portal. */
  basePath: string;
  dominio: Dominio;
  tenantId?: string;
}

const RbacContext = createContext<RbacContextValue | null>(null);

interface RbacProviderProps extends RbacContextValue {
  children: React.ReactNode;
}

export function RbacProvider({
  basePath,
  dominio,
  tenantId,
  children,
}: RbacProviderProps) {
  const value = useMemo(
    () => ({ basePath, dominio, tenantId }),
    [basePath, dominio, tenantId],
  );
  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbacContext(): RbacContextValue {
  const ctx = useContext(RbacContext);
  if (!ctx) {
    throw new Error(
      "useRbacContext deve ser usado dentro de <RbacProvider>. Verifique se a page envolve o screen com o provider correto.",
    );
  }
  return ctx;
}

export function useRbacBasePath(): string {
  return useRbacContext().basePath;
}

/** Helper: monta um path absoluto preservando o basePath atual. */
export function useRbacHref() {
  const basePath = useRbacBasePath();
  return (suffix: string = "") => {
    if (!suffix) return basePath;
    return `${basePath}${suffix.startsWith("/") ? suffix : `/${suffix}`}`;
  };
}
