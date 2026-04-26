"use client";

import type {
  Atividade,
  AtividadeGrade,
  AulaSessao,
  DiaSemana,
  Funcionario,
  Sala,
} from "@/lib/types";
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

  return (
    <button
      type="button"
      className="group absolute overflow-hidden rounded-lg border border-border text-left shadow-sm transition hover:shadow-md hover:ring-2 hover:ring-gym-accent/30"
      style={{
        top,
        height: heightPx,
        left: `calc(${track * widthPct}% + 4px)`,
        width: `calc(${widthPct}% - 8px)`,
        background: cor.bg,
        borderLeftColor: cor.cor,
        borderLeftWidth: 3,
      }}
      title={`${item.atividade.nome} · ${item.horaInicio}–${horaFimLabel}${profNome ? ` · ${profNome}` : ""}${localNome ? ` · ${localNome}` : ""}`}
    >
      <div className="px-2 py-1.5">
        <div className="flex items-start gap-1.5">
          <span
            className="flex-1 truncate text-xs font-bold leading-tight"
            style={{ color: cor.text }}
          >
            {item.atividade.nome}
          </span>
          {item.atividade.checkinObrigatorio ? (
            <span
              className="mt-1 size-1.5 shrink-0 rounded-full"
              style={{ background: cor.cor }}
              aria-label="Check-in obrigatório"
            />
          ) : null}
        </div>
        <p
          className="mt-0.5 font-mono text-[10px] opacity-80"
          style={{ color: cor.text }}
        >
          {item.horaInicio}–{horaFimLabel}
        </p>
        {heightPx >= 48 && (profNome || localNome) ? (
          <p className="mt-1 truncate text-[10px] text-muted-foreground">
            {profNome.split(" ")[0]}
            {profNome && localNome ? " · " : ""}
            {localNome}
          </p>
        ) : null}
        {heightPx >= 70 ? (
          <div className="absolute bottom-1.5 left-2 right-2 flex items-center gap-1.5 text-[10px]">
            {pctOcup != null ? (
              <>
                <div className="h-[3px] flex-1 overflow-hidden rounded bg-foreground/10">
                  <div
                    className="h-full"
                    style={{ width: `${pctOcup * 100}%`, background: ocupacaoColor(pctOcup) }}
                  />
                </div>
                <span
                  className="font-mono font-semibold"
                  style={{ color: lotada ? "var(--gym-danger)" : "var(--muted-foreground)" }}
                >
                  {ocupadas}/{capacidade}
                </span>
              </>
            ) : (
              <span className="font-semibold text-muted-foreground">Cap. {capacidade}</span>
            )}
          </div>
        ) : null}
      </div>
    </button>
  );
}
