"use client";

import { useEffect } from "react";
import type { StorefrontTheme, TenantThemePreset } from "@/lib/types";
import { TENANT_THEME_PRESETS } from "@/lib/tenant/tenant-theme";

function applyStorefrontCssVars(theme: StorefrontTheme) {
  const root = document.documentElement;

  // Resolve base colors from preset
  const preset = theme.themePreset as TenantThemePreset | undefined;
  const baseColors = preset && TENANT_THEME_PRESETS[preset]
    ? TENANT_THEME_PRESETS[preset]
    : TENANT_THEME_PRESETS.CONCEITO_DARK;

  // Merge with custom colors if enabled
  const colors = theme.useCustomColors
    ? { ...baseColors, ...Object.fromEntries(Object.entries(theme.colors ?? {}).filter(([, v]) => v)) }
    : baseColors;

  root.style.setProperty("--color-gym-accent", colors.accent);
  root.style.setProperty("--color-primary", colors.primary);
  root.style.setProperty("--color-background", colors.background);
  root.style.setProperty("--color-surface", colors.surface ?? colors.background);
  root.style.setProperty("--color-surface2", colors.surface ?? colors.background);
  root.style.setProperty("--color-foreground", colors.foreground);
  root.style.setProperty("--color-muted-foreground", colors.mutedForeground);
  root.style.setProperty("--color-border", colors.border);
  root.style.setProperty("--color-ring", colors.accent);
  root.style.setProperty("--color-gym-teal", colors.teal);
  root.style.setProperty("--color-gym-danger", colors.danger);
  root.style.setProperty("--color-gym-warning", colors.warning);

  // Favicon
  if (theme.faviconUrl) {
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = theme.faviconUrl;
  }
}

export function StorefrontThemeProvider({
  theme,
  children,
}: {
  theme: StorefrontTheme | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (theme) {
      applyStorefrontCssVars(theme);
    }
  }, [theme]);

  return <>{children}</>;
}
