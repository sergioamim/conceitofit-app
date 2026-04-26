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
import { ArrowLeft, Calendar, Dumbbell, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { cn } from "@/lib/utils";

// ─── MOCK realístico (será substituído por endpoint real em Wave 6.5) ───
function buildMockData(seed: string) {
  // Hash determinístico simples baseado no alunoId pra dados consistentes
  const h = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 7);
  const rand = (i: number) => {
    const x = Math.sin(h + i) * 10000;
    return x - Math.floor(x);
  };

  // Progressão de carga: 12 semanas, supino reto
  const progressao = Array.from({ length: 12 }, (_, i) => ({
    semana: i + 1,
    cargaKg: Math.round(60 + i * 2.2 + (rand(i) - 0.5) * 4),
  }));

  // Heatmap adesão: últimas 12 semanas (84 dias)
  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const r = rand(i + 100);
    if (r < 0.55) return 0; // dia sem treino
    if (r < 0.78) return 1; // 1 sessão
    if (r < 0.92) return 2; // 2 sessões
    return 3; // 3+ sessões
  });

  // Histórico (últimas 8 sessões)
  const sessoes = ["A — Peito/Tríceps", "B — Costas/Bíceps", "C — Pernas/Ombros"];
  const historico = Array.from({ length: 8 }, (_, i) => ({
    id: `sess-${i}`,
    data: new Date(Date.now() - i * 86400000 * 2).toISOString().slice(0, 10),
    sessao: sessoes[i % sessoes.length],
    volume: Math.round(8500 + (rand(i + 200) - 0.5) * 2000),
    pr: rand(i + 300) > 0.85,
  }));

  const adesaoPct = Math.round(
    (heatmap.filter((v) => v > 0).length / heatmap.length) * 100,
  );

  return { progressao, heatmap, historico, adesaoPct };
}

export default function ProgressoAlunoPage() {
  const params = useParams<{ alunoId: string }>();
  const alunoId = params?.alunoId ?? "";

  // TODO Wave 6.5: substituir mock por fetch ao endpoint real quando
  // backend expor /api/v1/treinos/aluno/{alunoId}/progresso.
  const data = useMemo(() => buildMockData(alunoId), [alunoId]);

  // SVG line chart bounds
  const chartW = 680;
  const chartH = 200;
  const padding = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = chartW - padding.left - padding.right;
  const innerH = chartH - padding.top - padding.bottom;
  const maxCarga = Math.max(...data.progressao.map((p) => p.cargaKg));
  const minCarga = Math.min(...data.progressao.map((p) => p.cargaKg));
  const cargaRange = maxCarga - minCarga || 1;

  const points = data.progressao.map((p, i) => {
    const x = padding.left + (i / (data.progressao.length - 1)) * innerW;
    const y = padding.top + innerH - ((p.cargaKg - minCarga) / cargaRange) * innerH;
    return { x, y, ...p };
  });
  const pathD = points
    .map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`))
    .join(" ");

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Treinos", href: "/treinos" },
          { label: "Atribuídos", href: "/treinos/atribuidos" },
          { label: `Aluno ${alunoId.slice(0, 8)}` },
        ]}
      />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Progresso do aluno
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Carga ao longo do tempo, adesão semanal e histórico de execuções.
            <span className="ml-2 italic">
              (dados mockados — endpoint backend pendente)
            </span>
          </p>
        </div>
        <Button asChild variant="outline" className="border-border">
          <Link href="/treinos/atribuidos">
            <ArrowLeft className="mr-1 size-4" />
            Atribuições
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard
          icon={<TrendingUp className="size-4 text-gym-accent" />}
          label="Adesão (12 semanas)"
          value={`${data.adesaoPct}%`}
          detail={`${data.heatmap.filter((v) => v > 0).length} dias com treino`}
        />
        <KpiCard
          icon={<Dumbbell className="size-4 text-gym-accent" />}
          label="Carga máx (supino)"
          value={`${maxCarga} kg`}
          detail={`+${maxCarga - minCarga} kg em 12 semanas`}
        />
        <KpiCard
          icon={<Calendar className="size-4 text-gym-accent" />}
          label="Última sessão"
          value={data.historico[0]?.data ?? "—"}
          detail={data.historico[0]?.sessao ?? ""}
        />
      </div>

      {/* Progressão de carga (SVG line chart) */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="font-display text-base">
            Progressão de carga · Supino reto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <svg
            viewBox={`0 0 ${chartW} ${chartH}`}
            className="w-full"
            role="img"
            aria-label="Gráfico de progressão de carga"
          >
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
            {/* Linha de progressão */}
            <path
              d={pathD}
              stroke="currentColor"
              className="text-gym-accent"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Pontos */}
            {points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={3}
                fill="currentColor"
                className="text-gym-accent"
              >
                <title>{`Semana ${p.semana}: ${p.cargaKg} kg`}</title>
              </circle>
            ))}
          </svg>
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
        <CardHeader>
          <CardTitle className="font-display text-base">
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
                  <th className="px-2 py-2 text-right">Volume (kg)</th>
                  <th className="px-2 py-2 text-left">PR</th>
                </tr>
              </thead>
              <tbody>
                {data.historico.map((h) => (
                  <tr key={h.id} className="border-b border-border/40 hover:bg-secondary/40">
                    <td className="px-2 py-2 font-mono text-xs">{h.data}</td>
                    <td className="px-2 py-2">{h.sessao}</td>
                    <td className="px-2 py-2 text-right tabular-nums">
                      {h.volume.toLocaleString("pt-BR")}
                    </td>
                    <td className="px-2 py-2">
                      {h.pr ? (
                        <Badge className="bg-yellow-500/15 text-yellow-300">PR</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="font-display text-2xl font-bold">{value}</div>
        <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}
