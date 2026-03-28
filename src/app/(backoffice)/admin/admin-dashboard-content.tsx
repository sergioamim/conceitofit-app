"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  GraduationCap,
  LineChart,
  type LucideIcon,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatCompactNumber,
  formatCurrency,
  formatSignedPercent,
  resolveTrendTone,
  sortDistribuicaoAcademias,
  toggleSortState,
  type OperacionalSortKey,
  type OperacionalSortState,
} from "@/lib/backoffice/admin-metrics";
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

const DEFAULT_SORT: OperacionalSortState = {
  key: "vendasMesValor",
  direction: "desc",
};

function OperationalMetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-3 font-display text-3xl font-bold leading-none text-foreground">{value}</p>
        </div>
        <div className="rounded-full border border-border bg-secondary p-2 text-muted-foreground">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

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

  const maxSerie = useMemo(
    () => Math.max(1, ...(metricas?.evolucaoNovosAlunos ?? []).map((item) => item.total)),
    [metricas?.evolucaoNovosAlunos]
  );

  const distribuicaoOrdenada = useMemo(
    () => sortDistribuicaoAcademias(metricas?.distribuicaoAcademias ?? [], sortState),
    [metricas?.distribuicaoAcademias, sortState]
  );

  const trendTone = resolveTrendTone(metricas?.tendenciaCrescimentoPercentual ?? 0);
  const trendClassName =
    trendTone === "positive"
      ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
      : trendTone === "negative"
        ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
        : "border-border bg-secondary text-muted-foreground";

  function handleSortChange(key: OperacionalSortKey) {
    setSortState((current) => toggleSortState(current, key));
  }

  function renderSortIcon(key: OperacionalSortKey) {
    if (sortState.key !== key) return <ArrowUpDown className="size-3.5 text-muted-foreground" />;
    return sortState.direction === "asc" ? <ArrowUp className="size-3.5 text-foreground" /> : <ArrowDown className="size-3.5 text-foreground" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="space-y-2">
        <p className="text-sm font-medium text-gym-accent">Administração</p>
        <h1 className="text-3xl font-display font-bold leading-tight">Dashboard do backoffice</h1>
        <p className="text-sm text-muted-foreground">
          Visão geral e atalhos para gestão de academias, unidades, segurança global e integrações.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-base">Academias</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{stats.totalAcademias}</p>
              <p className="text-sm text-muted-foreground">Total cadastrado</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Unidades (tenants)</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{stats.totalUnidades}</p>
              <p className="text-sm text-muted-foreground">Clientes únicos por unidade</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Segurança global</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-display font-bold">{stats.totalAdmins}</p>
              <p className="text-sm text-muted-foreground">{stats.elegiveisNovasUnidades} elegíveis para novas unidades</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-medium text-gym-accent">Operação global</p>
            <h2 className="text-2xl font-display font-bold leading-tight">Métricas consolidadas da rede</h2>
            <p className="text-sm text-muted-foreground">
              Acompanha alunos, matrículas e vendas agregadas de todas as academias em um único painel.
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${trendClassName}`}>
            <LineChart className="size-3.5" />
            Crescimento mensal {formatSignedPercent(metricas?.tendenciaCrescimentoPercentual ?? 0)}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <OperationalMetricCard title="Alunos ativos" value={formatCompactNumber(metricas?.totalAlunosAtivos ?? 0)} description="Base ativa somada entre todas as academias." icon={Users} />
          <OperationalMetricCard title="Matrículas ativas" value={formatCompactNumber(metricas?.totalMatriculasAtivas ?? 0)} description="Contratos vigentes no recorte operacional global." icon={Building2} />
          <OperationalMetricCard title="Vendas do mês" value={formatCurrency(metricas?.vendasMesValor ?? 0)} description={`${formatCompactNumber(metricas?.vendasMesQuantidade ?? 0)} vendas fechadas no mês corrente.`} icon={ShoppingCart} />
          <OperationalMetricCard title="Ticket médio global" value={formatCurrency(metricas?.ticketMedioGlobal ?? 0)} description="Valor médio global por venda fechada no período." icon={LineChart} />
          <OperationalMetricCard title="Novos alunos do mês" value={formatCompactNumber(metricas?.novosAlunosMes ?? 0)} description={`${formatCompactNumber(metricas?.novosAlunosMesAnterior ?? 0)} no mês anterior.`} icon={GraduationCap} />
        </div>

        {operationalError ? (
          <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
            Não foi possível carregar as métricas operacionais globais: {operationalError}
          </div>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Evolução de novos alunos</CardTitle>
              <p className="text-sm text-muted-foreground">Últimos 6 meses consolidados em toda a rede.</p>
            </CardHeader>
            <CardContent>
              {metricas?.evolucaoNovosAlunos.length ? (
                <div className="space-y-3">
                  {metricas.evolucaoNovosAlunos.map((item) => {
                    const width = Math.max(8, Math.round((item.total / maxSerie) * 100));
                    return (
                      <div key={item.referencia} className="grid grid-cols-[74px_1fr_48px] items-center gap-3">
                        <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                        <div className="h-2.5 rounded-full bg-secondary"><div className="h-2.5 rounded-full bg-gym-accent" style={{ width: `${width}%` }} /></div>
                        <span className="text-right text-xs font-semibold text-foreground">{item.total}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem dados de evolução mensal disponíveis.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <CardTitle className="text-base">Distribuição por academia</CardTitle>
              <p className="text-sm text-muted-foreground">Ranking ordenável por academia, unidades, alunos, matrículas, vendas e ticket médio.</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table aria-label="Distribuição operacional por academia">
                  <TableHeader>
                    <TableRow className="bg-secondary">
                      {([["academiaNome", "Academia"], ["unidades", "Unidades"], ["alunosAtivos", "Alunos"], ["matriculasAtivas", "Matrículas"], ["vendasMesQuantidade", "Vendas"], ["vendasMesValor", "Receita"], ["ticketMedio", "Ticket médio"]] as const).map(([key, label]) => (
                        <TableHead key={key} className="px-4 py-3">
                          <Button type="button" variant="ghost" className="h-auto px-0 py-0 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:bg-transparent" onClick={() => handleSortChange(key)}>
                            {label} {renderSortIcon(key)}
                          </Button>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distribuicaoOrdenada.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Sem distribuição por academia disponível.</TableCell></TableRow>
                    ) : (
                      distribuicaoOrdenada.map((item) => (
                        <TableRow key={item.academiaId ?? item.academiaNome}>
                          <TableCell className="px-4 py-3 font-medium text-foreground">{item.academiaNome}</TableCell>
                          <TableCell className="px-4 py-3">{formatCompactNumber(item.unidades)}</TableCell>
                          <TableCell className="px-4 py-3">{formatCompactNumber(item.alunosAtivos)}</TableCell>
                          <TableCell className="px-4 py-3">{formatCompactNumber(item.matriculasAtivas)}</TableCell>
                          <TableCell className="px-4 py-3">{formatCompactNumber(item.vendasMesQuantidade)}</TableCell>
                          <TableCell className="px-4 py-3">{formatCurrency(item.vendasMesValor)}</TableCell>
                          <TableCell className="px-4 py-3">{formatCurrency(item.ticketMedio)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Academias</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">{stats.totalAcademias}</p><p className="text-sm text-muted-foreground">Total cadastradas</p></div>
            <Link href="/admin/academias"><Button variant="outline" size="sm">Gerir</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Unidades (tenants)</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">{stats.totalUnidades}</p><p className="text-sm text-muted-foreground">Clientes únicos</p></div>
            <Link href="/admin/unidades"><Button variant="outline" size="sm">Gerir</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Segurança global</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">{stats.totalAdmins}</p><p className="text-sm text-muted-foreground">Usuários administrativos</p></div>
            <Link href="/admin/seguranca"><Button variant="outline" size="sm">Abrir</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Importação EVO</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">EVO</p><p className="text-sm text-muted-foreground">Acompanhar jobs e onboarding</p></div>
            <Link href="/admin/importacao-evo"><Button variant="outline" size="sm">Abrir</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Saúde Operacional</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">Mapa</p><p className="text-sm text-muted-foreground">Comparar risco e estabilidade por academia</p></div>
            <Link href="/admin/operacional/saude"><Button variant="outline" size="sm">Abrir</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Compliance LGPD</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-between">
            <div><p className="text-3xl font-display font-bold">LGPD</p><p className="text-sm text-muted-foreground">Controlar dados pessoais, termos e exclusões</p></div>
            <Link href="/admin/compliance"><Button variant="outline" size="sm">Abrir</Button></Link>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader><CardTitle className="text-base">Atalhos rápidos</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Link href="/admin/academias"><Button size="sm">Cadastrar academia</Button></Link>
          <Link href="/admin/unidades"><Button size="sm" variant="secondary">Cadastrar unidade</Button></Link>
          <Link href="/admin/operacional/saude"><Button size="sm" variant="secondary">Saúde operacional</Button></Link>
          <Link href="/admin/compliance"><Button size="sm" variant="secondary">Compliance LGPD</Button></Link>
          <Link href="/admin/seguranca"><Button size="sm" variant="outline">Segurança global</Button></Link>
          <Link href="/admin/importacao-evo"><Button size="sm" variant="outline">Importação EVO</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
