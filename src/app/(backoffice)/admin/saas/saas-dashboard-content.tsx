"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  CreditCard,
  Percent,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import type {
  SaasMetricsResponse,
  SaasOnboardingResponse,
  SaasSeriesResponse,
  AcademiaOnboarding,
} from "@/lib/api/admin-saas-metrics";

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function formatNumber(n: number): string {
  return n.toLocaleString("pt-BR");
}

type OnboardingFilter = "all" | "ativa" | "demo" | "inativa";

interface SaasDashboardContentProps {
  metrics: SaasMetricsResponse | null;
  series: SaasSeriesResponse | null;
  onboarding: SaasOnboardingResponse | null;
  error: string | null;
}

export function SaasDashboardContent({
  metrics,
  series,
  onboarding,
  error,
}: SaasDashboardContentProps) {
  const [onboardingFilter, setOnboardingFilter] = useState<OnboardingFilter>("all");

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <div className="rounded-xl border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
          {error}
        </div>
      </div>
    );
  }

  const m = metrics;
  const filteredOnboarding = filterOnboarding(onboarding?.academias ?? [], onboardingFilter);

  return (
    <div className="flex flex-col gap-8">
      <Header />

      {/* KPIs principais */}
      {m && (
        <>
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Receita e Conversao
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <BiMetricCard
                label="MRR"
                value={formatBRL(m.mrr)}
                description="Receita mensal recorrente"
                tone="accent"
                extra={<CreditCard className="h-4 w-4 text-gym-accent" />}
              />
              <BiMetricCard
                label="Churn Rate"
                value={formatPercent(m.churnRate)}
                description="Taxa de cancelamento mensal"
                tone={m.churnRate > 5 ? "danger" : m.churnRate > 3 ? "warning" : "teal"}
                extra={<TrendingDown className="h-4 w-4" />}
              />
              <BiMetricCard
                label="Ticket Medio"
                value={formatBRL(m.ticketMedio)}
                description="Valor medio por academia"
                tone="accent"
                extra={<Percent className="h-4 w-4 text-gym-accent" />}
              />
              <BiMetricCard
                label="Leads B2B (30d)"
                value={formatNumber(m.leadsB2bNovos30d)}
                description={`${m.leadsB2bConvertidos} convertidos`}
                tone={m.leadsB2bConvertidos > 0 ? "teal" : "warning"}
                extra={<UserPlus className="h-4 w-4" />}
              />
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Base de Clientes
            </h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <BiMetricCard
                label="Academias Ativas"
                value={formatNumber(m.academiasAtivas)}
                description={`${m.totalAcademias} total, ${m.academiasDemo} demo`}
                tone="teal"
                extra={<Building2 className="h-4 w-4 text-gym-teal" />}
              />
              <BiMetricCard
                label="Unidades Ativas"
                value={formatNumber(m.tenantsAtivos)}
                description={`${m.totalTenants} total`}
                tone="teal"
              />
              <BiMetricCard
                label="Alunos Ativos"
                value={formatNumber(m.totalAlunosAtivos)}
                description="Total na plataforma"
                tone="accent"
                extra={<Users className="h-4 w-4 text-gym-accent" />}
              />
              <BiMetricCard
                label="Novas Academias (30d)"
                value={formatNumber(m.academiasNovas30d)}
                description="Crescimento recente"
                tone={m.academiasNovas30d > 0 ? "teal" : "warning"}
                extra={<TrendingUp className="h-4 w-4" />}
              />
            </div>
          </section>
        </>
      )}

      {/* Serie temporal */}
      {series && series.pontos && series.pontos.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Evolucao — {series.metrica ?? "MRR"}
          </h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-end gap-1" style={{ height: 120 }}>
              {series.pontos.map((ponto, i) => {
                const maxVal = Math.max(...series.pontos.map((p) => p.valor), 1);
                const height = Math.max(4, (ponto.valor / maxVal) * 100);
                return (
                  <div key={`${ponto.data}-${i}`} className="group relative flex-1">
                    <div
                      className="w-full rounded-t bg-gym-accent/70 transition-colors group-hover:bg-gym-accent"
                      style={{ height: `${height}%` }}
                    />
                    <div className="absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-card px-2 py-1 text-[10px] shadow-lg group-hover:block">
                      {formatBRL(ponto.valor)} — {ponto.data}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{series.pontos[0]?.data}</span>
              <span>{series.pontos[series.pontos.length - 1]?.data}</span>
            </div>
          </div>
        </section>
      )}

      {/* Pipeline de onboarding */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Pipeline de Onboarding ({onboarding?.total ?? 0})
          </h2>
          <div className="flex gap-1.5">
            {(["all", "ativa", "demo", "inativa"] as OnboardingFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setOnboardingFilter(f)}
                className={`rounded-md border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  onboardingFilter === f
                    ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "all" ? "Todas" : f === "ativa" ? "Ativas" : f === "demo" ? "Demo" : "Inativas"}
              </button>
            ))}
          </div>
        </div>

        {filteredOnboarding.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-5 py-10 text-center text-sm text-muted-foreground">
            Nenhuma academia encontrada para o filtro selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th scope="col" className="px-4 py-3">Academia</th>
                  <th scope="col" className="px-4 py-3">Subdominio</th>
                  <th scope="col" className="px-4 py-3 text-right">Alunos</th>
                  <th scope="col" className="px-4 py-3 text-right">Unidades</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Criacao</th>
                  <th scope="col" className="px-4 py-3">Onboarding</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOnboarding.map((a) => (
                  <tr key={a.academiaId} className="hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/academias/${a.academiaId}`}
                        className="font-medium text-foreground hover:text-gym-accent"
                      >
                        {a.nome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {a.subdominio || "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatNumber(a.totalAlunos)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {a.totalTenants}
                    </td>
                    <td className="px-4 py-3">
                      {a.demo ? (
                        <span className="inline-flex rounded-full bg-purple-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-purple-400">
                          Demo
                        </span>
                      ) : a.ativa ? (
                        <StatusBadge status="ATIVO" />
                      ) : (
                        <StatusBadge status="INATIVO" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.dataCriacao)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(a.dataOnboarding)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Header() {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-gym-accent">Administracao</p>
        <ArrowUpRight className="h-3 w-3 text-gym-accent" />
        <p className="text-sm text-muted-foreground">Metricas SaaS</p>
      </div>
      <h1 className="font-display text-3xl font-bold leading-tight">
        Metricas SaaS e Onboarding
      </h1>
      <p className="text-sm text-muted-foreground">
        Visao consolidada de receita, crescimento e pipeline de onboarding da plataforma.
      </p>
    </header>
  );
}

function filterOnboarding(
  academias: AcademiaOnboarding[],
  filter: OnboardingFilter,
): AcademiaOnboarding[] {
  switch (filter) {
    case "ativa":
      return academias.filter((a) => a.ativa && !a.demo);
    case "demo":
      return academias.filter((a) => a.demo);
    case "inativa":
      return academias.filter((a) => !a.ativa);
    default:
      return academias;
  }
}
