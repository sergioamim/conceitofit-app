import type { Plano, StorefrontTheme, Tenant } from "@/lib/types";

function formatBRL(value: number): string {
  return value.toFixed(2);
}

interface StorefrontJsonLdProps {
  tenantSlug: string;
  theme: StorefrontTheme | null;
  unidades: Tenant[];
  planos: Plano[];
}

function buildOrganizationLd(slug: string, theme: StorefrontTheme | null) {
  const ld: Record<string, unknown> = {
    "@type": "SportsActivityLocation",
    name: slug,
    "@id": "#organization",
  };
  if (theme?.logoUrl) ld.logo = theme.logoUrl;
  if (theme?.heroImageUrl) ld.image = theme.heroImageUrl;
  if (theme?.socialLinks) {
    const links: string[] = [];
    if (theme.socialLinks.instagram) {
      links.push(`https://instagram.com/${theme.socialLinks.instagram.replace("@", "")}`);
    }
    if (theme.socialLinks.facebook) links.push(theme.socialLinks.facebook);
    if (links.length) ld.sameAs = links;
  }
  return ld;
}

function buildLocationLd(unidade: Tenant) {
  const ld: Record<string, unknown> = {
    "@type": "SportsActivityLocation",
    name: unidade.nome,
  };
  if (unidade.telefone) ld.telephone = unidade.telefone;
  if (unidade.endereco) {
    ld.address = {
      "@type": "PostalAddress",
      streetAddress: [unidade.endereco.logradouro, unidade.endereco.numero ? `nº ${unidade.endereco.numero}` : null]
        .filter(Boolean)
        .join(", "),
      addressLocality: unidade.endereco.cidade,
      addressRegion: unidade.endereco.estado,
      postalCode: unidade.endereco.cep,
      addressCountry: "BR",
    };
  }
  return ld;
}

function buildOffersLd(planos: Plano[]) {
  return planos.map((p) => ({
    "@type": "Offer",
    name: p.nome,
    description: p.descricao,
    price: formatBRL(p.valor),
    priceCurrency: "BRL",
    availability: "https://schema.org/InStock",
  }));
}

export function StorefrontJsonLd({ tenantSlug, theme, unidades, planos }: StorefrontJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    ...buildOrganizationLd(tenantSlug, theme),
    ...(unidades.length === 1 ? buildLocationLd(unidades[0]) : {}),
    ...(unidades.length > 1
      ? { department: unidades.map((u) => buildLocationLd(u)) }
      : {}),
    ...(planos.length > 0 ? { makesOffer: buildOffersLd(planos) } : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
