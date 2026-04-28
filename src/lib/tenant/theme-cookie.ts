import type { Academia, Tenant } from "@/lib/types";
import {
  getTenantAppName,
  resolveTenantTheme,
  serializeTenantThemeCookiePayload,
  TENANT_THEME_COOKIE_NAME,
} from "./tenant-theme";

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function resolveThemeAcademia(input: {
  academia?: Academia;
  tenant?: Tenant;
  branding?: Tenant["branding"];
}): Academia | undefined {
  if (input.academia) {
    return {
      ...input.academia,
      branding: input.branding ?? input.academia.branding,
    };
  }

  if (!input.tenant) {
    return undefined;
  }

  return {
    id: input.tenant.academiaId ?? input.tenant.groupId ?? input.tenant.id,
    nome: input.tenant.academiaNome ?? input.tenant.nome,
    ativo: input.tenant.ativo,
    branding: input.branding ?? input.tenant.branding,
  };
}

export function persistTenantThemeCookie(input: {
  tenantId?: string;
  academia?: Academia;
  tenant?: Tenant;
  branding?: Tenant["branding"];
  maxAgeSeconds?: number;
}): void {
  if (!isBrowser()) return;

  const themedAcademia = resolveThemeAcademia(input);
  if (!themedAcademia) return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const normalizedTenantId = input.tenantId?.trim();
  const scopeKey = normalizedTenantId
    ? `tenant:${normalizedTenantId}`
    : `host:${window.location.host.toLowerCase()}`;

  document.cookie = `${TENANT_THEME_COOKIE_NAME}=${serializeTenantThemeCookiePayload({
    scopeKey,
    theme: resolveTenantTheme(themedAcademia),
    appName: getTenantAppName(themedAcademia),
  })}; Path=/; Max-Age=${input.maxAgeSeconds ?? 300}; SameSite=Lax${secure}`;
}
