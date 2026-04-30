"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/** Hero visível — evolução clara vs `/dashboard` legado */
export function CockpitHeroBar({
  unitLabel,
  dateLabel,
}: {
  unitLabel: string;
  dateLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-primary/85 p-6 text-white shadow-xl shadow-black/30 md:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 20%, hsl(var(--primary)) 0%, transparent 45%), radial-gradient(circle at 80% 90%, hsl(var(--gym-accent) / 0.35) 0%, transparent 40%)`,
        }}
        aria-hidden
      />
      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.2em] text-lime-200">
              cockpit v1
            </span>
            <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/85 ring-1 ring-white/25">
              unidade ativa
            </span>
          </div>
          <h1 className="font-display text-3xl font-black tracking-tight md:text-4xl">
            Cockpit — <span className="text-white/90">Dashboard</span>
          </h1>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-white/75 md:text-[15px]">
            KPIs e listas carregados <strong className="text-white">por aba</strong> para reduzir tráfego. Use as abas
            Clientes, Vendas e Financeiro para trocar o escopo sem sair da tela.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 rounded-2xl border border-white/15 bg-black/35 px-5 py-4 backdrop-blur-sm md:text-right md:items-end">
          <p className="text-[10px] font-bold uppercase tracking-widest text-lime-200/95">referência</p>
          <p className="font-mono text-lg font-semibold tracking-tight text-white">{dateLabel}</p>
          <p className="max-w-[220px] text-xs font-semibold leading-snug text-white/80 md:text-right">{unitLabel}</p>
        </div>
      </div>
    </div>
  );
}

/** Faixa contextual estilo protótipo `dashboard-app.jsx` insight */
export function CockpitInsightStrip({
  icon: Icon = Zap,
  tone = "accent",
  children,
}: {
  icon?: LucideIcon;
  tone?: "accent" | "teal" | "danger" | "warning";
  children: ReactNode;
}) {
  const tones = {
    accent:
      "border-primary/35 bg-gradient-to-r from-primary/14 via-transparent to-transparent text-foreground [&_svg]:text-primary",
    teal: "border-gym-teal/40 bg-gym-teal/10 text-foreground [&_svg]:text-gym-teal",
    danger: "border-gym-danger/45 bg-gym-danger/12 text-foreground [&_svg]:text-gym-danger",
    warning: "border-gym-warning/45 bg-gym-warning/14 text-foreground [&_svg]:text-gym-warning",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm backdrop-blur-[2px]",
        tones[tone],
      )}
      role="status"
      data-testid="cockpit-insight-strip"
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden />
      <p className="text-[13px] font-semibold leading-snug md:text-sm">{children}</p>
    </div>
  );
}

/** Painel com tarja lateral (protótipo + densidade cockpit) */
export function CockpitPanel({
  accent = "primary",
  title,
  subtitle,
  actions,
  children,
}: {
  accent?: "primary" | "teal" | "danger" | "purple";
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const acc = {
    primary: "border-l-gym-accent bg-gym-accent/5",
    teal: "border-l-gym-teal bg-gym-teal/5",
    danger: "border-l-gym-danger bg-gym-danger/5",
    purple: "border-l-[#7c5cbf]/80 bg-[#7c5cbf]/8",
  };

  return (
    <section
      className={cn(
        "rounded-2xl border border-border/50 shadow-lg shadow-black/5",
        "border-l-4 bg-card/95",
        acc[accent],
      )}
    >
      <header className="flex flex-col gap-2 border-b border-border/35 bg-muted/15 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-black tracking-tight">{title}</h2>
          {subtitle ? <p className="mt-1 text-[11px] font-medium text-muted-foreground">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div> : null}
      </header>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

/** Área-chart placeholder até série 24h / API fecharem (roadmap cockpit) */
export function CockpitTrendPlaceholder({
  title,
  caption,
}: {
  title: string;
  caption?: string;
}) {
  const w = 400;
  const h = 120;
  const data = [12, 18, 10, 24, 20, 32, 28, 40, 36, 48, 44, 52, 56, 50, 58, 62, 54, 60, 64, 66, 70, 68];

  const max = Math.max(...data);
  const min = Math.min(...data);
  const rng = max - min || 1;
  const pad = 8;
  const innerH = h - pad * 2;

  const coords = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (w - pad * 2) + pad;
    const y = pad + innerH - ((v - min) / rng) * innerH;
    return { x, y };
  });

  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const firstX = pad;
  const lastX = w - pad;
  const baseY = h - pad;
  const last = coords[data.length - 1]!;
  const fillD = `M ${firstX} ${baseY} ${coords.map((c) => `L ${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")} L ${last.x.toFixed(1)},${baseY} Z`;

  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-5 py-4">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-sm font-bold tracking-tight">{title}</p>
          {caption ? (
            <p className="text-[11px] font-medium text-muted-foreground">{caption}</p>
          ) : null}
        </div>
        <span className="w-fit rounded-md bg-muted/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          placeholder
        </span>
      </div>
      <svg
        width="100%"
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="text-gym-teal"
        role="img"
        aria-label={title}
      >
        <defs>
          <linearGradient id="cockpit-ph-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={fillD} fill="url(#cockpit-ph-fill)" />
        <polyline fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" points={line} />
        <circle cx={last.x} cy={last.y} r="5" fill="currentColor" stroke="hsl(var(--card))" strokeWidth="2" />
      </svg>
      <p className="mt-3 text-[10px] text-muted-foreground">
        Backend: payload <code className="rounded bg-muted px-1">series[]</code> + ocupação 24h (§ pl SM cockpit).
      </p>
    </div>
  );
}
