import Image from "next/image";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { serverFetch } from "@/lib/shared/server-fetch";
import { StorefrontThemeProvider } from "@/components/storefront/storefront-theme-provider";
import type { StorefrontTheme } from "@/lib/types";

async function resolveStorefrontContext() {
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "";
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";

  let theme: StorefrontTheme | null = null;
  if (tenantId) {
    try {
      theme = await serverFetch<StorefrontTheme>(
        "/api/v1/publico/storefront/theme",
        { query: { tenantId }, next: { revalidate: 300 } },
      );
    } catch {
      // Theme not configured — will use defaults
    }
  }

  return { tenantId, tenantSlug, subdomain, theme };
}

export default async function StorefrontLayout({ children }: { children: ReactNode }) {
  const ctx = await resolveStorefrontContext();

  return (
    <StorefrontThemeProvider theme={ctx.theme}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {ctx.theme?.logoUrl ? (
                <img
                  src={ctx.theme.logoUrl}
                  alt={ctx.tenantSlug}
                  className="h-8 w-auto object-contain"
                />
              ) : (
                <span className="font-display text-lg font-bold text-gym-accent">
                  {ctx.tenantSlug || "Academia"}
                </span>
              )}
            </div>
            <nav className="flex items-center gap-4 text-sm">
              <a href="/storefront#planos" className="text-muted-foreground transition-colors hover:text-foreground">
                Planos
              </a>
              <a href="/storefront#unidades" className="text-muted-foreground transition-colors hover:text-foreground">
                Unidades
              </a>
              <a href="/storefront/experimental" className="text-muted-foreground transition-colors hover:text-foreground">
                Aula experimental
              </a>
              <a href="#contato" className="text-muted-foreground transition-colors hover:text-foreground">
                Contato
              </a>
            </nav>
          </div>
        </header>

        {children}

        {/* Footer */}
        <footer id="contato" className="border-t border-border/60 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                {ctx.theme?.logoUrl ? (
                  <Image src={ctx.theme.logoUrl} alt={ctx.tenantSlug || "Logo"} width={120} height={32} unoptimized className="mb-3 h-8 w-auto object-contain" />
                ) : (
                  <p className="mb-3 font-display text-lg font-bold text-gym-accent">
                    {ctx.tenantSlug || "Academia"}
                  </p>
                )}
                {ctx.theme?.footerText && (
                  <p className="max-w-md text-sm text-muted-foreground">{ctx.theme.footerText}</p>
                )}
              </div>

              {ctx.theme?.socialLinks && (
                <div className="flex gap-4 text-sm">
                  {ctx.theme.socialLinks.instagram && (
                    <a
                      href={`https://instagram.com/${ctx.theme.socialLinks.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Instagram
                    </a>
                  )}
                  {ctx.theme.socialLinks.facebook && (
                    <a
                      href={ctx.theme.socialLinks.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Facebook
                    </a>
                  )}
                  {ctx.theme.socialLinks.whatsapp && (
                    <a
                      href={`https://wa.me/${ctx.theme.socialLinks.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </footer>
      </div>
    </StorefrontThemeProvider>
  );
}
