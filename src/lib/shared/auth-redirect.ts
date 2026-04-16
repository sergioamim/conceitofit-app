import { isContextualNetworkAccessEnabled } from "@/lib/feature-flags";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";
import {
  resolveUserKindFromSession,
  type UserKind,
  type UserKindSessionInput,
} from "@/lib/shared/user-kind";

const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const BACKOFFICE_HOME_PATH = "/admin";
const DEFAULT_LOGIN_PATH = "/login";
const FORCE_PASSWORD_CHANGE_PATH = "/primeiro-acesso/trocar-senha";

const HOME_BY_KIND: Record<UserKind, string> = {
  PLATAFORMA: BACKOFFICE_HOME_PATH,
  OPERADOR: DEFAULT_POST_LOGIN_PATH,
  CLIENTE: DEFAULT_POST_LOGIN_PATH,
};

export function resolvePostLoginPath(rawValue?: string | null): string {
  const candidate = rawValue?.trim();
  if (!candidate) return DEFAULT_POST_LOGIN_PATH;
  if (!candidate.startsWith("/")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("//")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("/login")) return DEFAULT_POST_LOGIN_PATH;
  if (/^\/app\/[^/]+\/login(?:[/?#]|$)/.test(candidate)) return DEFAULT_POST_LOGIN_PATH;
  if (/^\/acesso\/[^/]+\/autenticacao(?:[/?#]|$)/.test(candidate)) return DEFAULT_POST_LOGIN_PATH;
  return candidate;
}

export function buildLoginHref(nextPath?: string, networkSlug?: string | null): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  const normalizedNetworkSlug = normalizeNetworkSubdomain(networkSlug);
  const loginBasePath = normalizedNetworkSlug
    && isContextualNetworkAccessEnabled()
    ? buildNetworkAccessHref("login", normalizedNetworkSlug)
    : DEFAULT_LOGIN_PATH;

  if (resolvedNext === DEFAULT_POST_LOGIN_PATH) {
    return loginBasePath;
  }
  return `${loginBasePath}?next=${encodeURIComponent(resolvedNext)}`;
}

export function buildAdminLoginHref(nextPath?: string, reason?: string | null): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  const params = new URLSearchParams();

  if (resolvedNext !== DEFAULT_POST_LOGIN_PATH) {
    params.set("next", resolvedNext);
  }

  const normalizedReason = reason?.trim();
  if (normalizedReason) {
    params.set("reason", normalizedReason);
  }

  const query = params.toString();
  return query ? `${DEFAULT_LOGIN_PATH}?${query}` : DEFAULT_LOGIN_PATH;
}

export function buildForcedPasswordChangeHref(nextPath?: string): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  if (resolvedNext === DEFAULT_POST_LOGIN_PATH) {
    return FORCE_PASSWORD_CHANGE_PATH;
  }
  return `${FORCE_PASSWORD_CHANGE_PATH}?next=${encodeURIComponent(resolvedNext)}`;
}

export function resolveHomeForSession(session: UserKindSessionInput): string {
  const kind = resolveUserKindFromSession(session);
  if (!kind) return DEFAULT_POST_LOGIN_PATH;
  if (kind === "PLATAFORMA" && (isSandboxActive(session) || isBackofficeToOperationalSession(session))) {
    return DEFAULT_POST_LOGIN_PATH;
  }
  return HOME_BY_KIND[kind];
}

function isSandboxActive(session: UserKindSessionInput): boolean {
  if (!session || typeof session !== "object") return false;
  const candidate = session as { sandboxMode?: unknown };
  return candidate.sandboxMode === true;
}

function isBackofficeToOperationalSession(session: UserKindSessionInput): boolean {
  return typeof session.sessionMode === "string"
    && session.sessionMode.trim().toUpperCase() === "BACKOFFICE_TO_OPERATIONAL";
}

export function resolvePostLoginPathForSession(
  rawValue: string | null | undefined,
  session: UserKindSessionInput,
): string {
  const home = resolveHomeForSession(session);
  const sanitizedNext = resolvePostLoginPath(rawValue);
  const kind = resolveUserKindFromSession(session);

  if (sanitizedNext === DEFAULT_POST_LOGIN_PATH) {
    return home;
  }

  const wantsBackoffice = sanitizedNext.startsWith(BACKOFFICE_HOME_PATH);

  if (kind === "CLIENTE" && wantsBackoffice) {
    return home;
  }

  if (
    kind === "PLATAFORMA"
    && !wantsBackoffice
    && !isSandboxActive(session)
    && !isBackofficeToOperationalSession(session)
  ) {
    return home;
  }

  return sanitizedNext;
}
