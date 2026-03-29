import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getStorefrontSitemap } from "@/lib/public/storefront-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "";
  const academiaSlug = hdrs.get("x-academia-slug") ?? tenantSlug;
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";

  if (!academiaSlug || !subdomain) return [];

  try {
    // Endpoint com slug: GET /api/v1/publico/storefront/{academiaSlug}/sitemap
    const entries = await getStorefrontSitemap(academiaSlug);

    return entries.map((entry) => ({
      url: entry.url,
      lastModified: entry.lastModified ? new Date(entry.lastModified) : new Date(),
      changeFrequency: (entry.changeFrequency as MetadataRoute.Sitemap[number]["changeFrequency"]) ?? "weekly",
      priority: entry.priority ? parseFloat(entry.priority) : 0.7,
    }));
  } catch {
    // Fallback: return home-only sitemap
    const baseUrl = `https://${subdomain}.conceitofit.com.br`;
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 1,
      },
    ];
  }
}
