import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ExperimentalForm } from "./experimental-form";

export async function generateMetadata(): Promise<Metadata> {
  const hdrs = await headers();
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";
  return {
    title: `Aula Experimental Gratis — ${tenantSlug}`,
    description: `Agende sua aula experimental gratis na ${tenantSlug}. Sem compromisso.`,
  };
}

export default async function ExperimentalPage() {
  const hdrs = await headers();
  const tenantId = hdrs.get("x-tenant-id") ?? "";
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";

  if (!tenantId) return notFound();

  return (
    <main className="py-16">
      <div className="mx-auto max-w-lg px-6">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold">
            Aula experimental <span className="text-gym-accent">gratis</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Venha conhecer a {tenantSlug}. Preencha seus dados e entraremos em contato
            para agendar sua aula.
          </p>
        </div>
        <ExperimentalForm tenantId={tenantId} />
      </div>
    </main>
  );
}
