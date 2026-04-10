import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/b2b", "/adesao", "/storefront"],
        disallow: [
          "/api/",
          "/admin/",
          "/dashboard",
          "/login",
          "/acesso/",
          "/_next/",
        ],
      },
    ],
    sitemap: "https://conceito.fit/sitemap.xml",
    host: "https://conceito.fit",
  };
}
