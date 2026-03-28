import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const hdrs = await headers();
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";
  const baseUrl = subdomain
    ? `https://${subdomain}.conceitofit.com.br`
    : "https://conceitofit.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/dashboard", "/login", "/acesso"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
