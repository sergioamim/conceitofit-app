import { headers } from "next/headers";

/**
 * Resolve os headers do storefront com fallback para dev local.
 * Em produção, o proxy/middleware injeta x-tenant-id e x-tenant-slug.
 * Em dev (localhost sem subdomínio), usa env vars como fallback:
 * - STOREFRONT_DEV_TENANT_ID  (ex: bb000000-0000-0000-0000-000000000001)
 * - STOREFRONT_DEV_ACADEMIA_SLUG (ex: demo)
 */
export async function resolveStorefrontHeaders(urlTenantId?: string) {
  const hdrs = await headers();
  const devTenantId = process.env.STOREFRONT_DEV_TENANT_ID ?? "";
  const devSlug = process.env.STOREFRONT_DEV_ACADEMIA_SLUG ?? "";

  const tenantId = hdrs.get("x-tenant-id") || urlTenantId || devTenantId;
  const tenantSlug = hdrs.get("x-tenant-slug") || devSlug;
  const academiaSlug = hdrs.get("x-academia-slug") || tenantSlug || devSlug;
  const subdomain = hdrs.get("x-storefront-subdomain") || "";

  return { tenantId, tenantSlug, academiaSlug, subdomain };
}
