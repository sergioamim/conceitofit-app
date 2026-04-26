"use client";

/**
 * Tela de Progresso do Aluno (Wave 6 PRD V3).
 * Rota: /treinos/progresso/[alunoId]
 *
 * 3 visões: gráfico de progressão de carga (SVG line), heatmap de
 * adesão (CSS grid 7 cols × N semanas) e histórico em lista.
 *
 * **Backend ainda não tem endpoint agregado de progresso/heatmap.**
 * Implementação atual usa MOCK realístico baseado no alunoId — assim
 * que o endpoint existir, basta plugar no useEffect de carga. TODO
 * marcado nos pontos de fetch.
 */

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Award, Dumbbell, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { cn } from "@/lib/utils";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { getAlunoApi } from "@/lib/api/alunos";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";
import { formatDate } from "@/lib/formatters";
import { buildMockData, ChartStat, KpiCard } from "./_helpers";

export default function ProgressoAlunoPage() {
  const params = useParams<{ alunoId: string }>();
  const alunoId = params?.alunoId ?? "";
  const { tenantId, tenantResolved } = useTenantContext();

  // TODO Wave 6.5: substituir mock por fetch ao endpoint real quando
  // backend expor /api/v1/treinos/aluno/{alunoId}/progresso.
  const data = useMemo(() => buildMockData(alunoId), [alunoId]);

  // Aluno (nome + objetivo via observações médicas / status — best-effort)
  const { data: aluno } = useQuery({
    queryKey: ["aluno-detail", tenantId, alunoId],
    enabled: Boolean(tenantId && alunoId && tenantResolved),
    queryFn: () => getAlunoApi({ tenantId: tenantId!, id: alunoId }),
    staleTime: 60_000,
  });

  // SVG line chart bounds (com gradient fill + value labels)
  const chartW = 680;
  const chartH = 200;
  const padding = { top: 22, right: 16, bottom: 32, left: 40 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;
  const maxCarga = Math.max(...data.progressao.map((p) => p.cargaKg));
  const minCarga = Math.min(...data.progressao.map((p) => p.cargaKg));
  const cargaRange = maxCarga - minCarga || 1;
  const ganhoKg = maxCarga - minCarga;
  const ganhoPct = minCarga > 0 ? Math.round((ganhoKg / minCarga) * 100) : 0;

  const points = data.progressao.map((p, i) => {
    const x = padding.left + (i / (data.progressao.length - 1)) * innerW;
    const y = padding.top + innerH - ((p.cargaKg - minCarga) / cargaRange) * innerH;
    return { x, y, ...p };
  });
  const pathD = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");
  // Área para gradient fill (fecha embaixo)
  const areaD = `${pathD} L${points[points.length - 1]!.x},${chartH - padding.bottom} L${points[0]!.x},${chartH - padding.bottom} Z`;

  const alunoNome = aluno?.nome ?? `Aluno ${alunoId.slice(0, 8)}`;
  const alunoCor = grupoColorByName(alunoNome);
  const alunoInicial = alunoNome.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Atribuídos", href: "/treinos/atribuidos" },
          { label: alunoNome },
        ]}
      />

      {/* Voltar */}
      <div>
        <Button asChild variant="outline" size="sm" className="border-border">
          <Link href="/treinos/atribuidos">
            <ArrowLeft className="mr-1 size-4" />
            Atribuições
          </Link>
        </Button>
      </div>

      {/* Header — avatar + dados do aluno + treino atual à direita */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-wrap items-center gap-4 p-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-full font-display text-xl font-bold text-black"
            style={{ background: alunoCor }}
            aria-hidden
          >
            {alunoInicial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-xl font-bold tracking-tight">
              {alunoNome}
            </h1>
            <p className="text-sm text-muted-foreground">
              {aluno?.status ? `Status: ${aluno.status}` : "—"}
              {aluno?.estadoAtual?.dataInicioTreino
                ? ` · Treino desde ${formatDate(aluno.estadoAtual.dataInicioTreino)}`
                : null}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Treino atual
            </div>
            <div className="text-sm font-medium">
              {aluno?.estadoAtual?.descricaoContratoAtual ?? "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs — 4 cards com cor de borda top */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          tone="green"
          icon={<TrendingUp className="size-4" />}
          label="Adesão (12 semanas)"
          value={`${data.adesaoPct}%`}
          detail={`${data.heatmap.filter((v) => v > 0).length} dias com treino`}
        />
        <KpiCard
          tone="teal"
          icon={<Dumbbell className="size-4" />}
          label="Sessões completas"
          value={`${data.sessoesCompletas}/${data.totalSessoes}`}
          detail="últimas 8 execuções"
        />
        <KpiCard
          tone="orange"
          icon={<Dumbbell className="size-4" />}
          label="Volume total"
          value={`${(data.totalVolume / 1000).toFixed(1)}t`}
          detail="↑ 12% mês anterior"
        />
        <KpiCard
          tone="red"
          icon={<Award className="size-4" />}
          label="PRs no período"
          value={String(data.totalPRs)}
          detail={
            data.totalPRs > 0 ? "↑ supino, leg press" : "sem PRs registrados"
          }
        />
      </div>

      {/* Progressão de carga (SVG line chart com gradient fill) */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
          <div>
            <CardTitle className="font-display text-sm font-bold">
              Progressão · Supino reto
            </CardTitle>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Carga máxima por semana · últimas 12 semanas
            </p>
          </div>
          <select
            className="rounded-md border border-border bg-secondary px-3 py-1.5 text-xs"
            defaultValue="supino"
            aria-label="Exercício para análise"
          >
            <option value="supino">Supino reto</option>
            <option value="agachamento">Agachamento livre</option>
            <option value="leg-press">Leg Press 45°</option>
            <option value="puxada">Puxada frontal</option>
          </select>
        </CardHeader>
        <CardContent>
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full"
            role="img"
            aria-label="Gráfico de progressão de carga"
          >
            <defs>
              <linearGradient id="cargaGrad" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="currentColor"
                  className="text-gym-accent"
                  stopOpacity={0.35}
                />
                <stop
                  offset="100%"
                  stopColor="currentColor"
                  className="text-gym-accent"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            {/* Eixo Y labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const val = Math.round(minCarga + t * cargaRange);
              const y = padding.top + innerH - t * innerH;
              return (
                <g key={t}>
                  <line
                    x1={padding.left}
                    x2={chartW - padding.right}
                    y1={y}
                    y2={y}
                    stroke="currentColor"
                    strokeOpacity={0.08}
                    strokeDasharray="2,3"
                  />
                  <text
                    x={padding.left - 6}
                    y={y + 3}
                    textAnchor="end"
                    fill="currentColor"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {val}
                  </text>
                </g>
              );
            })}
            {/* Eixo X labels */}
            {points.map((p, i) =>
              i % 2 === 0 ? (
                <text
                  key={i}
                  x={p.x}
                  y={chartH - 8}
                  textAnchor="middle"
                  fill="currentColor"
                  className="fill-muted-foreground text-[10px]"
                >
                  S{p.semana}
                </text>
              ) : null,
            )}
            {/* Área (gradient fill) */}
            <path d={areaD} fill="url(#cargaGrad)" />
            {/* Linha */}
            <path
              d={pathD}
              stroke="currentColor"
              className="text-gym-accent"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pontos + labels nos extremos e mudanças */}
            {points.map((p, i) => {
              const prev = points[i - 1];
              const showLabel =
                i === 0 || i === points.length - 1 || (prev && prev.cargaKg !== p.cargaKg);
              return (
                <g key={i}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3.5}
                    fill="currentColor"
                    className="text-gym-accent"
                  >
                    <title>{`Semana ${p.semana}: ${p.cargaKg} kg`}</title>
                  </circle>
                  {showLabel ? (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      textAnchor="middle"
                      fill="currentColor"
                      className="fill-foreground font-display text-[10px] font-bold"
                    >
                      {p.cargaKg}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {/* Stats abaixo: Início / Atual / Ganho / Variação */}
          <div className="mt-3 flex flex-wrap gap-x-8 gap-y-3 border-t border-border pt-3">
            <ChartStat label="Início" value={`${minCarga} kg`} />
            <ChartStat label="Atual" value={`${maxCarga} kg`} accent />
            <ChartStat
              label="Ganho"
              value={`+${ganhoKg.toFixed(1)} kg`}
              positive
            />
            <ChartStat label="Variação" value={`+${ganhoPct}%`} positive />
          </div>
        </CardContent>
      </Card>

      {/* Heatmap de adesão (CSS grid 7×12) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">
            Heatmap de adesão · últimas 12 semanas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <div className="grid grid-cols-12 gap-1">
              {/* 12 colunas (semanas), 7 linhas (dias da semana) */}
              {Array.from({ length: 12 }, (_, weekIdx) => (
                <div key={weekIdx} className="grid grid-rows-7 gap-1">
                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const cellIdx = weekIdx * 7 + dayIdx;
                    const intensity = data.heatmap[cellIdx] ?? 0;
                    return (
                      <div
                        key={dayIdx}
                        className={cn(
                          "size-3 rounded-sm",
                          intensity === 0 && "bg-secondary",
                          intensity === 1 && "bg-gym-accent/30",
                          intensity === 2 && "bg-gym-accent/60",
                          intensity === 3 && "bg-gym-accent",
                        )}
                        title={`${intensity} sessão(ões)`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>Menos</span>
              <span className="size-3 rounded-sm bg-secondary" />
              <span className="size-3 rounded-sm bg-gym-accent/30" />
              <span className="size-3 rounded-sm bg-gym-accent/60" />
              <span className="size-3 rounded-sm bg-gym-accent" />
              <span>Mais</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de execuções */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-sm font-bold">
            Histórico de execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="px-2 py-2 text-left">Data</th>
                  <th className="px-2 py-2 text-left">Sessão</th>
                  <th className="px-2 py-2 text-left">Duração</th>
                  <th className="px-2 py-2 text-right">Volume (kg)</th>
                  <th className="px-2 py-2 text-left">PRs</th>
                  <th className="px-2 py-2 text-left">Status</th>
                  <th className="px-2 py-2 text-left">Notas</th>
                </tr>
              </thead>
              <tbody>
                {data.historico.map((h) => (
                  <tr
                    key={h.id}
                    className="border-b border-border/40 hover:bg-secondary/40"
                  >
                    <td className="px-2 py-2 font-display text-xs font-bold">
                      {formatDate(h.data)}
                    </td>
                    <td className="px-2 py-2">
                      <span className="inline-flex size-6 items-center justify-center rounded-md border border-border bg-secondary font-display text-[11px] font-bold">
                        {h.sessaoLetra}
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {h.sessao.split("—")[1]?.trim() ?? h.sessao}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {h.duracaoMin} min
                    </td>
                    <td className="px-2 py-2 text-right font-display font-semibold tabular-nums">
                      {h.volume.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2">
                      {h.prs > 0 ? (
                        <span className="inline-flex items-center gap-1 text-gym-accent">
                          <Award className="size-3" />
                          <b>{h.prs}</b>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {h.completa ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                        >
                          Completo
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 bg-amber-500/10 text-amber-300"
                        >
                          Parcial
                        </Badge>
                      )}
                    </td>
                    <td className="px-2 py-2 text-xs text-muted-foreground">
                      {h.notas ?? <span className="text-muted-foreground/60">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] italic text-muted-foreground/60">
            Dados mockados — endpoint backend de histórico ainda pendente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

