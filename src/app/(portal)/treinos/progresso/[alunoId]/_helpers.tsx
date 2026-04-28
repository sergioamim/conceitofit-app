"use client";

/**
 * Helpers da tela /treinos/progresso/[alunoId].
 *
 * Extraído pra manter a page sob o limite de 500 linhas. Inclui:
 * - buildMockData: gerador determinístico (alunoId → mesmas séries)
 *   usado até o backend expor o endpoint real de progresso/heatmap.
 * - KpiCard, ChartStat: blocos de UI reusados na page.
 */

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Âncora de data fixa para o mock — evita Date.now() no render path
// (regra de hidratação do CLAUDE.md). Quando o endpoint real chegar
// na Wave 6.5, este helper é substituído integralmente.
const MOCK_ANCHOR_DATE = "2026-04-25";

function offsetIsoDate(anchorIso: string, daysBefore: number): string {
  // Calcula data ISO N dias antes da âncora SEM usar Date.now()/new Date()
  // no render path. Trabalha aritmética puramente em string + epoch.
  // OK porque rodamos sobre uma constante fixa, mesma resposta em
  // server/client renders.
  const epoch = Date.parse(`${anchorIso}T00:00:00Z`);
  const target = epoch - daysBefore * 86400000;
  const d = new Date(target);
  return d.toISOString().slice(0, 10);
}

// ─── MOCK realístico (substituível por endpoint real em Wave 6.5) ───
export function buildMockData(seed: string) {
  const h = seed.split("").reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 7);
  const rand = (i: number) => {
    const x = Math.sin(h + i) * 10000;
    return x - Math.floor(x);
  };

  const progressao = Array.from({ length: 12 }, (_, i) => ({
    semana: i + 1,
    cargaKg: Math.round(60 + i * 2.2 + (rand(i) - 0.5) * 4),
  }));

  const heatmap = Array.from({ length: 84 }, (_, i) => {
    const r = rand(i + 100);
    if (r < 0.55) return 0;
    if (r < 0.78) return 1;
    if (r < 0.92) return 2;
    return 3;
  });

  const sessoesLabels = ["A — Peito/Tríceps", "B — Costas/Bíceps", "C — Pernas/Ombros"];
  const sessoesShort = ["A", "B", "C"];
  const historico = Array.from({ length: 8 }, (_, i) => {
    const idx = i % sessoesLabels.length;
    return {
      id: `sess-${i}`,
      data: offsetIsoDate(MOCK_ANCHOR_DATE, i * 2),
      sessao: sessoesLabels[idx]!,
      sessaoLetra: sessoesShort[idx]!,
      duracaoMin: Math.round(48 + rand(i + 400) * 18),
      volume: Math.round(8500 + (rand(i + 200) - 0.5) * 2000),
      prs: rand(i + 300) > 0.85 ? 1 + Math.round(rand(i + 320)) : 0,
      completa: rand(i + 500) > 0.18,
      notas:
        rand(i + 600) > 0.55
          ? null
          : ["Subiu carga no supino.", "Parou cedo — câimbra.", "PR no leg press."][
              i % 3
            ] ?? null,
    };
  });

  const adesaoPct = Math.round(
    (heatmap.filter((v) => v > 0).length / heatmap.length) * 100,
  );
  const sessoesCompletas = historico.filter((h) => h.completa).length;
  const totalVolume = historico.reduce((s, h) => s + h.volume, 0);
  const totalPRs = historico.reduce((s, h) => s + h.prs, 0);

  return {
    progressao,
    heatmap,
    historico,
    adesaoPct,
    sessoesCompletas,
    totalSessoes: historico.length,
    totalVolume,
    totalPRs,
  };
}

// ─── UI atoms ───
export type KpiTone = "green" | "teal" | "orange" | "red";

const KPI_TONES: Record<KpiTone, { bar: string; value: string }> = {
  green: { bar: "bg-gym-accent", value: "text-gym-accent" },
  teal: { bar: "bg-emerald-400", value: "text-emerald-400" },
  orange: { bar: "bg-amber-400", value: "text-amber-300" },
  red: { bar: "bg-rose-500", value: "text-rose-400" },
};

export function KpiCard({
  icon,
  label,
  value,
  detail,
  tone = "green",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: KpiTone;
}) {
  const palette = KPI_TONES[tone];
  return (
    <Card className="relative overflow-hidden border-border bg-card">
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", palette.bar)}
        aria-hidden
      />
      <CardContent className="p-4">
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className={palette.value}>{icon}</span>
          {label}
        </div>
        <div className={cn("font-display text-2xl font-bold leading-none", palette.value)}>
          {value}
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground">{detail}</div>
      </CardContent>
    </Card>
  );
}

export function ChartStat({
  label,
  value,
  accent,
  positive,
}: {
  label: string;
  value: string;
  accent?: boolean;
  positive?: boolean;
}) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 text-base font-bold",
          accent && "text-gym-accent",
          positive && "text-emerald-400",
        )}
      >
        {value}
      </div>
    </div>
  );
}
