import { isContextualNetworkAccessEnabled } from "@/lib/feature-flags";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const DEFAULT_LOGIN_PATH = "/login";
const FORCE_PASSWORD_CHANGE_PATH = "/primeiro-acesso/trocar-senha";

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

export function buildForcedPasswordChangeHref(nextPath?: string): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  if (resolvedNext === DEFAULT_POST_LOGIN_PATH) {
    return FORCE_PASSWORD_CHANGE_PATH;
  }
  return `${FORCE_PASSWORD_CHANGE_PATH}?next=${encodeURIComponent(resolvedNext)}`;
}
