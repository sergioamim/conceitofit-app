"use client";

import { useEffect, useState } from "react";
import { listAcademiasApi } from "@/lib/api/contexto-unidades";
import type { Academia } from "@/lib/types";
import { getTenantAppName, resolveTenantTheme } from "@/lib/tenant-theme";
import { TENANT_CONTEXT_UPDATED_EVENT } from "@/lib/tenant-context";
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
  root.style.setProperty("--color-gym-accent", theme.accent);
  root.style.setProperty("--color-gym-danger", theme.danger);
  root.style.setProperty("--color-gym-warning", theme.warning);
  root.style.setProperty("--color-gym-teal", theme.teal);
  root.style.setProperty("--color-surface", theme.surface);
  root.style.setProperty("--color-surface2", theme.secondary);

  document.title = `${getTenantAppName(academia)} - Gestão de Academia`;
}

export function TenantThemeSync() {
  const { tenantId, tenant } = useTenantContext();
  const [academia, setAcademia] = useState<Academia | undefined>(undefined);

  useEffect(() => {
    let active = true;

    async function loadAcademia() {
      if (!tenantId) {
        if (!active) return;
        setAcademia(undefined);
        return;
      }

      try {
        const academias = await listAcademiasApi(tenantId);
        if (!active) return;
        setAcademia(academias[0]);
      } catch {
        if (!active) return;
        setAcademia(
          tenant
            ? {
                id: tenant.academiaId ?? tenant.groupId ?? tenant.id,
                nome: tenant.nome,
                branding: tenant.branding,
                ativo: tenant.ativo,
              }
            : undefined
        );
      }
    }

    void loadAcademia();

    return () => {
      active = false;
    };
  }, [tenant, tenantId]);

  useEffect(() => {
    applyThemeVars(academia);

    function handleUpdate() {
      applyThemeVars(academia);
    }

    window.addEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(TENANT_CONTEXT_UPDATED_EVENT, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [academia]);

  return null;
}
