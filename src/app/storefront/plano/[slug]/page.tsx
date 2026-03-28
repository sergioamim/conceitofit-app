import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { serverFetch } from "@/lib/shared/server-fetch";
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
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";
  const tenantId = hdrs.get("x-tenant-id") ?? "";

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
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";

  if (!tenantId) return notFound();

  const plano = await resolvePlano(slug, tenantId);

  if (!plano) return notFound();

  // Redirect to the signup flow with tenant + plan pre-selected
  redirect(
    `/storefront/adesao/cadastro?tenant=${tenantId}&plan=${plano.id}`,
  );
}
