import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { resolveTenantTheme } from '@/lib/tenant/tenant-theme';
import { serverFetch } from '@/lib/shared/server-fetch';
import type { Academia, Tenant } from '@/lib/types';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  
  let academia: Academia | undefined;
  let appName = "Conceito.fit";

  try {
    const tenantRes = await serverFetch<Tenant>("/api/v1/tenants/by-domain", {
      query: { domain: host },
      next: { revalidate: 3600 } 
    });

    if (tenantRes && tenantRes.academiaId) {
      const academiaRes = await serverFetch<Academia>(`/api/v1/academias/${tenantRes.academiaId}`, {
        next: { revalidate: 3600 }
      });
      academia = academiaRes;
      appName = academia.branding?.appName || academia.nome || appName;
    }
  } catch (e) {
    // Fallback to defaults
  }

  const theme = resolveTenantTheme(academia);

  return {
    name: appName,
    short_name: appName,
    description: `Portal do Aluno - ${appName}`,
    start_url: '/check-in',
    display: 'standalone',
    background_color: theme.background,
    theme_color: theme.primary,
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
