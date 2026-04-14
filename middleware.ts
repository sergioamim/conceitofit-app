import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { normalizeUserKind, type UserKind } from "@/lib/shared/user-kind";

// ---------------------------------------------------------------------------
// Rotas públicas — não exigem sessão ativa
// ---------------------------------------------------------------------------

const PUBLIC_PREFIXES = [
  "/login",
  "/acesso",
  "/primeiro-acesso",
  "/adesao",
  "/storefront",
  "/b2b",
  "/api",
  "/backend",
  "/_next",
  "/favicon",
  "/manifest",
  "/sw.js",
  "/icons",
];

const PUBLIC_EXACT = new Set(["/", "/health", "/robots.txt", "/sitemap.xml"]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Detecção de sessão via cookies server-side
// ---------------------------------------------------------------------------

const SESSION_ACTIVE_COOKIE = "fc_session_active";
const SESSION_CLAIMS_COOKIE = "fc_session_claims";
const ACCESS_TOKEN_COOKIE = "fc_access_token";

function hasSession(request: NextRequest): boolean {
  // 1. Flag explícita do backend
  const flag = request.cookies.get(SESSION_ACTIVE_COOKIE)?.value;
  if (flag === "true") return true;

  // 2. Fallback: cookie de claims existe e tem conteúdo
  const claims = request.cookies.get(SESSION_CLAIMS_COOKIE)?.value;
  if (claims && claims.length > 2) return true;

  // 3. Fallback: access token cookie existe
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (token && token.length > 10) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Resolução de URL de login (server-side)
// ---------------------------------------------------------------------------

function resolveNetworkSlug(request: NextRequest): string | null {
  // Tenta extrair do cookie de claims
  const claims = request.cookies.get(SESSION_CLAIMS_COOKIE)?.value;
  if (claims) {
    try {
      const parsed = JSON.parse(claims);
      if (parsed.networkSubdomain) return parsed.networkSubdomain;
      if (parsed.networkSlug) return parsed.networkSlug;
    } catch {
      // ignore
    }
  }
  return null;
}

function buildLoginUrl(request: NextRequest): string {
  const slug = resolveNetworkSlug(request);
  const { pathname, search } = request.nextUrl;
  const next = encodeURIComponent(`${pathname}${search}`);

  if (slug) {
    return `/acesso/${slug}/autenticacao?next=${next}`;
  }
  return `/login?next=${next}`;
}

// ---------------------------------------------------------------------------
// Kind-aware guards
// ---------------------------------------------------------------------------

const BACKOFFICE_PREFIX = "/admin";
const CLIENT_HOME_PATH = "/dashboard";

function resolveKindFromSession(request: NextRequest): UserKind | null {
  const claimsRaw = request.cookies.get(SESSION_CLAIMS_COOKIE)?.value;
  if (!claimsRaw) return null;
  try {
    const parsed = JSON.parse(claimsRaw) as {
      userKind?: unknown;
      broadAccess?: unknown;
      availableScopes?: unknown;
    };
    const direct = normalizeUserKind(
      typeof parsed.userKind === "string" ? parsed.userKind : undefined,
    );
    if (direct) return direct;

    const scopes = Array.isArray(parsed.availableScopes)
      ? parsed.availableScopes
          .map((item) => (typeof item === "string" ? item.trim().toUpperCase() : ""))
          .filter(Boolean)
      : [];
    if (scopes.includes("GLOBAL") || parsed.broadAccess === true) {
      return "PLATAFORMA";
    }
  } catch {
    return null;
  }
  return null;
}

function isBackofficePath(pathname: string): boolean {
  return pathname === BACKOFFICE_PREFIX || pathname.startsWith(`${BACKOFFICE_PREFIX}/`);
}

function isClientHomePath(pathname: string): boolean {
  return pathname === CLIENT_HOME_PATH || pathname.startsWith(`${CLIENT_HOME_PATH}/`);
}

function redirectTo(request: NextRequest, path: string): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas públicas → pass-through
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // Rotas protegidas — verificar sessão
  if (!hasSession(request)) {
    const loginUrl = buildLoginUrl(request);
    const url = request.nextUrl.clone();
    url.pathname = loginUrl.split("?")[0];
    url.search = loginUrl.includes("?") ? `?${loginUrl.split("?")[1]}` : "";
    return NextResponse.redirect(url);
  }

  // Kind guards — impede cross-area entre backoffice e área do cliente
  const kind = resolveKindFromSession(request);
  if (kind === "CLIENTE" && isBackofficePath(pathname)) {
    return redirectTo(request, CLIENT_HOME_PATH);
  }
  if (kind === "PLATAFORMA" && isClientHomePath(pathname)) {
    return redirectTo(request, BACKOFFICE_PREFIX);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public assets (icons, images)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|icons/).*)",
  ],
};
