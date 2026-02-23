import type { Academia, TenantBranding, TenantThemeColors, TenantThemePreset } from "./types";

export const TENANT_THEME_PRESETS: Record<TenantThemePreset, TenantThemeColors> = {
  CONCEITO_DARK: {
    accent: "#c8f135",
    primary: "#c8f135",
    ring: "#c8f135",
    secondary: "#1e2026",
    background: "#0e0f11",
    surface: "#16181c",
    border: "#2a2d35",
    foreground: "#eef0f4",
    mutedForeground: "#8a8f9e",
    danger: "#ff5c5c",
    warning: "#ffb347",
    teal: "#3de8a0",
  },
  AZUL_OCEANO: {
    accent: "#38bdf8",
    primary: "#38bdf8",
    ring: "#38bdf8",
    secondary: "#1d2633",
    background: "#0b1220",
    surface: "#121b2b",
    border: "#2b3950",
    foreground: "#e8f2ff",
    mutedForeground: "#91a4c3",
    danger: "#fb7185",
    warning: "#f59e0b",
    teal: "#22d3ee",
  },
  VERDE_ENERGIA: {
    accent: "#22c55e",
    primary: "#22c55e",
    ring: "#22c55e",
    secondary: "#14231b",
    background: "#0a140f",
    surface: "#111d16",
    border: "#284034",
    foreground: "#ebfff1",
    mutedForeground: "#8cbca0",
    danger: "#f97316",
    warning: "#facc15",
    teal: "#14b8a6",
  },
  GRAFITE_FIRE: {
    accent: "#f97316",
    primary: "#f97316",
    ring: "#f97316",
    secondary: "#26201c",
    background: "#14110f",
    surface: "#1d1916",
    border: "#3d322a",
    foreground: "#fff4ec",
    mutedForeground: "#c6a692",
    danger: "#ef4444",
    warning: "#fb923c",
    teal: "#10b981",
  },
};

export const TENANT_THEME_OPTIONS: Array<{ id: TenantThemePreset; nome: string; descricao: string }> = [
  { id: "CONCEITO_DARK", nome: "Conceito Dark", descricao: "Visual escuro padrão do sistema" },
  { id: "AZUL_OCEANO", nome: "Azul Oceano", descricao: "Tom moderno com foco em tecnologia" },
  { id: "VERDE_ENERGIA", nome: "Verde Energia", descricao: "Perfil fitness com destaque em saúde" },
  { id: "GRAFITE_FIRE", nome: "Grafite Fire", descricao: "Contraste quente para vendas e conversão" },
];

export const DEFAULT_THEME_PRESET: TenantThemePreset = "CONCEITO_DARK";

export function resolveTenantTheme(academia?: Academia): TenantThemeColors {
  const preset = academia?.branding?.themePreset ?? DEFAULT_THEME_PRESET;
  const base = TENANT_THEME_PRESETS[preset] ?? TENANT_THEME_PRESETS[DEFAULT_THEME_PRESET];
  if (!academia?.branding?.useCustomColors) return base;
  return {
    ...base,
    ...(academia.branding?.colors ?? {}),
  };
}

export function getTenantAppName(academia?: Academia): string {
  return academia?.branding?.appName?.trim() || academia?.nome?.trim() || "Conceito Fit";
}

export function createDefaultBranding(): TenantBranding {
  return {
    appName: "Conceito Fit",
    themePreset: DEFAULT_THEME_PRESET,
    useCustomColors: false,
  };
}
