"use client";

import { useEffect, useMemo } from "react";
import type { Academia } from "@/lib/types";
import {
  getTenantAppName,
  getTenantThemeCssVarEntries,
  resolveTenantTheme,
} from "@/lib/tenant/tenant-theme";
import { persistTenantThemeCookie } from "@/lib/tenant/theme-cookie";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";

function applyThemeVars(academia: Academia, tenantId?: string) {
  const root = document.documentElement;
  const theme = resolveTenantTheme(academia);

  for (const [name, value] of getTenantThemeCssVarEntries(theme)) {
    root.style.setProperty(name, value);
  }

  const appName = getTenantAppName(academia);
  document.title = `${appName} - Gestão de Academia`;
  syncThemeColorMeta(theme.background);
  persistTenantThemeCookie({
    tenantId,
    academia,
  });
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
    if (!themedAcademia) {
      return;
    }
    applyThemeVars(themedAcademia, tenant?.id);
  }, [themedAcademia, tenant?.id]);

  return null;
}

function syncThemeColorMeta(color: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.appendChild(meta);
  }
  meta.content = color;
}
