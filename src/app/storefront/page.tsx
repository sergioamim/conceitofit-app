import { headers } from "next/headers";
import { serverFetch, ServerFetchRequestError } from "@/lib/shared/server-fetch";
import type { Plano, StorefrontTheme, Tenant } from "@/lib/types";
import { StorefrontHero } from "@/components/storefront/storefront-hero";
import { StorefrontJsonLd } from "@/components/storefront/storefront-jsonld";
import { StorefrontPlanos } from "@/components/storefront/storefront-planos";
import { StorefrontUnidades } from "@/components/storefront/storefront-unidades";
import type { Metadata } from "next";

interface StorefrontData {
  tenantId: string;
  tenantSlug: string;
  theme: StorefrontTheme | null;
  unidades: Tenant[];
  planos: Plano[];
}

async function fetchStorefrontData(): Promise<StorefrontData> {
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "";

  let theme: StorefrontTheme | null = null;
  let unidades: Tenant[] = [];
  let planos: Plano[] = [];

  if (!tenantId) {
    return { tenantId, tenantSlug, theme, unidades, planos };
  }

  const results = await Promise.allSettled([
    serverFetch<StorefrontTheme>("/api/v1/publico/storefront/theme", {
      query: { tenantId },
      next: { revalidate: 300 },
    }),
    serverFetch<Tenant[]>("/api/v1/publico/storefront/unidades", {
      query: { tenantId },
      next: { revalidate: 300 },
    }),
    serverFetch<Plano[]>("/api/v1/publico/storefront/planos", {
      query: { tenantId },
      next: { revalidate: 300 },
    }),
  ]);

  if (results[0].status === "fulfilled") theme = results[0].value;
  if (results[1].status === "fulfilled") {
    const raw = results[1].value;
    unidades = Array.isArray(raw) ? raw : [];
  }
  if (results[2].status === "fulfilled") {
    const raw = results[2].value;
    planos = (Array.isArray(raw) ? raw : []).filter((p) => p.ativo);
  }

  return { tenantId, tenantSlug, theme, unidades, planos };
}

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";
  const subdomain = hdrs.get("x-storefront-subdomain") ?? "";
  const tenantId = hdrs.get("x-tenant-id") ?? "";

  let ogImage: string | undefined;
  if (tenantId) {
    try {
      const theme = await serverFetch<StorefrontTheme>("/api/v1/publico/storefront/theme", {
        query: { tenantId },
        next: { revalidate: 300 },
      });
      ogImage = theme?.heroImageUrl ?? theme?.logoUrl ?? undefined;
    } catch {
      // fallback
    }
  }

  const title = `${tenantSlug} — Conheça nossos planos`;
  const description = `Confira os planos e unidades disponíveis em ${tenantSlug}. Escolha o plano ideal e comece sua jornada fitness.`;

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
