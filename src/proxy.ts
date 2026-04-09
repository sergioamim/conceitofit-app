import { NextRequest, NextResponse } from "next/server";
import { extractSubdomain } from "@/lib/storefront/subdomain";

// ---------------------------------------------------------------------------
// proxy.ts – Auth guard + Storefront subdomain resolution (Next.js 16)
// ---------------------------------------------------------------------------
// 1. Auth guard: verifica presença de cookies de sessão HttpOnly em rotas
//    protegidas. Redireciona para login se ausente (antes de qualquer render).
// 2. Storefront: detecta subdomínio do host, resolve tenant via API pública
//    e injeta headers x-tenant-id / x-tenant-slug para Server Components.
// ---------------------------------------------------------------------------

const BACKEND_BASE =
  process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";

/** Domínios raiz (sem subdomínio) que NÃO devem ser tratados como storefront. */
const ROOT_HOSTS = new Set(
  (process.env.STOREFRONT_ROOT_HOSTS ?? "localhost").split(",").map((h) => h.trim().toLowerCase()),
);

/** TTL do cache de resolução de subdomínio (5 minutos). */
const CACHE_TTL_MS = 5 * 60 * 1000;

// ---------------------------------------------------------------------------
// Cache em memória (por instância do edge runtime / node worker)
// ---------------------------------------------------------------------------

interface CacheEntry {
  tenantId: string;
  tenantSlug: string;
  academiaSlug: string;
  resolvedAt: number;
}

const resolveCache = new Map<string, CacheEntry | null>();

function getCached(subdomain: string): CacheEntry | null | undefined {
  const entry = resolveCache.get(subdomain);
  if (entry === undefined) return undefined;
  if (entry === null) {
    return null; // subdomínio inválido (cacheado como negativo)
  }
  if (Date.now() - entry.resolvedAt > CACHE_TTL_MS) {
    resolveCache.delete(subdomain);
    return undefined;
  }
  return entry;
}

// ---------------------------------------------------------------------------
// Resolução de tenant via API
// ---------------------------------------------------------------------------

async function resolveTenant(
  subdomain: string,
): Promise<CacheEntry | null> {
  try {
    const url = `${BACKEND_BASE}/api/v1/publico/storefront/resolve?subdomain=${encodeURIComponent(subdomain)}`;
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      resolveCache.set(subdomain, null);
      return null;
    }

    const data = (await res.json()) as {
      tenantId?: string;
      academiaId?: string;
      academiaSlug?: string;
      slug?: string;
    };

    if (!data.tenantId) {
      resolveCache.set(subdomain, null);
      return null;
    }

    const entry: CacheEntry = {
      tenantId: data.tenantId,
      tenantSlug: data.slug ?? subdomain,
      academiaSlug: data.academiaSlug ?? data.slug ?? subdomain,
      resolvedAt: Date.now(),
    };
    resolveCache.set(subdomain, entry);
    return entry;
  } catch {
    // Falha de rede: não cachear para permitir retry
    return null;
  }
}

// ---------------------------------------------------------------------------
// Auth: session detection
// ---------------------------------------------------------------------------

function hasSession(request: NextRequest): boolean {
  const flag = request.cookies.get("fc_session_active")?.value;
  if (flag === "true") return true;

  const token = request.cookies.get("fc_access_token")?.value;
  if (token && token.length > 10) return true;

  return false;
}

// ---------------------------------------------------------------------------
// Auth: login URL resolution
// ---------------------------------------------------------------------------

const DEFAULT_LOGIN_PATH = "/login";

/** Rotas que não requerem autenticação. */
const PUBLIC_ROUTE_PREFIXES = [
  "/login",
  "/acesso/",
  "/adesao",
  "/storefront",
  "/b2b",
  "/primeiro-acesso",
  "/monitor",
  "/grade",
  "/status",
  "/manifest",
  "/sw.js",
  "/icons",
  "/health",
  "/termos",
  "/privacidade",
  "/lgpd",
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    || pathname === "/"
    || /^\/app\/[^/]+\/login/.test(pathname);
}

