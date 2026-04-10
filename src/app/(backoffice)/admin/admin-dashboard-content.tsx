"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  GraduationCap,
  LineChart,
  ShoppingCart,
  Users,
  Eye,
  Globe,
  ShieldCheck,
  Upload,
  Activity,
  Shield,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatCompactNumber,
  formatSignedPercent,
  resolveTrendTone,
  sortDistribuicaoAcademias,
  toggleSortState,
  type OperacionalSortKey,
  type OperacionalSortState,
} from "@/backoffice/lib/admin-metrics";
import { formatCurrency } from "@/lib/formatters";
import type { MetricasOperacionaisGlobal } from "@/lib/types";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BiMetricCard } from "@/components/shared/bi-metric-card";
import { cn } from "@/lib/utils";

const DEFAULT_SORT: OperacionalSortState = {
  key: "vendasMesValor",
  direction: "desc",
};

export function AdminDashboardContent({
  stats,
  metricas,
  operationalError,
}: {
  stats: {
    totalAcademias: number;
    totalUnidades: number;
    totalAdmins: number;
    elegiveisNovasUnidades: number;
  };
  metricas: MetricasOperacionaisGlobal | null;
  operationalError: string | null;
}) {
  const [sortState, setSortState] = useState<OperacionalSortState>(DEFAULT_SORT);
  const evolucaoNovosAlunos = metricas?.evolucaoNovosAlunos ?? [];
  const distribuicaoAcademias = metricas?.distribuicaoAcademias ?? [];

  const maxSerie = useMemo(
    () => Math.max(1, ...evolucaoNovosAlunos.map((item) => item.total)),
    [evolucaoNovosAlunos]
  );

  const distribuicaoOrdenada = useMemo(
    () => sortDistribuicaoAcademias(distribuicaoAcademias, sortState),
    [distribuicaoAcademias, sortState]
  );

  const trendTone = resolveTrendTone(metricas?.tendenciaCrescimentoPercentual ?? 0);
  
  const toneMap = {
    positive: "teal",
    negative: "danger",
    neutral: "accent"
  } as const;

  const currentTone = toneMap[trendTone as keyof typeof toneMap] || "accent";

  function handleSortChange(key: OperacionalSortKey) {
    setSortState((current) => toggleSortState(current, key));
  }

  function renderSortIcon(key: OperacionalSortKey) {
    if (sortState.key !== key) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
    return sortState.direction === "asc" ? <ArrowUp className="size-3.5 text-gym-accent" /> : <ArrowDown className="size-3.5 text-gym-accent" />;
  }

  return (
    <div className="flex flex-col gap-10 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="animate-[slideInLeft_0.4s_ease-out]">
          <p className="text-sm font-bold uppercase tracking-widest text-gym-accent mb-2">Plataforma</p>
          <h1 className="text-4xl font-extrabold tracking-tight font-display sm:text-5xl">Dashboard <span className="text-gym-accent">Admin</span></h1>
          <p className="text-lg text-muted-foreground max-w-2xl mt-2">
            Visão consolidada do ecossistema Conceito.fit: gestão de academias, unidades e métricas SaaS.
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/admin/onboarding/provisionar">
            <Button size="lg" className="rounded-xl shadow-lg shadow-gym-accent/20 bg-gym-accent text-black font-bold hover:bg-gym-accent/90">
              <PlusIcon className="mr-2 size-5" /> Provisionar Academia
            </Button>
          </Link>
        </div>
      </header>

      {/* Main SaaS Stats */}
      <section className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <BiMetricCard label="Total de Academias" value={String(stats.totalAcademias)} icon={Building2} tone="accent" description="Academias parceiras ativas" />
        <BiMetricCard label="Unidades Ativas" value={String(stats.totalUnidades)} icon={Globe} tone="teal" description="Tenants operando na plataforma" />
        <BiMetricCard label="Usuários Admin" value={String(stats.totalAdmins)} icon={ShieldCheck} tone="warning" description={`${stats.elegiveisNovasUnidades} elegíveis para novas unidades`} />
      </section>

      {/* Operational Metrics Section */}
      <section className="space-y-6">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-display font-extrabold tracking-tight">Operação Global</h2>
            <p className="text-muted-foreground">Métricas agregadas de toda a rede em tempo real.</p>
          </div>
          
          {metricas && (
            <div
              className={cn(
                "inline-flex animate-[fadeInScale_0.4s_ease-out] items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-sm",
                currentTone === "teal" ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal" :
                currentTone === "danger" ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger" :
                "border-border bg-muted text-muted-foreground"
              )}
            >
              <LineChart className="size-4" />
              Crescimento mensal {formatSignedPercent(metricas.tendenciaCrescimentoPercentual)}
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <BiMetricCard label="Alunos Ativos" value={formatCompactNumber(metricas?.totalAlunosAtivos ?? 0)} icon={Users} tone="teal" description="Base total da rede" />
          <BiMetricCard label="Matrículas" value={formatCompactNumber(metricas?.totalMatriculasAtivas ?? 0)} icon={Building2} tone="accent" description="Contratos vigentes" />
          <BiMetricCard label="Receita do Mês" value={formatCurrency(metricas?.vendasMesValor ?? 0)} icon={ShoppingCart} tone="teal" description={`${formatCompactNumber(metricas?.vendasMesQuantidade ?? 0)} vendas totais`} />
          <BiMetricCard label="Ticket Médio" value={formatCurrency(metricas?.ticketMedioGlobal ?? 0)} icon={LineChart} tone="accent" description="Valor médio por venda" />
          <BiMetricCard label="Novos Alunos" value={formatCompactNumber(metricas?.novosAlunosMes ?? 0)} icon={GraduationCap} tone="warning" description={`${formatCompactNumber(metricas?.novosAlunosMesAnterior ?? 0)} no mês anterior`} />
        </div>

        {operationalError && (
          <div className="rounded-2xl border border-gym-warning/30 bg-gym-warning/10 p-4 text-sm text-gym-warning flex items-center gap-3">
            <Activity className="size-5" />
            Não foi possível carregar as métricas operacionais globais: {operationalError}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          {/* Charts / Progress */}
          <div className="glass-card rounded-2xl border border-border/40 p-6 shadow-xl shadow-black/5">
            <div className="mb-6">
              <h3 className="font-display text-lg font-bold">Evolução de Novos Alunos</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Últimos 6 meses consolidados</p>
            </div>
            
            {evolucaoNovosAlunos.length ? (
              <div className="space-y-5">
                {evolucaoNovosAlunos.map((item, i) => {
                  const width = Math.max(8, Math.round((item.total / maxSerie) * 100));
                  return (
                    <div key={item.referencia} className="space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                        <span>{item.label}</span>
                        <span className="text-foreground">{item.total}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-gym-accent to-gym-teal transition-[width] duration-700 ease-out"
                          style={{ width: `${width}%`, transitionDelay: `${i * 100}ms` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground opacity-50">Sem dados de evolução disponíveis.</p>
            )}
          </div>

          {/* Ranking Table */}
          <div className="glass-card rounded-2xl border border-border/40 overflow-hidden shadow-xl shadow-black/5">
            <div className="p-6 border-b border-border/40 bg-muted/10">
              <h3 className="font-display text-lg font-bold">Distribuição por Academia</h3>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Ranking operacional ordenável</p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-none bg-muted/40 hover:bg-muted/40">
                    {([["academiaNome", "Academia"], ["unidades", "Unid."], ["alunosAtivos", "Alunos"], ["matriculasAtivas", "Matric."], ["vendasMesQuantidade", "Vendas"], ["vendasMesValor", "Receita"]] as const).map(([key, label], i) => {
                      const isActive = sortState.key === key;
                      const ariaSort = isActive
                        ? sortState.direction === "asc" ? "ascending" : "descending"
                        : "none";
                      return (
                        <TableHead
                          key={key}
                          scope="col"
                          aria-sort={ariaSort}
                          className={cn("py-4", i === 0 && "pl-6")}
                        >
                          <button
                            type="button"
                            aria-label={`Ordenar por ${label}${isActive ? `, atualmente ${ariaSort === "ascending" ? "crescente" : "decrescente"}` : ""}`}
                            className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70 hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gym-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded"
                            onClick={() => handleSortChange(key)}
                          >
                            {label} {renderSortIcon(key)}
                          </button>
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {distribuicaoOrdenada.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="py-20 text-center text-sm text-muted-foreground opacity-50">Sem dados disponíveis.</TableCell></TableRow>
                  ) : (
                    distribuicaoOrdenada.map((item, i) => (
                      <TableRow
                        key={item.academiaId ?? item.academiaNome}
                        className="group animate-[fadeInUp_0.3s_ease-out_both] border-b border-border/10 hover:bg-gym-accent/[0.03] transition-colors"
                        style={{ animationDelay: `${i * 20}ms` }}
                      >
                        <TableCell className="py-4 pl-6 font-bold text-sm tracking-tight">{item.academiaNome}</TableCell>
                        <TableCell className="py-4 text-xs font-medium">{formatCompactNumber(item.unidades)}</TableCell>
                        <TableCell className="py-4 text-xs font-medium">{formatCompactNumber(item.alunosAtivos)}</TableCell>
                        <TableCell className="py-4 text-xs font-medium">{formatCompactNumber(item.matriculasAtivas)}</TableCell>
                        <TableCell className="py-4 text-xs font-medium">{formatCompactNumber(item.vendasMesQuantidade)}</TableCell>
                        <TableCell className="py-4 text-xs font-extrabold text-gym-accent">{formatCurrency(item.vendasMesValor)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* Management Shortcuts */}
      <section className="space-y-6">
        <h2 className="text-2xl font-display font-extrabold tracking-tight">Gestão da Plataforma</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ManagementCard href="/admin/academias" label="Academias" description="Gerir parceiros" icon={Building2} value={stats.totalAcademias} />
          <ManagementCard href="/admin/unidades" label="Unidades" description="Gerir tenants" icon={Globe} value={stats.totalUnidades} />
          <ManagementCard href="/admin/seguranca" label="Segurança" description="Controle global" icon={ShieldCheck} value={stats.totalAdmins} />
          <ManagementCard href="/admin/importacao-evo" label="EVO" description="Jobs Onboarding" icon={Upload} isSpecial />
          <ManagementCard href="/admin/operacional/saude" label="Saúde Ops" description="Risco & Estabilidade" icon={Activity} isSpecial />
          <ManagementCard href="/admin/compliance" label="LGPD" description="Dados Pessoais" icon={Shield} isSpecial />
        </div>
      </section>
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  );
}

function ManagementCard({ href, label, description, icon: Icon, value, isSpecial }: any) {
  return (
    <Link href={href}>
      <div
        className="glass-card rounded-2xl border border-border/40 p-5 group hover:-translate-y-1 hover:bg-gym-accent/[0.03] transition-all duration-200"
      >
        <div className="flex items-start justify-between">
          <div className={cn(
            "p-2 rounded-xl border border-border/40 text-muted-foreground group-hover:text-gym-accent group-hover:border-gym-accent/30 transition-colors",
            isSpecial && "bg-gym-accent/5"
          )}>
            <Icon size={18} />
          </div>
          {value !== undefined && (
            <span className="text-lg font-extrabold font-display">{value}</span>
          )}
        </div>
        <div className="mt-4">
          <p className="text-sm font-bold tracking-tight flex items-center gap-1 group-hover:text-gym-accent transition-colors">
            {label}
            <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </p>
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
}
