"use client";

import type {
  Atividade,
  AtividadeGrade,
  AulaSessao,
  DiaSemana,
  Funcionario,
  Sala,
} from "@/lib/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";

export type GradeCardItem = AtividadeGrade & {
  atividade: Atividade;
  diaExibicao: DiaSemana;
  inicioMin: number;
  fimMin: number;
};

export interface GradeWeekCardProps {
  item: GradeCardItem;
  track: number;
  trackCount: number;
  hourIni: number;
  pxHora: number;
  salaMap: Map<string, Sala>;
  funcionarioMap: Map<string, Funcionario>;
  /** Sessão materializada (data específica) — quando presente exibe ocupação real. */
  sessao?: AulaSessao;
}

function fmt(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function ocupacaoColor(pct: number): string {
  if (pct >= 1) return "var(--gym-danger)";
  if (pct >= 0.85) return "var(--gym-warning)";
  return "var(--gym-teal)";
}

export function GradeWeekCard({
  item,
  track,
  trackCount,
  hourIni,
  pxHora,
  salaMap,
  funcionarioMap,
  sessao,
}: GradeWeekCardProps) {
  const top = ((item.inicioMin - hourIni * 60) / 60) * pxHora;
  const heightPx = (item.duracaoMinutos / 60) * pxHora - 3;
  const widthPct = 100 / trackCount;
  const cor = getModalidadeCor(item.atividade);
  const sala = item.salaId ? salaMap.get(item.salaId) : null;
  const prof = item.funcionarioId ? funcionarioMap.get(item.funcionarioId) : null;
  const horaFimLabel = item.horaFim || fmt(item.fimMin);
  const profNome = prof?.nome ?? item.instrutor ?? "";
  const localNome = sala?.nome.split("·")[0].trim() ?? item.local ?? "";

  const capacidade = sessao?.capacidade ?? item.capacidade;
  const ocupadas = sessao?.vagasOcupadas;
  const pctOcup = ocupadas != null && capacidade > 0 ? Math.min(ocupadas / capacidade, 1) : null;
  const lotada = pctOcup != null && pctOcup >= 1;

  // Layout adaptativo por densidade de tracks.
  // tight = card muito estreito (3+ overlapping); compact = 2 overlapping; comfy = sem overlap.
  const tight = trackCount >= 3;
  const compact = trackCount === 2;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="group absolute overflow-hidden rounded-lg border border-border text-left shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-gym-accent/30"
          style={{
            top,
            height: heightPx,
            left: `calc(${track * widthPct}% + 3px)`,
            width: `calc(${widthPct}% - 6px)`,
            background: cor.bg,
            borderLeftColor: cor.cor,
            borderLeftWidth: 3,
          }}
        >
          <div
            className={cn(
              "flex h-full min-h-0 flex-col gap-0.5",
              tight ? "px-1 py-0.5" : compact ? "px-1.5 py-0.5" : "px-2 py-1",
            )}
          >
            <div className="flex items-start gap-1.5">
              <span
                className={cn(
                  "flex-1 truncate font-bold leading-tight",
                  tight ? "text-[10px]" : compact ? "text-[11px]" : "text-xs",
                )}
                style={{ color: cor.text }}
              >
                {item.atividade.nome}
              </span>
              {!tight ? (
                <span
                  className={cn(
                    "shrink-0 font-mono leading-tight",
                    compact ? "text-[9px]" : "text-[10px]",
                    pctOcup != null && lotada ? "font-bold" : "font-semibold",
                  )}
                  style={{
                    color:
                      pctOcup != null
                        ? ocupacaoColor(pctOcup)
                        : "var(--muted-foreground)",
                  }}
                  aria-label={pctOcup != null ? "Ocupação" : "Capacidade"}
                >
                  {pctOcup != null ? `${ocupadas}/${capacidade}` : capacidade}
                </span>
              ) : null}
              {!tight && !compact && item.atividade.checkinObrigatorio ? (
                <span
                  className="mt-0.5 size-1.5 shrink-0 rounded-full"
                  style={{ background: cor.cor }}
                  aria-label="Check-in obrigatório"
                />
              ) : null}
            </div>
            <p
              className={cn(
                "font-mono leading-tight opacity-80",
                tight ? "text-[9px]" : "text-[10px]",
              )}
              style={{ color: cor.text }}
            >
              {tight ? item.horaInicio : `${item.horaInicio}–${horaFimLabel}`}
            </p>
            {!tight && heightPx >= 56 && (profNome || localNome) ? (
              <p className="truncate text-[10px] leading-tight text-muted-foreground">
                {profNome.split(" ")[0]}
                {profNome && localNome && !compact ? " · " : ""}
                {compact ? "" : localNome}
              </p>
            ) : null}
            {!tight && pctOcup != null && heightPx >= 64 ? (
              <div className="mt-auto h-[3px] overflow-hidden rounded bg-foreground/10">
                <div
                  className="h-full transition-all"
                  style={{ width: `${pctOcup * 100}%`, background: ocupacaoColor(pctOcup) }}
                />
              </div>
            ) : null}
          </div>
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" align="start" className="max-w-xs space-y-0.5 p-2.5 text-left">
        <p className="text-sm font-bold" style={{ color: cor.cor }}>
          {item.atividade.nome}
        </p>
        <p className="font-mono text-[11px] opacity-80">
          {item.horaInicio}–{horaFimLabel} · {item.duracaoMinutos}min
        </p>
        {profNome ? (
          <p className="text-[11px]">
            <span className="opacity-60">Prof.</span> {profNome}
          </p>
        ) : null}
        {localNome ? (
          <p className="text-[11px]">
            <span className="opacity-60">Local:</span> {localNome}
          </p>
        ) : null}
        <p className="text-[11px]">
          <span className="opacity-60">{pctOcup != null ? "Ocupação:" : "Capacidade:"}</span>{" "}
          {pctOcup != null ? `${ocupadas}/${capacidade} (${Math.round(pctOcup * 100)}%)` : capacidade}
        </p>
        {item.atividade.checkinObrigatorio ? (
          <p className="text-[11px] font-semibold" style={{ color: "var(--gym-warning)" }}>
            Check-in obrigatório
          </p>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
