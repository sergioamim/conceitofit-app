import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Storefront subdomain middleware
// ---------------------------------------------------------------------------
// Detecta subdomínio do host, resolve o tenant via API pública e injeta
// headers x-tenant-id / x-tenant-slug para consumo em Server Components.
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
// Extração de subdomínio
// ---------------------------------------------------------------------------

function extractSubdomain(host: string): string | undefined {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname) return undefined;

  // Dev: algo.localhost → "algo"
  if (hostname.endsWith(".localhost")) {
    const label = hostname.replace(/\.localhost$/, "");
    return label && label !== "localhost" ? label : undefined;
  }

  // Produção: sub.dominio.com.br → "sub" (ignora domínios raiz)
  const parts = hostname.split(".");
  if (parts.length < 3) return undefined; // dominio.com.br → sem subdomínio

  const candidate = parts[0];
  if (!candidate || candidate === "www") return undefined;

  // Verifica se o host base (sem subdomínio) é um root host conhecido
  const baseHost = parts.slice(1).join(".");
  if (ROOT_HOSTS.has(hostname) || ROOT_HOSTS.has(baseHost)) {
    return undefined; // é o domínio raiz da app, não storefront
  }

  return candidate;
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
// Proxy (Next.js 16 — substitui middleware)
// ---------------------------------------------------------------------------

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const subdomain = extractSubdomain(host);

  // Sem subdomínio → fluxo normal da aplicação
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

  // Subdomínio válido: injetar headers e rewrite para rota /storefront
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-tenant-id", tenant.tenantId);
  requestHeaders.set("x-tenant-slug", tenant.tenantSlug);
  requestHeaders.set("x-academia-slug", tenant.academiaSlug);
  requestHeaders.set("x-storefront-subdomain", subdomain);

  const { pathname } = request.nextUrl;

  // Rotas já internas (/storefront, /storefront-not-found) não precisam de rewrite
  if (pathname.startsWith("/storefront")) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Rewrite qualquer rota pública do subdomain para /storefront
  const url = request.nextUrl.clone();
  url.pathname = `/storefront${pathname === "/" ? "" : pathname}`;
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
