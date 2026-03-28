"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PlanoSelectorCard } from "@/components/shared/plano-selector-card";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import { buildPublicJourneyHref } from "@/lib/public/services";
import type { PublicTenantContext } from "@/lib/public/services";
import type { Tenant } from "@/lib/types";

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface AdesaoLandingContentProps {
  context: PublicTenantContext;
  tenants: Tenant[];
}

export function AdesaoLandingContent({ context, tenants }: AdesaoLandingContentProps) {
  const resolvedTenantRef = context.tenantRef;
  const featuredPlan = context.planos.find((plan) => plan.destaque) ?? context.planos[0];

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenants.length > 0 ? tenants : [context.tenant]}
      currentStep="PLANOS"
      title="Escolha seu plano e comece hoje"
      description={`Funil público da ${context.tenant.nome} com checkout, contrato e branding próprios.`}
      actions={
        <>
          <Button asChild variant="outline" className="border-border bg-transparent">
            <Link href={buildPublicJourneyHref("/adesao/trial", { tenantRef: resolvedTenantRef })}>
              Agendar trial
            </Link>
          </Button>
          {featuredPlan ? (
            <Button asChild>
              <Link
                href={buildPublicJourneyHref("/adesao/cadastro", {
                  tenantRef: resolvedTenantRef,
                  planId: featuredPlan.id,
                })}
              >
                Começar adesão
              </Link>
            </Button>
          ) : null}
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardContent className="px-6 py-6 md:px-8 md:py-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-gym-accent/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-gym-accent">
                Landing flow
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
                Tenant: {context.tenant.subdomain ?? context.tenant.id}
              </span>
            </div>
            <h2 className="mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight md:text-5xl">
              Um funil enxuto para trial, cadastro, checkout e assinatura.
            </h2>
            <p className="mt-4 max-w-2xl text-base text-muted-foreground">
              A jornada pública usa planos reais da unidade, mantém identidade visual isolada por tenant
              e fecha a contratação com contrato e acompanhamento de pendências.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "1. Escolha o plano",
                  text: "Pricing com destaque, benefícios e total real de contratação.",
                },
                {
                  title: "2. Complete o cadastro",
                  text: "Pré-cadastro com validação básica e continuidade entre rotas.",
                },
                {
                  title: "3. Feche o checkout",
                  text: "Pagamento, contrato e pendências resolvidos sem sair do funil.",
                },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-border/80 bg-secondary/30 p-4">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardContent className="px-6 py-6">
            <div className="flex items-center gap-2 text-gym-accent">
              <Sparkles className="size-4" />
              <p className="text-sm font-semibold uppercase tracking-[0.24em]">Plano em destaque</p>
            </div>
            {featuredPlan ? (
              <>
                <h3 className="mt-5 font-display text-3xl font-bold">{featuredPlan.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {featuredPlan.descricao || "Plano principal da unidade para conversão digital."}
                </p>
                <p className="mt-6 font-display text-5xl font-bold text-gym-accent">
                  {formatCurrency(featuredPlan.valor)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  + matrícula {formatCurrency(featuredPlan.valorMatricula)}{featuredPlan.cobraAnuidade ? ` + anuidade ${formatCurrency(featuredPlan.valorAnuidade ?? 0)}` : ""}
                </p>
                <div className="mt-6 space-y-3">
                  {(featuredPlan.beneficios ?? []).slice(0, 4).map((benefit) => (
                    <div key={benefit} className="flex items-start gap-3">
                      <Check className="mt-0.5 size-4 text-gym-teal" />
                      <span className="text-sm text-muted-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Button asChild size="lg" className="mt-8 w-full">
                  <Link
                    href={buildPublicJourneyHref("/adesao/cadastro", {
                      tenantRef: resolvedTenantRef,
                      planId: featuredPlan.id,
                    })}
                  >
                    Assinar agora
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <div className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
                Nenhum plano ativo foi encontrado para esta unidade.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section className="mt-6 grid gap-4 xl:grid-cols-3">
        {context.planos.map((plan) => (
          <div key={plan.id} className="flex flex-col">
            <PlanoSelectorCard plano={plan} variant="grid" />
            <Button asChild className="mt-4 w-full">
              <Link
                href={buildPublicJourneyHref("/adesao/cadastro", {
                  tenantRef: resolvedTenantRef,
                  planId: plan.id,
                })}
              >
                Escolher plano
              </Link>
            </Button>
          </div>
        ))}
      </section>
    </PublicJourneyShell>
  );
}
