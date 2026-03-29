import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin, Phone, Clock, ChevronLeft, Dumbbell } from "lucide-react";
import { serverFetch } from "@/lib/shared/server-fetch";
import { logger } from "@/lib/shared/logger";
import type { Plano, Tenant } from "@/lib/types";
import type { Metadata } from "next";
import { formatBRL } from "@/lib/formatters";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UnidadeDetalhe extends Tenant {
  whatsapp?: string;
  latitude?: number;
  longitude?: number;
  fotosUrls?: string[];
  horarioFuncionamento?: Record<string, { abre: string; fecha: string } | null>;
  descricaoPublica?: string;
}

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function fetchUnidade(tenantId: string, storefrontTenantId: string) {
  const [unidadeResult, planosResult] = await Promise.allSettled([
    serverFetch<UnidadeDetalhe>(
      `/api/v1/publico/storefront/unidades/${tenantId}`,
      { query: { tenantId: storefrontTenantId }, next: { revalidate: 60 } },
    ),
    serverFetch<Plano[]>(
      "/api/v1/publico/storefront/planos",
      { query: { tenantId }, next: { revalidate: 60 } },
    ),
  ]);

  const unidade = unidadeResult.status === "fulfilled" ? unidadeResult.value : null;
  const planos =
    planosResult.status === "fulfilled"
      ? (Array.isArray(planosResult.value) ? planosResult.value : []).filter((p) => p.ativo)
      : [];

  return { unidade, planos };
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tenantId } = await params;
  const hdrs = await headers();
  const storefrontTenantId = hdrs.get("x-tenant-id") ?? "";
  const tenantSlug = hdrs.get("x-tenant-slug") ?? "Academia";

  let unidadeNome = "Unidade";
  try {
    const u = await serverFetch<UnidadeDetalhe>(
      `/api/v1/publico/storefront/unidades/${tenantId}`,
      { query: { tenantId: storefrontTenantId }, next: { revalidate: 300 } },
    );
    if (u?.nome) unidadeNome = u.nome;
  } catch (error) {
    logger.warn("[Storefront/Unidade] Metadata fetch failed", { error });
  }

  const title = `${unidadeNome} — ${tenantSlug}`;
  const description = `Conheça os planos e horários da unidade ${unidadeNome}. Matricule-se agora em ${tenantSlug}.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: tenantSlug,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDuracao(dias: number): string {
  if (dias === 30 || dias === 31) return "/mes";
  if (dias === 90) return "/trimestre";
  if (dias === 180) return "/semestre";
  if (dias === 365 || dias === 360) return "/ano";
  return `/${dias} dias`;
}

const DIAS_SEMANA: Record<string, string> = {
  SEGUNDA: "Segunda",
  TERCA: "Terca",
  QUARTA: "Quarta",
  QUINTA: "Quinta",
  SEXTA: "Sexta",
  SABADO: "Sabado",
  DOMINGO: "Domingo",
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function UnidadePage({ params }: PageProps) {
  const { tenantId } = await params;
  const hdrs = await headers();
  const storefrontTenantId = hdrs.get("x-tenant-id") ?? "";

  if (!storefrontTenantId) return notFound();

  const { unidade, planos } = await fetchUnidade(tenantId, storefrontTenantId);

  if (!unidade) return notFound();

  const endereco = unidade.endereco;
  const enderecoText = endereco
    ? [
        endereco.logradouro,
        endereco.numero ? `n ${endereco.numero}` : null,
        endereco.bairro,
        endereco.cidade,
        endereco.estado,
      ]
        .filter(Boolean)
        .join(", ")
    : null;

  const hasMap = unidade.latitude && unidade.longitude;
  const mapQuery = hasMap
    ? `${unidade.latitude},${unidade.longitude}`
    : enderecoText
      ? encodeURIComponent(enderecoText)
      : null;

  const sortedPlanos = [...planos].sort((a, b) => {
    if (a.destaque && !b.destaque) return -1;
    if (!a.destaque && b.destaque) return 1;
    return (a.ordem ?? 999) - (b.ordem ?? 999);
  });

  return (
    <main className="pb-16">
      {/* Back link */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <Link
          href="/storefront"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      {/* Header da unidade */}
      <section className="mx-auto max-w-6xl px-6 pt-6">
        <h1 className="font-display text-3xl font-bold">{unidade.nome}</h1>

        {unidade.descricaoPublica && (
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {unidade.descricaoPublica}
          </p>
        )}

        {/* Info pills */}
        <div className="mt-6 flex flex-wrap gap-4">
          {enderecoText && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-gym-accent" />
              {enderecoText}
            </div>
          )}
          {(unidade.telefone || unidade.whatsapp) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0 text-gym-accent" />
              {unidade.whatsapp ?? unidade.telefone}
            </div>
          )}
        </div>
      </section>

      {/* Fotos */}
      {unidade.fotosUrls && unidade.fotosUrls.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl px-6">
          <div className="flex gap-3 overflow-x-auto pb-2">
            {unidade.fotosUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`${unidade.nome} foto ${i + 1}`}
                className="h-48 w-72 shrink-0 rounded-xl object-cover"
                loading="lazy"
              />
            ))}
          </div>
        </section>
      )}

      {/* Mapa */}
      {mapQuery && (
        <section className="mx-auto mt-8 max-w-6xl px-6">
          <div className="overflow-hidden rounded-xl border border-border">
            <iframe
              title={`Mapa - ${unidade.nome}`}
              src={`https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`}
              className="h-64 w-full sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Horario de funcionamento */}
      {unidade.horarioFuncionamento && Object.keys(unidade.horarioFuncionamento).length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-xl font-bold">
            <Clock className="h-5 w-5 text-gym-accent" />
            Horario de funcionamento
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(unidade.horarioFuncionamento).map(([dia, horario]) => (
              <div
                key={dia}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5"
              >
                <span className="text-sm font-medium">
                  {DIAS_SEMANA[dia.toUpperCase()] ?? dia}
                </span>
                <span className="text-sm text-muted-foreground">
                  {horario ? `${horario.abre} - ${horario.fecha}` : "Fechado"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Planos */}
      {sortedPlanos.length > 0 && (
        <section className="mx-auto mt-10 max-w-6xl px-6">
          <h2 className="mb-2 flex items-center gap-2 font-display text-xl font-bold">
            <Dumbbell className="h-5 w-5 text-gym-accent" />
            Planos disponiveis
          </h2>
          <p className="mb-6 text-sm text-muted-foreground">
            Escolha o plano ideal e comece hoje
          </p>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sortedPlanos.map((plano) => (
              <div
                key={plano.id}
                className={`relative flex flex-col rounded-2xl border p-6 transition-shadow hover:shadow-lg ${
                  plano.destaque
                    ? "border-gym-accent/40 bg-gym-accent/5 shadow-md"
                    : "border-border bg-card"
                }`}
              >
                {plano.destaque && (
                  <span className="absolute -top-3 left-6 rounded-full bg-gym-accent px-3 py-1 text-xs font-bold text-background">
                    Destaque
                  </span>
                )}

                <h3 className="font-display text-lg font-bold">{plano.nome}</h3>
                {plano.descricao && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {plano.descricao}
                  </p>
                )}

                <div className="mt-4">
                  <span className="font-display text-3xl font-bold text-gym-accent">
                    {formatBRL(plano.valor)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {formatDuracao(plano.duracaoDias)}
                  </span>
                </div>

                {plano.valorMatricula > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    + {formatBRL(plano.valorMatricula)} de matricula
                  </p>
                )}

                {plano.beneficios && plano.beneficios.length > 0 && (
                  <ul className="mt-4 flex-1 space-y-2">
                    {plano.beneficios.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 text-gym-teal">✓</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-col gap-2">
                  <a
                    href={`/storefront/adesao/cadastro?tenant=${tenantId}&plan=${plano.id}`}
                    className="block rounded-lg bg-gym-accent px-4 py-2.5 text-center text-sm font-semibold text-background transition-colors hover:bg-gym-accent/90"
                  >
                    Assinar agora
                  </a>
                  <a
                    href={`/storefront/experimental`}
                    className="block rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:bg-secondary"
                  >
                    Aula experimental
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA WhatsApp */}
      {unidade.whatsapp && (
        <section className="mx-auto mt-10 max-w-6xl px-6">
          <div className="rounded-2xl border border-gym-teal/30 bg-gym-teal/5 p-6 text-center sm:p-8">
            <h3 className="font-display text-lg font-bold">Ficou com duvida?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Fale com a gente pelo WhatsApp
            </p>
            <a
              href={`https://wa.me/${unidade.whatsapp.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gym-teal px-6 py-3 font-semibold text-background transition-opacity hover:opacity-90"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </section>
      )}
    </main>
  );
}
