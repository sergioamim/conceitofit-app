"use client";

import { useEffect, type CSSProperties, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { getThemeGlow, type PublicTenantContext } from "@/lib/public/services";
import type { Tenant } from "@/lib/types";

type PublicJourneyStep = "PLANOS" | "CADASTRO" | "CHECKOUT" | "PENDENCIAS";

const STEP_LABEL: Record<PublicJourneyStep, string> = {
  PLANOS: "Planos",
  CADASTRO: "Cadastro",
  CHECKOUT: "Checkout",
  PENDENCIAS: "Pendências",
};

function shellStyle(context: PublicTenantContext): CSSProperties {
  const glow = getThemeGlow(context.theme);
  return {
    minHeight: "100vh",
    background: `radial-gradient(circle at top left, ${glow.accentSoft}, transparent 32%), radial-gradient(circle at top right, ${glow.primarySoft}, transparent 28%), linear-gradient(180deg, ${context.theme.background} 0%, #050608 100%)`,
    color: context.theme.foreground,
  };
}

function glassCardStyle(context: PublicTenantContext): CSSProperties {
  const glow = getThemeGlow(context.theme);
  return {
    backgroundColor: glow.borderSoft,
    borderColor: context.theme.border,
  };
}

function stepStyle(active: boolean, context: PublicTenantContext): CSSProperties {
  return active
    ? {
        backgroundColor: context.theme.primary,
        color: context.theme.background,
      }
    : {
        backgroundColor: withAlpha(context.theme.surface, 0.92),
        color: context.theme.mutedForeground,
        borderColor: context.theme.border,
      };
}

function withAlpha(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  if (sanitized.length !== 6) return hex;
  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function PublicJourneyShell({
  context,
  tenants,
  currentStep,
  title,
  description,
  actions,
  children,
}: {
  context: PublicTenantContext;
  tenants: Tenant[];
  currentStep: PublicJourneyStep;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    document.title = `${context.appName} – Adesão digital`;
  }, [context.appName]);

  function handleTenantChange(nextTenantRef: string) {
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tenant", nextTenantRef);
    router.push(`${pathname}?${nextParams.toString()}`);
  }

  const baseCardStyle = glassCardStyle(context);

  return (
    <div style={shellStyle(context)}>
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header
          className="rounded-[28px] border px-5 py-5 backdrop-blur md:px-7"
          style={baseCardStyle}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p
                className="text-[11px] font-semibold uppercase tracking-[0.32em]"
                style={{ color: context.theme.mutedForeground }}
              >
                Adesão digital
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div
                  className="flex h-11 min-w-11 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                  style={{
                    backgroundColor: context.theme.primary,
                    color: context.theme.background,
                  }}
                >
                  {context.appName}
                </div>
                <div>
                  <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
                  <p className="mt-1 text-sm" style={{ color: context.theme.mutedForeground }}>
                    {description}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_auto] sm:items-end">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-[0.26em] text-white/70">
                  Unidade
                </label>
                <select
                  aria-label="Unidade da jornada"
                  value={context.tenantRef}
                  onChange={(event) => handleTenantChange(event.target.value)}
                  className="flex h-11 w-full rounded-xl border bg-transparent px-3 text-sm"
                  style={{
                    borderColor: context.theme.border,
                    backgroundColor: withAlpha(context.theme.surface, 0.78),
                  }}
                >
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.subdomain ?? tenant.id}>
                      {tenant.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">{actions}</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {(Object.keys(STEP_LABEL) as PublicJourneyStep[]).map((step) => {
              const active = step === currentStep;
              return (
                <span
                  key={step}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide"
                  style={stepStyle(active, context)}
                >
                  {STEP_LABEL[step]}
                </span>
              );
            })}
          </div>
        </header>

        <main className="flex-1 py-6">{children}</main>

        <footer className="pt-4 text-sm" style={{ color: context.theme.mutedForeground }}>
          <div className="flex flex-col gap-3 rounded-[24px] border px-5 py-4 md:flex-row md:items-center md:justify-between" style={baseCardStyle}>
            <div>
              <p className="font-semibold text-white">{context.tenant.nome}</p>
              <p>
                Jornada pública com branding isolado por tenant e contrato digital quando disponível.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" className="border-border bg-transparent">
                <Link href={`/login`}>Acesso do backoffice</Link>
              </Button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
