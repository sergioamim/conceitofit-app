import { notFound } from "next/navigation";
import type { Plano, StorefrontTheme, Tenant } from "@/lib/types";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { StorefrontJsonLd } from "@/components/storefront/storefront-jsonld";
import { StorefrontPlanos } from "@/components/storefront/storefront-planos";
import { StorefrontUnidades } from "@/components/storefront/storefront-unidades";
import {
  getStorefrontOverview,
  getStorefrontSeo,
  type StorefrontOverviewResponse,
} from "@/lib/public/storefront-api";
import { logger } from "@/lib/shared/logger";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ academiaSlug: string }>;
}

function overviewToTheme(overview: StorefrontOverviewResponse, tenantId: string): StorefrontTheme | null {
  const t = overview.storefrontTheme;
  if (!t) return null;
  return {
    id: t.id,
    tenantId,
    logoUrl: t.logoUrl ?? undefined,
    faviconUrl: t.faviconUrl ?? undefined,
    heroImageUrl: t.bannerUrl ?? undefined,
    heroTitle: t.titulo ?? undefined,
    heroSubtitle: t.subtitulo ?? undefined,
    socialLinks: t.redesSociais
      ? {
          instagram: t.redesSociais.instagram,
          facebook: t.redesSociais.facebook,
          whatsapp: t.redesSociais.whatsapp,
        }
      : undefined,
    updatedAt: t.dataAtualizacao,
  };
}

function overviewToUnidades(overview: StorefrontOverviewResponse): Tenant[] {
  return overview.unidades.map((u) => ({
    id: u.tenantId,
    nome: u.nome,
    telefone: u.telefone,
    endereco: u.endereco,
    ativo: true,
  })) as Tenant[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { academiaSlug } = await params;
  let title = `${academiaSlug} — Conheça nossos planos`;
  let description = `Confira os planos e unidades disponíveis.`;
  let ogImage: string | undefined;

  try {
    const seo = await getStorefrontSeo(academiaSlug);
    if (seo.title) title = seo.title;
    if (seo.description) description = seo.description;
    if (seo.ogImage) ogImage = seo.ogImage;
  } catch {
    // fallback ao título genérico
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function AcademiaStorefrontPage({ params }: PageProps) {
  const { academiaSlug } = await params;

  let overview: StorefrontOverviewResponse;
  try {
    overview = await getStorefrontOverview(academiaSlug);
  } catch (error) {
    logger.warn("[Storefront] Overview fetch failed", { error, academiaSlug });
    return notFound();
  }

  const theme = overviewToTheme(overview, overview.academiaId);
  const unidades = overviewToUnidades(overview);
  const planos: Plano[] = [];
  const singleUnit = unidades.length === 1 ? unidades[0] : null;

  return (
    <main>
      <StorefrontJsonLd
        tenantSlug={overview.academiaSlug}
        theme={theme}
        unidades={unidades}
        planos={planos}
      />

      <StorefrontHero theme={theme} tenantSlug={overview.nome} />

      {planos.length > 0 && (
        <section id="planos" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 text-center font-display text-2xl font-bold">Nossos Planos</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              Escolha o plano ideal para você
            </p>
            <StorefrontPlanos planos={planos} singleUnit={singleUnit} />
          </div>
        </section>
      )}

      {unidades.length > 1 && (
        <section id="unidades" className="border-t border-border/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 text-center font-display text-2xl font-bold">Nossas Unidades</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              Encontre a unidade mais próxima de você
            </p>
            <StorefrontUnidades unidades={unidades} academiaSlug={academiaSlug} />
          </div>
        </section>
      )}

      {singleUnit && (
        <section id="unidades" className="border-t border-border/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-6 text-center font-display text-2xl font-bold">Nossa Unidade</h2>
            <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-6 text-center">
              <p className="text-lg font-semibold">{singleUnit.nome}</p>
              {singleUnit.endereco && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {[singleUnit.endereco.logradouro, singleUnit.endereco.bairro, singleUnit.endereco.cidade]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
              {singleUnit.telefone && (
                <p className="mt-1 text-sm text-muted-foreground">{singleUnit.telefone}</p>
              )}
              <a
                href={`/storefront/${academiaSlug}/unidades/${singleUnit.id}`}
                className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-gym-accent hover:underline"
              >
                Ver detalhes, horarios e mapa &rarr;
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
