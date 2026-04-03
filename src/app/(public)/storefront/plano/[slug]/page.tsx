import { notFound, redirect } from "next/navigation";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Plano } from "@/lib/types";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function resolvePlano(slug: string, tenantId: string): Promise<Plano | null> {
  try {
    return await serverFetch<Plano>(
      `/api/v1/publico/adesao/plano/${encodeURIComponent(slug)}`,
      { query: { tenantId }, next: { revalidate: 60 } },
    );
  } catch (error) {
    logger.warn("[Storefront/Plano] Failed to resolve plano", { error });
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { resolveStorefrontHeaders } = await import("../../resolve-storefront-headers");
  const { tenantId, tenantSlug: rawSlug } = await resolveStorefrontHeaders();
  const tenantSlug = rawSlug || "Academia";

  let planoNome = slug.replace(/-/g, " ");
  if (tenantId) {
    const plano = await resolvePlano(slug, tenantId);
    if (plano) planoNome = plano.nome;
  }

  return {
    title: `${planoNome} — ${tenantSlug}`,
    description: `Assine o plano ${planoNome} na ${tenantSlug}. Matricula online rapida e segura.`,
  };
}

export default async function PlanoSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const { resolveStorefrontHeaders } = await import("../../resolve-storefront-headers");
  const { tenantId } = await resolveStorefrontHeaders();

  if (!tenantId) return notFound();

  const plano = await resolvePlano(slug, tenantId);

  if (!plano) return notFound();

  // Redirect to the signup flow with tenant + plan pre-selected
  redirect(
    `/storefront/adesao/cadastro?tenant=${tenantId}&plan=${plano.id}`,
  );
}
