"use client";

import { useEffect } from "react";
import { getStore } from "@/lib/mock/store";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant-theme";

function applyThemeVars() {
  const store = getStore();
  const tenant = store.tenants.find((item) => item.id === store.currentTenantId) ?? store.tenant;
  const academiaId = tenant?.academiaId ?? tenant?.groupId;
  const academia = store.academias.find((item) => item.id === academiaId) ?? store.academias[0];
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
  root.style.setProperty("--color-gym-accent", theme.accent);
  root.style.setProperty("--color-gym-danger", theme.danger);
  root.style.setProperty("--color-gym-warning", theme.warning);
  root.style.setProperty("--color-gym-teal", theme.teal);
  root.style.setProperty("--color-surface", theme.surface);
  root.style.setProperty("--color-surface2", theme.secondary);

  document.title = `${getTenantAppName(academia)} – Gestão de Academia`;
}

export function TenantThemeSync() {
  useEffect(() => {
    applyThemeVars();
    window.addEventListener("academia-store-updated", applyThemeVars);
    window.addEventListener("storage", applyThemeVars);
    return () => {
      window.removeEventListener("academia-store-updated", applyThemeVars);
      window.removeEventListener("storage", applyThemeVars);
    };
  }, []);

  return null;
}
