import { cookies } from "next/headers";

const SESSION_CLAIMS_COOKIE = "fc_session_claims";
const LEGACY_ACTIVE_TENANT_COOKIE = "academia-active-tenant-id";

type ServerSessionClaims = {
  activeTenantId?: unknown;
};

function normalizeCookieValue(value?: string | null): string | undefined {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || undefined;
}

function tryDecodeCookieValue(value?: string | null): string | undefined {
  const normalized = normalizeCookieValue(value);
  if (!normalized) return undefined;
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

export function parseServerSessionClaimsCookie(rawCookie?: string | null): ServerSessionClaims | null {
  const decoded = tryDecodeCookieValue(rawCookie);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as ServerSessionClaims;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function resolveServerActiveTenantIdFromCookies(input: {
  sessionClaimsCookie?: string | null;
  legacyActiveTenantCookie?: string | null;
}): string | undefined {
  const claims = parseServerSessionClaimsCookie(input.sessionClaimsCookie);
  const claimsTenantId =
    typeof claims?.activeTenantId === "string" ? claims.activeTenantId.trim() : "";
  if (claimsTenantId) {
    return claimsTenantId;
  }

  return normalizeCookieValue(input.legacyActiveTenantCookie);
}

export async function getServerActiveTenantId(): Promise<string | undefined> {
  const jar = await cookies();
  return resolveServerActiveTenantIdFromCookies({
    sessionClaimsCookie: jar.get(SESSION_CLAIMS_COOKIE)?.value,
    legacyActiveTenantCookie: jar.get(LEGACY_ACTIVE_TENANT_COOKIE)?.value,
  });
}