function resolveLoginUrl(request: NextRequest): string {
  const claimsRaw = request.cookies.get("fc_session_claims")?.value;
  if (claimsRaw) {
    try {
      const claims = JSON.parse(decodeURIComponent(claimsRaw));
      const networkSubdomain = claims.networkSubdomain || claims.networkSlug;
      if (typeof networkSubdomain === "string" && networkSubdomain.trim()) {
        const safe = encodeURIComponent(networkSubdomain.trim().toLowerCase());
        return `/acesso/${safe}/autenticacao`;
      }
    } catch {
      // Malformed claims — fall through to default
    }
  }
  return DEFAULT_LOGIN_PATH;
}

function sanitizeCallbackPath(pathname: string, search: string): string | null {
  const raw = pathname + search;
  if (!raw || raw === "/" || raw === "/dashboard") return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.startsWith("/login")) return null;
  if (/^\/app\/[^/]+\/login(?:[/?#]|$)/.test(raw)) return null;
  if (/^\/acesso\/[^/]+\/autenticacao(?:[/?#]|$)/.test(raw)) return null;
  return raw;
}

/**
 * Verifica autenticação para rotas protegidas.
 * Retorna NextResponse.redirect se não autenticado, ou null para prosseguir.
 */
function checkAuth(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) return null;
  if (hasSession(request)) return null;

  // Sem sessão em rota protegida → redirect para login
  const loginPath = resolveLoginUrl(request);
  const callbackPath = sanitizeCallbackPath(pathname, request.nextUrl.search);

  const loginUrl = callbackPath
    ? `${loginPath}?next=${encodeURIComponent(callbackPath)}`
    : loginPath;

  return NextResponse.redirect(new URL(loginUrl, request.url));
}

// ---------------------------------------------------------------------------
// Proxy (Next.js 16)
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  // Step 1: Auth guard (runs first, before storefront resolution)
  const authRedirect = checkAuth(request);
  if (authRedirect) return authRedirect;

  // Step 2: Storefront subdomain resolution
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host, ROOT_HOSTS);

  // Sem subdomínio → fluxo normal da aplicação (já autenticado)
  if (!subdomain) {
    return NextResponse.next();
  }

  // Verificar cache
  let tenant = getCached(subdomain);

  if (tenant === undefined) {
    // Não cacheado: resolver via API
    tenant = await resolveTenant(subdomain);
  }

  if (tenant === null) {
    // Subdomínio inválido: rewrite para 404 pública
    const url = request.nextUrl.clone();
    url.pathname = "/storefront-not-found";
    return NextResponse.rewrite(url);
  }

  // Subdomínio válido: injetar headers e rewrite para /storefront/{academiaSlug}
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.tenantId);
  requestHeaders.set("x-tenant-slug", tenant.tenantSlug);
  requestHeaders.set("x-academia-slug", tenant.academiaSlug);
  requestHeaders.set("x-storefront-subdomain", subdomain);

  const { pathname } = request.nextUrl;
  const slug = tenant.academiaSlug;

  // Já está na rota correta do storefront
  if (pathname.startsWith(`/storefront/${slug}`)) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Rota antiga /storefront sem slug → rewrite para /storefront/{slug}
  if (pathname === "/storefront" || pathname === "/storefront/") {
    const url = request.nextUrl.clone();
    url.pathname = `/storefront/${slug}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // Subrotas do storefront antigo → rewrite adicionando slug
  if (pathname.startsWith("/storefront/")) {
    const sub = pathname.slice("/storefront".length);
    const url = request.nextUrl.clone();
    url.pathname = `/storefront/${slug}${sub}`;
    return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
  }

  // Qualquer outra rota no subdomínio → rewrite para /storefront/{slug}
  const url = request.nextUrl.clone();
  url.pathname = `/storefront/${slug}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

// ---------------------------------------------------------------------------
// Matcher: ignorar rotas internas, assets e API proxy
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next (Next.js internals)
     * - backend (API proxy)
     * - api (Next.js API routes)
     * - static files (favicon, images, etc.)
     */
    "/((?!_next|backend|api|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot|map)$).*)",
  ],
};
