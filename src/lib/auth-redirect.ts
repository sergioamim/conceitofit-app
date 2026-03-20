const DEFAULT_POST_LOGIN_PATH = "/dashboard";
const DEFAULT_LOGIN_PATH = "/login";

function normalizeNetworkSlug(rawValue?: string | null): string | undefined {
  const candidate = rawValue?.trim().toLowerCase();
  return candidate ? encodeURIComponent(candidate) : undefined;
}

export function resolvePostLoginPath(rawValue?: string | null): string {
  const candidate = rawValue?.trim();
  if (!candidate) return DEFAULT_POST_LOGIN_PATH;
  if (!candidate.startsWith("/")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("//")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("/login")) return DEFAULT_POST_LOGIN_PATH;
  return candidate;
}

export function buildLoginHref(nextPath?: string, networkSlug?: string | null): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  const normalizedNetworkSlug = normalizeNetworkSlug(networkSlug);
  const loginBasePath = normalizedNetworkSlug
    ? `/acesso/${normalizedNetworkSlug}/autenticacao`
    : DEFAULT_LOGIN_PATH;

  if (resolvedNext === DEFAULT_POST_LOGIN_PATH) {
    return loginBasePath;
  }
  return `${loginBasePath}?next=${encodeURIComponent(resolvedNext)}`;
}
