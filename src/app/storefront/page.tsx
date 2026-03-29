import { headers } from "next/headers";
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
import type { Metadata } from "next";

interface StorefrontData {
  tenantId: string;
  tenantSlug: string;
  academiaSlug: string;
  theme: StorefrontTheme | null;
  unidades: Tenant[];
  planos: Plano[];
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

async function fetchStorefrontData(): Promise<StorefrontData> {
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "";
  const academiaSlug = hdrs.get("x-academia-slug") ?? tenantSlug;

  if (!academiaSlug) {
    return { tenantId, tenantSlug, academiaSlug, theme: null, unidades: [], planos: [] };
  }

  try {
    // Endpoint com slug no path: GET /api/v1/publico/storefront/{academiaSlug}
    const overview = await getStorefrontOverview(academiaSlug);
    const theme = overviewToTheme(overview, tenantId);
    const unidades = overviewToUnidades(overview);

    // Planos vêm das unidades no overview (flatten)
    const planos: Plano[] = [];
    // Se o overview não traz planos, eles virão via componente separado

    return { tenantId, tenantSlug, academiaSlug, theme, unidades, planos };
  } catch {
    return { tenantId, tenantSlug, academiaSlug, theme: null, unidades: [], planos: [] };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";
  const academiaSlug = hdrs.get("x-academia-slug") ?? tenantSlug;
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";

  let title = `${tenantSlug} — Conheça nossos planos`;
  let description = `Confira os planos e unidades disponíveis em ${tenantSlug}.`;
  let ogImage: string | undefined;

  if (academiaSlug) {
    try {
      const seo = await getStorefrontSeo(academiaSlug);
      if (seo.title) title = seo.title;
      if (seo.description) description = seo.description;
      if (seo.ogImage) ogImage = seo.ogImage;
    } catch {
      // fallback to defaults
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: tenantSlug,
      type: "website",
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630, alt: tenantSlug }] } : {}),
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      ...(ogImage ? { images: [ogImage] } : {}),
    },
    robots: { index: true, follow: true },
    ...(subdomain ? { alternates: { canonical: "/" } } : {}),
  };
}

export default async function StorefrontHomePage() {
  const data = await fetchStorefrontData();

  if (!data.tenantId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Não foi possível identificar a academia.</p>
      </div>
    );
  }

  const singleUnit = data.unidades.length === 1 ? data.unidades[0] : null;

  return (
    <main>
      <StorefrontJsonLd
        tenantSlug={data.tenantSlug}
        theme={data.theme}
        unidades={data.unidades}
        planos={data.planos}
      />

      {/* Hero */}
      <StorefrontHero theme={data.theme} tenantSlug={data.tenantSlug} />

      {/* Planos */}
      {data.planos.length > 0 && (
        <section id="planos" className="py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 text-center font-display text-2xl font-bold">Nossos Planos</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              Escolha o plano ideal para você
            </p>
            <StorefrontPlanos planos={data.planos} singleUnit={singleUnit} />
          </div>
        </section>
      )}

      {/* Unidades */}
      {data.unidades.length > 1 && (
        <section id="unidades" className="border-t border-border/60 py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="mb-2 text-center font-display text-2xl font-bold">Nossas Unidades</h2>
            <p className="mb-10 text-center text-sm text-muted-foreground">
              Encontre a unidade mais próxima de você
            </p>
            <StorefrontUnidades unidades={data.unidades} />
          </div>
        </section>
      )}

      {/* Single unit details */}
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
                href={`/storefront/unidade/${singleUnit.id}`}
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
