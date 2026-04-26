"use client";

import type { Atividade, AtividadeGrade, DiaSemana, Funcionario, Sala } from "@/lib/types";
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
}

function fmt(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function GradeWeekCard({
  item,
  track,
  trackCount,
  hourIni,
  pxHora,
  salaMap,
  funcionarioMap,
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
          <div className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold text-muted-foreground">
            Cap. {item.capacidade}
          </div>
        ) : null}
      </div>
    </button>
  );
}
