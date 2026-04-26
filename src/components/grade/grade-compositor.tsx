"use client";

import { useMemo, useRef, useState } from "react";
import type {
  Atividade,
  AtividadeGrade,
  DiaSemana,
  Funcionario,
  Sala,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";
import { GradeCompositorPalette } from "./grade-compositor-palette";

const DIA_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DIA_FULL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

const PX_HORA = 60;
const HORA_INI_DEFAULT = 6;
const HORA_FIM_DEFAULT = 22;
const SNAP_MIN = 15;

type DragGhost = {
  dia: DiaSemana;
  horaInicio: string;
  duracao: number;
  atividade?: Atividade;
} | null;

function toMinutes(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function fmt(min: number) {
  const safe = Math.max(0, min);
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
}

/** Snap em incrementos de 15min. */
function snapMin(min: number, snap = SNAP_MIN) {
  return Math.round(min / snap) * snap;
}

export interface GradeCompositorDropPayload {
  atividadeId: string;
  dia: DiaSemana;
  horaInicio: string;
}

export interface GradeCompositorMovePayload {
  gradeId: string;
  dia: DiaSemana;
  horaInicio: string;
}

export interface GradeCompositorProps {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
  /** Disparado quando o usuário arrasta uma modalidade da palette pro canvas. */
  onDropNewAtividade: (payload: GradeCompositorDropPayload) => void;
  /** Disparado quando arrasta um card existente pra outro slot. */
  onMoveExisting: (payload: GradeCompositorMovePayload) => void;
  /** Click num card existente abre o modal de edição. */
  onEditExisting: (grade: AtividadeGrade) => void;
  /** Click numa modalidade da palette (alternativa ao drag) — abre modal pré-preenchido. */
  onPickAtividade: (atividadeId: string) => void;
}

export function GradeCompositor({
  grades,
  atividades,
  salas,
  funcionarios,
  onDropNewAtividade,
  onMoveExisting,
  onEditExisting,
  onPickAtividade,
}: GradeCompositorProps) {
  const [draggingAtividadeId, setDraggingAtividadeId] = useState<string | null>(null);
  const [draggingGradeId, setDraggingGradeId] = useState<string | null>(null);
  const [ghost, setGhost] = useState<DragGhost>(null);
  const columnRefs = useRef<Map<DiaSemana, HTMLDivElement | null>>(new Map());

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(
    () => new Map(funcionarios.map((f) => [f.id, f])),
    [funcionarios],
  );

  const cardsByDay = useMemo(() => {
    const grouped: Record<DiaSemana, (AtividadeGrade & { atividade: Atividade })[]> = {
      SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [], DOM: [],
    };
    grades.forEach((g) => {
      if (g.definicaoHorario !== "PREVIAMENTE") return;
      const a = atividadeMap.get(g.atividadeId);
      if (!a) return;
      g.diasSemana.forEach((dia) => {
        grouped[dia].push({ ...g, atividade: a });
      });
    });
    return grouped;
  }, [grades, atividadeMap]);

  const { hourIni, hourFim } = useMemo(() => {
    let ini = HORA_INI_DEFAULT;
    let fim = HORA_FIM_DEFAULT;
    DIA_ORDER.forEach((d) => {
      cardsByDay[d].forEach((c) => {
        const sh = Math.floor(toMinutes(c.horaInicio) / 60);
        const eh = Math.ceil((toMinutes(c.horaInicio) + c.duracaoMinutos) / 60);
        if (sh < ini) ini = sh;
        if (eh > fim) fim = eh;
      });
    });
    return {
      hourIni: Math.max(0, ini),
      hourFim: Math.min(24, Math.max(fim, ini + 4)),
    };
  }, [cardsByDay]);

  const horas = useMemo(() => {
    const out: number[] = [];
    for (let h = hourIni; h < hourFim; h++) out.push(h);
    return out;
  }, [hourIni, hourFim]);
  const totalH = horas.length * PX_HORA;

  function pointToHora(dia: DiaSemana, clientY: number): string | null {
    const ref = columnRefs.current.get(dia);
    if (!ref) return null;
    const rect = ref.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    if (offsetY < 0 || offsetY > rect.height) return null;
    const totalMin = (offsetY / PX_HORA) * 60 + hourIni * 60;
    return fmt(snapMin(totalMin));
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>, dia: DiaSemana) {
    e.preventDefault();
    e.dataTransfer.dropEffect = draggingGradeId ? "move" : "copy";
    const horaInicio = pointToHora(dia, e.clientY);
    if (!horaInicio) {
      setGhost(null);
      return;
    }
    if (draggingAtividadeId) {
      const ativ = atividadeMap.get(draggingAtividadeId);
      setGhost({ dia, horaInicio, duracao: 60, atividade: ativ });
    } else if (draggingGradeId) {
      const moving = grades.find((g) => g.id === draggingGradeId);
      if (moving) {
        const ativ = atividadeMap.get(moving.atividadeId);
        setGhost({ dia, horaInicio, duracao: moving.duracaoMinutos, atividade: ativ });
      }
    }
  }

  function handleDragLeave() {
    setGhost(null);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>, dia: DiaSemana) {
    e.preventDefault();
    const atividadeId = e.dataTransfer.getData("text/atividade-id");
    const gradeId = e.dataTransfer.getData("text/grade-id");
    const horaInicio = pointToHora(dia, e.clientY);
    setGhost(null);
    setDraggingAtividadeId(null);
    setDraggingGradeId(null);
    if (!horaInicio) return;
    if (atividadeId) {
      onDropNewAtividade({ atividadeId, dia, horaInicio });
    } else if (gradeId) {
      onMoveExisting({ gradeId, dia, horaInicio });
    }
  }

  return (
    <div className="grid grid-cols-[260px_1fr] overflow-hidden rounded-xl border border-border bg-card">
      <GradeCompositorPalette
        atividades={atividades}
        funcionarios={funcionarios}
        onDragAtividade={(id) => setDraggingAtividadeId(id)}
        onPickAtividade={onPickAtividade}
      />

      <div className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-border bg-card px-4 py-2.5 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Compositor visual</p>
          <span className="opacity-50">·</span>
          <p>Arraste da biblioteca pro canvas, ou clique num card pra editar</p>
          <span className="ml-auto">Snap: {SNAP_MIN}min</span>
        </div>

        <div className="overflow-auto">
          <div className="min-w-[1080px]">
            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))] border-b border-border">
              <div />
              {DIA_ORDER.map((dia) => (
                <div key={dia} className="border-l border-border px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {DIA_FULL[dia]}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {cardsByDay[dia].length} aulas
                  </p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
              <div className="border-r border-border bg-card" style={{ height: totalH }}>
                {horas.map((h) => (
                  <div
                    key={h}
                    className="pr-2 pt-1 text-right text-[11px] font-medium text-muted-foreground"
                    style={{ height: PX_HORA }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {DIA_ORDER.map((dia) => (
                <DayColumn
                  key={dia}
                  dia={dia}
                  cards={cardsByDay[dia]}
                  hourIni={hourIni}
                  totalH={totalH}
                  ghost={ghost}
                  draggingGradeId={draggingGradeId}
                  refSetter={(el) => columnRefs.current.set(dia, el)}
                  onDragOver={(e) => handleDragOver(e, dia)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dia)}
                  onCardDragStart={(g, e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/grade-id", g.id);
                    setDraggingGradeId(g.id);
                  }}
                  onCardDragEnd={() => {
                    setDraggingGradeId(null);
                    setGhost(null);
                  }}
                  onCardClick={onEditExisting}
                  salaMap={salaMap}
                  funcionarioMap={funcionarioMap}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface DayColumnProps {
  dia: DiaSemana;
  cards: (AtividadeGrade & { atividade: Atividade })[];
  hourIni: number;
  totalH: number;
  ghost: DragGhost;
  draggingGradeId: string | null;
  refSetter: (el: HTMLDivElement | null) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onCardDragStart: (g: AtividadeGrade, e: React.DragEvent<HTMLButtonElement>) => void;
  onCardDragEnd: () => void;
  onCardClick: (g: AtividadeGrade) => void;
  salaMap: Map<string, Sala>;
  funcionarioMap: Map<string, Funcionario>;
}

function DayColumn({
  dia,
  cards,
  hourIni,
  totalH,
  ghost,
  draggingGradeId,
  refSetter,
  onDragOver,
  onDragLeave,
  onDrop,
  onCardDragStart,
  onCardDragEnd,
  onCardClick,
  salaMap,
  funcionarioMap,
}: DayColumnProps) {
  const showGhost = ghost && ghost.dia === dia && ghost.atividade;
  const ghostCor = showGhost && ghost.atividade ? getModalidadeCor(ghost.atividade) : null;

  return (
    <div
      ref={refSetter}
      className="relative border-l border-border"
      style={{ height: totalH }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {Array.from({ length: Math.floor(totalH / PX_HORA) }).map((_, i) =>
        i === 0 ? null : (
          <div
            key={i}
            className="absolute left-0 right-0 border-t border-border/50"
            style={{ top: i * PX_HORA }}
          />
        ),
      )}
      {Array.from({ length: Math.floor(totalH / PX_HORA) }).map((_, i) => (
        <div
          key={`half-${i}`}
          className="absolute left-0 right-0 border-t border-dashed border-border/30"
          style={{ top: i * PX_HORA + PX_HORA / 2 }}
        />
      ))}

      {cards.map((c) => {
        const cor = getModalidadeCor(c.atividade);
        const top = ((toMinutes(c.horaInicio) - hourIni * 60) / 60) * PX_HORA;
        const heightPx = (c.duracaoMinutos / 60) * PX_HORA - 3;
        const sala = c.salaId ? salaMap.get(c.salaId) : null;
        const prof = c.funcionarioId ? funcionarioMap.get(c.funcionarioId) : null;
        return (
          <button
            key={`${c.id}-${dia}`}
            type="button"
            draggable
            onClick={() => onCardClick(c)}
            onDragStart={(e) => onCardDragStart(c, e)}
            onDragEnd={onCardDragEnd}
            className={cn(
              "absolute left-1 right-1 cursor-grab overflow-hidden rounded-md border border-border text-left shadow-sm transition hover:shadow-md active:cursor-grabbing",
              draggingGradeId === c.id && "opacity-40",
            )}
            style={{
              top,
              height: heightPx,
              background: cor.bg,
              borderLeftColor: cor.cor,
              borderLeftWidth: 3,
            }}
            title={`${c.atividade.nome} · ${c.horaInicio}–${c.horaFim || ""}${prof ? ` · ${prof.nome}` : ""}${sala ? ` · ${sala.nome}` : ""}`}
          >
            <div className="px-2 py-1">
              <p
                className="truncate text-[11px] font-bold leading-tight"
                style={{ color: cor.text }}
              >
                {c.atividade.nome}
              </p>
              {heightPx >= 36 ? (
                <p
                  className="font-mono text-[10px] opacity-80"
                  style={{ color: cor.text }}
                >
                  {c.horaInicio}
                </p>
              ) : null}
              {heightPx >= 60 && (prof || sala) ? (
                <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                  {prof?.nome.split(" ")[0] ?? ""}
                  {prof && sala ? " · " : ""}
                  {sala?.nome.split("·")[0].trim() ?? ""}
                </p>
              ) : null}
            </div>
          </button>
        );
      })}

      {showGhost && ghostCor ? (
        <div
          className="pointer-events-none absolute left-1 right-1 rounded-md border-2 border-dashed px-2 py-1"
          style={{
            top: ((toMinutes(ghost.horaInicio) - hourIni * 60) / 60) * PX_HORA,
            height: (ghost.duracao / 60) * PX_HORA - 3,
            borderColor: ghostCor.cor,
            background: ghostCor.bg,
          }}
        >
          <p className="text-[10px] font-bold" style={{ color: ghostCor.text }}>
            + {ghost.atividade?.nome ?? ""} · {ghost.horaInicio}
          </p>
        </div>
      ) : null}
    </div>
  );
}
