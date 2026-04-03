import Image from "next/image";
import type { ReactNode } from "react";
import { StorefrontThemeProvider } from "@/components/storefront/storefront-theme-provider";
import { getStorefrontThemeBySlug } from "@/lib/public/storefront-api";
import { logger } from "@/lib/shared/logger";
import type { StorefrontTheme } from "@/lib/types";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ academiaSlug: string }>;
}

async function resolveTheme(academiaSlug: string): Promise<{ theme: StorefrontTheme | null; tenantSlug: string }> {
  try {
    const raw = await getStorefrontThemeBySlug(academiaSlug);
    const theme: StorefrontTheme = {
      id: raw.id,
      tenantId: "",
      logoUrl: raw.logoUrl ?? undefined,
      faviconUrl: raw.faviconUrl ?? undefined,
      heroImageUrl: raw.bannerUrl ?? undefined,
      heroTitle: raw.titulo ?? undefined,
      heroSubtitle: raw.subtitulo ?? undefined,
      socialLinks: raw.redesSociais
        ? {
            instagram: raw.redesSociais.instagram,
            facebook: raw.redesSociais.facebook,
            whatsapp: raw.redesSociais.whatsapp,
          }
        : undefined,
      updatedAt: raw.dataAtualizacao,
    };
    return { theme, tenantSlug: academiaSlug };
  } catch (error) {
    logger.warn("[Storefront/Layout] Theme fetch failed", { error, academiaSlug });
    return { theme: null, tenantSlug: academiaSlug };
  }
}

export default async function AcademiaStorefrontLayout({ children, params }: LayoutProps) {
  const { academiaSlug } = await params;
  const { theme, tenantSlug } = await resolveTheme(academiaSlug);

  return (
    <StorefrontThemeProvider theme={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
            <a href={`/storefront/${academiaSlug}`} className="flex items-center gap-3">
              {theme?.logoUrl ? (
                <img src={theme.logoUrl} alt={tenantSlug} className="h-8 w-auto object-contain" />
              ) : (
                <span className="font-display text-lg font-bold text-gym-accent">
                  {tenantSlug}
                </span>
              )}
            </a>
            <nav className="flex items-center gap-4 text-sm">
              <a href={`/storefront/${academiaSlug}#planos`} className="text-muted-foreground transition-colors hover:text-foreground">
                Planos
              </a>
              <a href={`/storefront/${academiaSlug}#unidades`} className="text-muted-foreground transition-colors hover:text-foreground">
                Unidades
              </a>
              <a href="#contato" className="text-muted-foreground transition-colors hover:text-foreground">
                Contato
              </a>
            </nav>
          </div>
        </header>

        {children}

        <footer id="contato" className="border-t border-border/60 bg-surface">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div>
                {theme?.logoUrl ? (
                  <Image src={theme.logoUrl} alt={tenantSlug} width={120} height={32} unoptimized className="mb-3 h-8 w-auto object-contain" />
                ) : (
                  <p className="mb-3 font-display text-lg font-bold text-gym-accent">{tenantSlug}</p>
                )}
              </div>
              {theme?.socialLinks && (
                <div className="flex gap-4 text-sm">
                  {theme.socialLinks.instagram && (
                    <a href={`https://instagram.com/${theme.socialLinks.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Instagram</a>
                  )}
                  {theme.socialLinks.facebook && (
                    <a href={theme.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">Facebook</a>
                  )}
                  {theme.socialLinks.whatsapp && (
                    <a href={`https://wa.me/${theme.socialLinks.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">WhatsApp</a>
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
