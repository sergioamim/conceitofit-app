import { headers } from "next/headers";
import { resolveTenantTheme, TENANT_THEME_PRESETS, DEFAULT_THEME_PRESET } from "@/lib/tenant/tenant-theme";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Academia, Tenant } from "@/lib/types";

/**
 * Este componente resolve o tenant atual via SSR e injeta as variáveis CSS
 * diretamente no <head>, evitando o "flash" do tema padrão.
 */
export async function CriticalThemeServer() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  
  // Extrair o subdomínio do host (ex: academia1.conceito.fit -> academia1)
  // Nota: Isso é uma heurística. No seu sistema real, você pode ter uma lógica
  // mais robusta de resolução de domínio -> tenantId.
  const subdomain = host.split(".")[0];
  
  let academia: Academia | undefined;

  try {
    // Tenta buscar os dados básicos de branding do tenant via API (com cache curto)
    // Se falhar ou demorar, caímos no preset padrão.
    const tenantRes = await serverFetch<Tenant>(`/api/v1/tenants/by-domain/${subdomain}`, {
      next: { revalidate: 300 } // cache de 5 min
    });

    if (tenantRes && tenantRes.academiaId) {
      const academiaRes = await serverFetch<Academia>(`/api/v1/academias/${tenantRes.academiaId}`, {
        next: { revalidate: 300 }
      });
      academia = academiaRes;
    }
  } catch (e) {
    // Silently fail - o Tema Padrão (Conceito Dark) será usado como fallback
  }

  const theme = resolveTenantTheme(academia);

  // Gerar o CSS inline
  const cssVars = `
    :root {
      --primary: ${theme.primary};
      --ring: ${theme.ring};
      --secondary: ${theme.secondary};
      --background: ${theme.background};
      --card: ${theme.surface};
      --popover: ${theme.surface};
      --muted: ${theme.secondary};
      --accent: ${theme.secondary};
      --input: ${theme.secondary};
      --border: ${theme.border};
      --foreground: ${theme.foreground};
      --card-foreground: ${theme.foreground};
      --popover-foreground: ${theme.foreground};
      --secondary-foreground: ${theme.foreground};
      --muted-foreground: ${theme.mutedForeground};
      --destructive: ${theme.danger};
      --sidebar: ${theme.surface};
      --sidebar-border: ${theme.border};
      --sidebar-ring: ${theme.ring};
      --sidebar-foreground: ${theme.foreground};
      --sidebar-primary: ${theme.primary};
      --sidebar-primary-foreground: ${theme.background};
      --sidebar-accent: ${theme.secondary};
      --sidebar-accent-foreground: ${theme.foreground};
      --gym-accent: ${theme.accent};
      --gym-danger: ${theme.danger};
      --gym-warning: ${theme.warning};
      --gym-teal: ${theme.teal};
      --surface: ${theme.surface};
      --surface-2: ${theme.secondary};
    }
  `.replace(/\s+/g, " ");

  return <style id="critical-tenant-theme" dangerouslySetInnerHTML={{ __html: cssVars }} />;
}
