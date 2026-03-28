"use client";

import { useEffect, useMemo } from "react";
import type { Academia } from "@/lib/types";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant/tenant-theme";
import { useTenantContext } from "@/hooks/use-session-context";

function applyThemeVars(academia?: Academia) {
  const root = document.documentElement;
  const theme = resolveTenantTheme(academia);

  root.style.setProperty("--primary", theme.primary);
  root.style.setProperty("--ring", theme.ring);
  root.style.setProperty("--secondary", theme.secondary);
  root.style.setProperty("--background", theme.background);
  root.style.setProperty("--card", theme.surface);
  root.style.setProperty("--popover", theme.surface);
  root.style.setProperty("--muted", theme.secondary);
  root.style.setProperty("--accent", theme.secondary);
  root.style.setProperty("--input", theme.secondary);
  root.style.setProperty("--border", theme.border);
  root.style.setProperty("--foreground", theme.foreground);
  root.style.setProperty("--card-foreground", theme.foreground);
  root.style.setProperty("--popover-foreground", theme.foreground);
  root.style.setProperty("--secondary-foreground", theme.foreground);
  root.style.setProperty("--muted-foreground", theme.mutedForeground);
  root.style.setProperty("--destructive", theme.danger);
  root.style.setProperty("--sidebar", theme.surface);
  root.style.setProperty("--sidebar-border", theme.border);
  root.style.setProperty("--sidebar-ring", theme.ring);
  root.style.setProperty("--sidebar-foreground", theme.foreground);
  root.style.setProperty("--sidebar-primary", theme.primary);
  root.style.setProperty("--sidebar-primary-foreground", theme.background);
  root.style.setProperty("--sidebar-accent", theme.secondary);
  root.style.setProperty("--sidebar-accent-foreground", theme.foreground);
  root.style.setProperty("--gym-accent", theme.accent);
  root.style.setProperty("--gym-danger", theme.danger);
  root.style.setProperty("--gym-warning", theme.warning);
  root.style.setProperty("--gym-teal", theme.teal);
  root.style.setProperty("--surface", theme.surface);
  root.style.setProperty("--surface-2", theme.secondary);

  document.title = `${getTenantAppName(academia)} - Gestão de Academia`;
}

export function TenantThemeSync() {
  const { tenant, academia, brandingSnapshot } = useTenantContext();
  const themedAcademia = useMemo<Academia | undefined>(() => {
    if (academia) {
      return {
        ...academia,
        branding: brandingSnapshot ?? academia.branding,
      };
    }

    if (!tenant) return undefined;

    return {
      id: tenant.academiaId ?? tenant.groupId ?? tenant.id,
      nome: tenant.nome,
      ativo: tenant.ativo,
      branding: brandingSnapshot ?? tenant.branding,
    };
  }, [academia, brandingSnapshot, tenant]);

  useEffect(() => {
    applyThemeVars(themedAcademia);
  }, [themedAcademia]);

  return null;
}
