const DEFAULT_POST_LOGIN_PATH = "/dashboard";

export function resolvePostLoginPath(rawValue?: string | null): string {
  const candidate = rawValue?.trim();
  if (!candidate) return DEFAULT_POST_LOGIN_PATH;
  if (!candidate.startsWith("/")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("//")) return DEFAULT_POST_LOGIN_PATH;
  if (candidate.startsWith("/login")) return DEFAULT_POST_LOGIN_PATH;
  return candidate;
}

export function buildLoginHref(nextPath?: string): string {
  const resolvedNext = resolvePostLoginPath(nextPath);
  if (resolvedNext === DEFAULT_POST_LOGIN_PATH) {
    return "/login";
  }
  return `/login?next=${encodeURIComponent(resolvedNext)}`;
}

