import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Rotas públicas — não exigem sessão ativa
// ---------------------------------------------------------------------------

const PUBLIC_PREFIXES = [
  "/login",
  "/acesso",
  "/primeiro-acesso",
  "/adesao",
  "/storefront",
  "/api",
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
