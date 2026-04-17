import { headers, cookies } from "next/headers";
import {
  buildTenantThemeCssVars,
  parseTenantThemeCookiePayload,
  resolveTenantTheme,
  TENANT_THEME_COOKIE_NAME,
} from "@/lib/tenant/tenant-theme";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Academia, Tenant } from "@/lib/types";

const ACTIVE_TENANT_COOKIE_NAME = "academia-active-tenant-id";
const SESSION_CLAIMS_COOKIE_NAME = "fc_session_claims";
const SESSION_ACTIVE_COOKIE_NAME = "fc_session_active";
const ACCESS_TOKEN_COOKIE_NAME = "fc_access_token";
const DEFAULT_BACKEND_BASE = process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";

type BootstrapPayload = {
  tenantContext?: {
    tenantAtual?: Tenant | null;
  } | null;
  academia?: Academia | null;
  branding?: Tenant["branding"] | null;
};

/**
 * Este componente resolve o tenant theme via SSR e injeta as variaveis CSS
 * diretamente no <head>, evitando o "flash" do tema padrao.
 *
 * Otimizacoes de performance:
 * 1. Verifica cookie de tenant cacheado — evita fetches se ja resolvido
 * 2. Fetches em paralelo com Promise.allSettled quando necessario
 * 3. Timeout implicit via next.revalidate curto (30s para SSR critical path)
 */
export async function CriticalThemeServer() {
  const headerList = await headers();
  const cookieJar = await cookies();
  const host = (headerList.get("host") || "").trim().toLowerCase();
  const hasSession = hasAuthenticatedSession(cookieJar);
  const activeTenantId = resolveActiveTenantId(cookieJar);
  const scopeKey = buildScopeKey({
    activeTenantId,
    host,
    hasSession,
  });

  const cachedTheme = parseTenantThemeCookiePayload(
    cookieJar.get(TENANT_THEME_COOKIE_NAME)?.value,
  );
  if (
    cachedTheme?.theme
    && (
      cachedTheme.scopeKey
        ? cachedTheme.scopeKey === scopeKey
        : !hasSession
    )
  ) {
    return renderCriticalTheme(cachedTheme.theme);
  }

  let theme = hasSession
    ? await resolveThemeFromBootstrap(cookieJar)
    : undefined;

  if (!theme) {
    theme = await resolveThemeFromDomain(host);
  }

  return renderCriticalTheme(theme ?? resolveTenantTheme());
}

function hasAuthenticatedSession(cookieJar: Awaited<ReturnType<typeof cookies>>): boolean {
  return (
    cookieJar.get(SESSION_ACTIVE_COOKIE_NAME)?.value === "true"
    || Boolean(cookieJar.get(ACCESS_TOKEN_COOKIE_NAME)?.value)
    || Boolean(cookieJar.get(SESSION_CLAIMS_COOKIE_NAME)?.value)
  );
}

function resolveActiveTenantId(cookieJar: Awaited<ReturnType<typeof cookies>>): string | undefined {
  const cookieTenantId = cookieJar.get(ACTIVE_TENANT_COOKIE_NAME)?.value?.trim();
  if (cookieTenantId) {
    return cookieTenantId;
  }

  const rawClaims = cookieJar.get(SESSION_CLAIMS_COOKIE_NAME)?.value;
  if (!rawClaims) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawClaims)) as { activeTenantId?: string | null };
    return typeof parsed.activeTenantId === "string" && parsed.activeTenantId.trim()
      ? parsed.activeTenantId.trim()
      : undefined;
  } catch {
    return undefined;
  }
}

function buildScopeKey(input: {
  activeTenantId?: string;
  host?: string;
  hasSession: boolean;
}): string {
  if (input.activeTenantId) {
    return `tenant:${input.activeTenantId}`;
  }
  if (input.hasSession) {
    return "session";
  }
  if (input.host) {
    return `host:${input.host}`;
  }
  return "global";
}

function buildCookieHeader(cookieJar: Awaited<ReturnType<typeof cookies>>): string | undefined {
  const entries = cookieJar.getAll();
  if (!entries.length) {
    return undefined;
  }
  return entries
    .map((entry) => `${entry.name}=${encodeURIComponent(entry.value)}`)
    .join("; ");
}

async function resolveThemeFromBootstrap(
  cookieJar: Awaited<ReturnType<typeof cookies>>,
): Promise<ReturnType<typeof resolveTenantTheme> | undefined> {
  const cookieHeader = buildCookieHeader(cookieJar);
  if (!cookieHeader) {
    return undefined;
  }

  try {
    const response = await fetch(`${DEFAULT_BACKEND_BASE}/api/v1/app/bootstrap`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return undefined;
    }

    const payload = (await response.json()) as BootstrapPayload;
    const themedAcademia = resolveBootstrapAcademia(payload);
    return themedAcademia ? resolveTenantTheme(themedAcademia) : undefined;
  } catch {
    return undefined;
  }
}

function resolveBootstrapAcademia(payload: BootstrapPayload): Academia | undefined {
  const branding = payload.branding
    ?? payload.academia?.branding
    ?? payload.tenantContext?.tenantAtual?.branding;

  if (payload.academia) {
    return {
      ...payload.academia,
      branding: branding ?? payload.academia.branding,
    };
  }

  const tenant = payload.tenantContext?.tenantAtual;
  if (!tenant) {
    if (!branding) {
      return undefined;
    }

    return {
      id: "academia-theme-bootstrap",
      nome: "Academia",
      ativo: true,
      branding,
    };
  }

  return {
    id: tenant.academiaId ?? tenant.id,
    nome: tenant.academiaNome ?? tenant.nome,
    ativo: tenant.ativo,
    branding: branding ?? tenant.branding,
  };
}

async function resolveThemeFromDomain(
  host: string,
): Promise<ReturnType<typeof resolveTenantTheme> | undefined> {
  if (!host) {
    return undefined;
  }

  try {
    const tenantRes = await serverFetch<Tenant>("/api/v1/tenants/by-domain", {
      query: { domain: host },
      next: { revalidate: 30 },
    });

    if (!tenantRes?.academiaId) {
      return tenantRes
        ? resolveTenantTheme({
            id: tenantRes.academiaId ?? tenantRes.id,
            nome: tenantRes.academiaNome ?? tenantRes.nome,
            ativo: tenantRes.ativo,
            branding: tenantRes.branding,
          })
        : undefined;
    }

    const academia = await serverFetch<Academia>(`/api/v1/academias/${tenantRes.academiaId}`, {
      next: { revalidate: 30 },
    });
    return resolveTenantTheme(academia);
  } catch {
    return undefined;
  }
}

function renderCriticalTheme(theme: ReturnType<typeof resolveTenantTheme>) {
  return (
    <>
      <meta name="theme-color" content={theme.background} />
      <style
        id="critical-tenant-theme"
        dangerouslySetInnerHTML={{ __html: buildTenantThemeCssVars(theme) }}
      />
    </>
  );
}
