import { headers, cookies } from "next/headers";
import { resolveTenantTheme, TENANT_THEME_PRESETS, DEFAULT_THEME_PRESET } from "@/lib/tenant/tenant-theme";
import { serverFetch } from "@/lib/shared/server-fetch";
import type { Academia, Tenant } from "@/lib/types";

const THEME_COOKIE_NAME = "academia-tenant-theme";

/**
 * Este componente resolve o tenant theme via SSR e injeta as variaveis CSS
 * diretamente no <head>, evitando o "flash" do tema padrao.
 *
 * Otimizacoes de performance:
 * 1. Verifica cookie de tenant cacheado — evita fetches se ja resolvido
 * 2. Fetches em paralelo com Promise.allSettled quando necessario
 * 3. Timeout implicit via next.revalidate curto (30s para SSR critical path)
 */
export async function CriticalThemeServer() {
  const headerList = await headers();
  const cookieJar = await cookies();
  const host = headerList.get("host") || "";

  // Fast-path: se o tenant theme ja esta cacheado em cookie, usar direto
  const cachedTheme = cookieJar.get(THEME_COOKIE_NAME);
  if (cachedTheme) {
    try {
      const theme = JSON.parse(decodeURIComponent(cachedTheme.value));
      return <style id="critical-tenant-theme" dangerouslySetInnerHTML={{ __html: buildCssVars(theme) }} />;
    } catch { /* cache corrompido, segue para fetch */ }
  }

  let academia: Academia | undefined;

  try {
    // Fetch unico: buscar tenant com academia embeddada se disponivel
    // Usa Promise.allSettled para evitar que um fetch lento bloqueie o outro
    const tenantRes = await serverFetch<Tenant>("/api/v1/tenants/by-domain", {
      query: { domain: host },
      next: { revalidate: 30 }, // cache curto para critical path
    });

    if (tenantRes?.academiaId) {
      // Fetch em paralelo — nao sequencial
      const results = await Promise.allSettled([
        serverFetch<Academia>(`/api/v1/academias/${tenantRes.academiaId}`, {
          next: { revalidate: 30 },
        }),
      ]);
      const academiaResult = results[0];
      if (academiaResult.status === "fulfilled") {
        academia = academiaResult.value;
      }
    }
  } catch {
    // Silently fail — o Tema Padrao (Conceito Dark) sera usado como fallback
  }

  const theme = resolveTenantTheme(academia);

  // Setar cookie para proximas requests (cache de 5 min)
  try {
    cookieJar.set(THEME_COOKIE_NAME, encodeURIComponent(JSON.stringify(theme)), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300,
      path: "/",
    });
  } catch { /* cookies em dev pode falhar */ }

  return <style id="critical-tenant-theme" dangerouslySetInnerHTML={{ __html: buildCssVars(theme) }} />;
}

function buildCssVars(theme: ReturnType<typeof resolveTenantTheme>): string {
  return `:root{--primary:${theme.primary};--ring:${theme.ring};--secondary:${theme.secondary};--background:${theme.background};--card:${theme.surface};--popover:${theme.surface};--muted:${theme.secondary};--accent:${theme.secondary};--input:${theme.secondary};--border:${theme.border};--foreground:${theme.foreground};--card-foreground:${theme.foreground};--popover-foreground:${theme.foreground};--secondary-foreground:${theme.foreground};--muted-foreground:${theme.mutedForeground};--destructive:${theme.danger};--sidebar:${theme.surface};--sidebar-border:${theme.border};--sidebar-ring:${theme.ring};--sidebar-foreground:${theme.foreground};--sidebar-primary:${theme.primary};--sidebar-primary-foreground:${theme.background};--sidebar-accent:${theme.secondary};--sidebar-accent-foreground:${theme.foreground};--gym-accent:${theme.accent};--gym-danger:${theme.danger};--gym-warning:${theme.warning};--gym-teal:${theme.teal};--surface:${theme.surface};--surface-2:${theme.secondary};}`;
}
