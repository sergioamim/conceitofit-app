import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CreditCard,
  Dumbbell,
  Globe,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Conceito Fit - Sistema de Gestao para Academias",
  description:
    "Conceito Fit e a plataforma para academias que une operacao, financeiro, CRM, treinos, site white-label e adesao digital em um unico sistema.",
  keywords: [
    "sistema academia",
    "gestao academia",
    "software academia",
    "crm academia",
    "controle financeiro academia",
    "adesao digital academia",
  ],
  openGraph: {
    title: "Conceito Fit - Sistema de Gestao para Academias",
    description:
      "Operacao, financeiro, CRM, treinos, site white-label e adesao digital em uma plataforma unica para academias.",
    type: "website",
    locale: "pt_BR",
    siteName: "Conceito Fit",
  },
  twitter: {
    card: "summary_large_image",
    title: "Conceito Fit - Sistema de Gestao para Academias",
    description:
      "A plataforma para academias que querem crescer com dados, automacao e uma jornada digital completa.",
  },
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Conceito Fit",
  applicationCategory: "BusinessApplication",
  applicationSubCategory: "Gym Management Software",
  operatingSystem: "Web",
  description:
    "Plataforma para academias com operacao, financeiro, CRM, treinos, site white-label e adesao digital.",
  url: "https://conceito.fit/",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "BRL",
    category: "SaaS",
    availability: "https://schema.org/InStock",
  },
  creator: {
    "@type": "Organization",
    name: "Conceito Fit",
    url: "https://conceito.fit/",
  },
};

const PRODUCT_PILLARS = [
  {
    icon: BarChart3,
    title: "Operacao visivel em tempo real",
    description:
      "Dashboard, indicadores, acompanhamento de vendas, recebimentos e performance por unidade ou rede.",
  },
  {
    icon: CreditCard,
    title: "Financeiro integrado",
    description:
      "Contas a pagar e receber, cobrancas, conciliacao, contratos e inadimplencia sem planilha paralela.",
  },
  {
    icon: Users,
    title: "Comercial e CRM de academia",
    description:
      "Prospects, tarefas, playbooks, campanhas e conversao do primeiro contato ate a matricula.",
  },
  {
    icon: Dumbbell,
    title: "Experiencia completa do aluno",
    description:
      "Treinos, grade, reservas, check-in, jornada publica e area autenticada para operacao e atendimento.",
  },
];

const ENTRY_POINTS = [
  {
    icon: Sparkles,
    title: "Conta demo",
    description: "Experimentacao guiada para conhecer o produto com dados de exemplo.",
    href: "/b2b/demo",
    cta: "Experimentar gratis",
  },
  {
    icon: Building2,
    title: "Pagina comercial",
    description: "Visao completa de funcionalidades, dores resolvidas e contato com o time.",
    href: "/b2b",
    cta: "Ver apresentacao completa",
  },
  {
    icon: Globe,
    title: "Jornada publica",
    description: "Adesao digital e storefront white-label para redes e unidades.",
    href: "/adesao",
    cta: "Abrir jornada publica",
  },
];

const TRUST_POINTS = [
  "Multi-unidade e rede com permissao por contexto",
  "Storefront publica com branding proprio da academia",
  "Adesao digital, checkout e onboarding publico",
  "Backoffice global separado da operacao da unidade",
];

async function hasServerSession(): Promise<boolean> {
  const jar = await cookies();
  return Boolean(jar.get("academia-active-tenant-id")?.value);
}

export default async function HomePage() {
  if (await hasServerSession()) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
      />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gym-accent">
              <Dumbbell className="h-4 w-4 text-background" />
            </span>
            <span className="font-display text-lg font-bold">conceito.fit</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a href="#produto" className="text-muted-foreground transition-colors hover:text-foreground">
              Produto
            </a>
            <a href="#entradas" className="text-muted-foreground transition-colors hover:text-foreground">
              Entradas
            </a>
            <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
              Entrar
            </Link>
            <Link
              href="/b2b/demo"
              className="inline-flex h-9 items-center rounded-lg bg-gym-accent px-4 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Testar demo
            </Link>
          </nav>

          <Link
            href="/login"
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-secondary md:hidden"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden py-20 sm:py-28 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_70%_55%_at_50%_-20%,var(--gym-accent)/0.14,transparent)]" />
          <div className="mx-auto grid max-w-6xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="inline-flex rounded-full border border-gym-accent/30 bg-gym-accent/10 px-4 py-1 text-xs font-medium tracking-wide text-gym-accent">
                Plataforma completa para academias
              </p>
              <h1 className="mt-6 font-display text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Gestao, operacao e jornada digital em um unico lugar
              </h1>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                O Conceito Fit conecta financeiro, CRM, treinos, site white-label e adesao digital
                para academias que precisam operar melhor hoje e crescer com previsibilidade.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/b2b/demo"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gym-accent px-8 text-base font-bold text-background transition-opacity hover:opacity-90"
                >
                  Experimentar gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-8 text-base font-medium transition-colors hover:bg-secondary"
                >
                  Entrar no sistema
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="rounded-full border border-border/60 px-3 py-1">Operacao por unidade e rede</span>
                <span className="rounded-full border border-border/60 px-3 py-1">Adesao digital</span>
                <span className="rounded-full border border-border/60 px-3 py-1">Storefront white-label</span>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Rotas de entrada
              </p>
              <div className="mt-5 space-y-4">
                {ENTRY_POINTS.map((entry) => (
                  <Link
                    key={entry.title}
                    href={entry.href}
                    className="block rounded-2xl border border-border/60 bg-background p-4 transition-colors hover:border-gym-accent/40 hover:bg-secondary/40"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-gym-accent/10">
                        <entry.icon className="h-5 w-5 text-gym-accent" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-display text-lg font-semibold">{entry.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{entry.description}</p>
                        <p className="mt-3 text-sm font-medium text-gym-accent">{entry.cta}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="produto" className="border-t border-border/40 bg-secondary/30 py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Um SaaS pensado para a rotina real da academia
              </h2>
              <p className="mt-3 text-muted-foreground">
                O objetivo da home e acelerar descoberta. O aprofundamento comercial completo continua em <Link href="/b2b" className="font-medium text-foreground underline underline-offset-4">/b2b</Link>.
              </p>
            </div>

            <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              {PRODUCT_PILLARS.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-2xl border border-border/60 bg-card p-6"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-gym-accent/10">
                    <pillar.icon className="h-5 w-5 text-gym-accent" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="entradas" className="py-20">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="font-display text-3xl font-bold sm:text-4xl">
                Descoberta publica e entrada operacional sem conflito
              </h2>
              <p className="mt-4 text-muted-foreground">
                A home agora assume o papel institucional. Para quem ja usa o sistema, o caminho continua simples: entrar e seguir para o portal operacional.
              </p>
              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/b2b"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Ver pagina comercial completa
                </Link>
                <Link
                  href="/adesao"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-6 text-sm font-medium transition-colors hover:bg-secondary"
                >
                  Abrir jornada publica
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-border/60 bg-card p-6">
              <h3 className="font-display text-xl font-semibold">O que fica coberto nesta entrada</h3>
              <ul className="mt-5 space-y-3">
                {TRUST_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-gym-accent/10">
                      <Shield className="h-3.5 w-3.5 text-gym-accent" />
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 rounded-2xl border border-border/60 bg-background p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Usuarios autenticados
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Quando existe sessao ativa, <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/</code> redireciona para <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">/dashboard</code> no servidor para preservar a entrada operacional.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
