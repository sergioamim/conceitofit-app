import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Tenant } from "@/lib/types";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";

  if (!tenantId || !subdomain) return [];

  const baseUrl = `https://${subdomain}.conceitofit.com.br`;
  const entries: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  try {
    const unidades = await serverFetch<Tenant[]>(
      "/api/v1/publico/storefront/unidades",
      { query: { tenantId }, next: { revalidate: 3600 } },
    );

    if (Array.isArray(unidades)) {
      for (const u of unidades) {
        entries.push({
          url: `${baseUrl}/unidade/${u.id}`,
          lastModified: new Date(),
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    }
  } catch {
    // Can't fetch units — return home-only sitemap
  }

  return entries;
}
