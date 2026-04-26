"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatDateBR } from "@/lib/formatters";
import { getBusinessTodayDate, getBusinessTodayIso } from "@/lib/business-date";
import type {
  Atividade,
  AtividadeGrade,
  DiaSemana,
  Funcionario,
  HorarioFuncionamento,
  Sala,
} from "@/lib/types";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useGrade } from "@/lib/query/use-grade";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getModalidadeCor } from "@/lib/grade/modalidade-cor";
import { GradeWeekCard, type GradeCardItem } from "./grade-week-card";
import { addDays, assignTracks, startOfWeek, toIsoDate, toMinutes } from "./grade-utils";

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

const PX_HORA = 56;
const HORA_INI_DEFAULT = 6;
const HORA_FIM_DEFAULT = 22;

const EMPTY_GRADES: readonly AtividadeGrade[] = [];
const EMPTY_ATIVIDADES: readonly Atividade[] = [];
const EMPTY_SALAS: readonly Sala[] = [];
const EMPTY_FUNCIONARIOS: readonly Funcionario[] = [];
const EMPTY_HORARIOS: readonly HorarioFuncionamento[] = [];

type CardItem = GradeCardItem;

export function GradeContent() {
  const { tenantId } = useTenantContext();
  const [weekStart, setWeekStart] = useState<Date | null>(null);
  const [nowDate, setNowDate] = useState<Date | null>(null);
  const [activeMods, setActiveMods] = useState<Set<string>>(new Set());

  const { data, isLoading, isError, error } = useGrade({
    tenantId,
    tenantResolved: Boolean(tenantId),
  });

  const grades = data?.grades ?? EMPTY_GRADES;
  const atividades = data?.atividades ?? EMPTY_ATIVIDADES;
  const salas = data?.salas ?? EMPTY_SALAS;
  const funcionarios = data?.funcionarios ?? EMPTY_FUNCIONARIOS;
  const horarios = data?.horarios ?? EMPTY_HORARIOS;

  const atividadeMap = useMemo(() => new Map(atividades.map((a) => [a.id, a])), [atividades]);
  const salaMap = useMemo(() => new Map(salas.map((s) => [s.id, s])), [salas]);
  const funcionarioMap = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const horarioMap = useMemo(() => new Map(horarios.map((h) => [h.dia, h])), [horarios]);

  const modalidades = useMemo(() => {
    const map = new Map<string, Atividade>();
    grades.forEach((g) => {
      const a = atividadeMap.get(g.atividadeId);
      if (a) map.set(a.id, a);
    });
    return Array.from(map.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [grades, atividadeMap]);

  const cardsByDay = useMemo(() => {
    const grouped: Record<DiaSemana, CardItem[]> = {
      SEG: [], TER: [], QUA: [], QUI: [], SEX: [], SAB: [], DOM: [],
    };
    grades.forEach((g) => {
      if (g.definicaoHorario !== "PREVIAMENTE") return;
      if (activeMods.size > 0 && !activeMods.has(g.atividadeId)) return;
      const a = atividadeMap.get(g.atividadeId);
      if (!a) return;
      const inicioMin = toMinutes(g.horaInicio);
      const fimMin = inicioMin + g.duracaoMinutos;
      g.diasSemana.forEach((dia) => {
        grouped[dia].push({ ...g, atividade: a, diaExibicao: dia, inicioMin, fimMin });
      });
    });
    return grouped;
  }, [grades, atividadeMap, activeMods]);

  const sobDemandaCount = useMemo(
    () => grades.filter((g) => g.definicaoHorario === "SOB_DEMANDA").length,
    [grades],
  );

  const { hourIni, hourFim } = useMemo(() => {
    let ini = HORA_INI_DEFAULT;
    let fim = HORA_FIM_DEFAULT;
    DIA_ORDER.forEach((dia) => {
      cardsByDay[dia].forEach((c) => {
        const sh = Math.floor(c.inicioMin / 60);
        const eh = Math.ceil(c.fimMin / 60);
        if (sh < ini) ini = sh;
        if (eh > fim) fim = eh;
      });
    });
    return {
      hourIni: Math.max(0, ini),
      hourFim: Math.min(24, Math.max(fim, ini + 4)),
    };
  }, [cardsByDay]);

  const horas = useMemo(
    () => Array.from({ length: hourFim - hourIni }, (_, i) => hourIni + i),
    [hourIni, hourFim],
  );
  const totalH = horas.length * PX_HORA;

  useEffect(() => {
    setWeekStart(startOfWeek(getBusinessTodayDate(new Date())));
    setNowDate(new Date());
    const id = setInterval(() => setNowDate(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const kpis = useMemo(() => {
    let total = 0;
    let totalMin = 0;
    DIA_ORDER.forEach((dia) => {
      cardsByDay[dia].forEach((c) => {
        total++;
        totalMin += c.duracaoMinutos;
      });
    });
    return { total, totalH: Math.round(totalMin / 60), modCount: modalidades.length };
  }, [cardsByDay, modalidades]);

  const toggleMod = (id: string) => {
    setActiveMods((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!weekStart || !nowDate) {
    return (
      <div className="space-y-4">
        <Header />
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Carregando grade semanal...
        </div>
      </div>
    );
  }

  const weekEnd = addDays(weekStart, 6);
  const todayIso = getBusinessTodayIso(nowDate);
  const weekDays = DIA_ORDER.map((dia, idx) => {
    const date = addDays(weekStart, idx);
    return { dia, date, isoDate: toIsoDate(date), horarioDia: horarioMap.get(dia) };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Header />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Semana anterior"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="rounded-md border border-border bg-card px-3 py-2 text-sm font-medium">
            {formatDateBR(weekStart)} - {formatDateBR(weekEnd)}
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="Próxima semana"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => setWeekStart(startOfWeek(getBusinessTodayDate(new Date())))}
          >
            Hoje
          </Button>
          <Button asChild>
            <Link href="/administrativo/atividades-grade">
              <Plus className="size-4" />
              Nova aula
            </Link>
          </Button>
        </div>
      </div>

      {modalidades.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card px-3 py-2.5">
          <span className="shrink-0 text-xs font-semibold text-muted-foreground">Filtrar:</span>
          {modalidades.map((m) => {
            const cor = getModalidadeCor(m);
            const active = activeMods.size === 0 || activeMods.has(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMod(m.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                  active
                    ? "border-transparent"
                    : "border-dashed border-border opacity-60 hover:opacity-100",
                )}
                style={active ? { background: cor.bg, color: cor.text } : undefined}
              >
                <span className="size-2 rounded-full" style={{ background: cor.cor }} />
                {m.nome}
              </button>
            );
          })}
          {activeMods.size > 0 ? (
            <button
              type="button"
              onClick={() => setActiveMods(new Set())}
              className="ml-auto shrink-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              Limpar filtros
            </button>
          ) : null}
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error instanceof Error ? error.message : "Falha ao carregar grade."}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Carregando grade semanal...
        </div>
      ) : kpis.total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          {grades.length === 0 ? (
            <>
              Nenhuma atividade configurada na grade.{" "}
              <Link
                href="/administrativo/atividades-grade"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                Cadastrar agora
              </Link>
            </>
          ) : (
            "Nenhuma atividade encontrada com os filtros aplicados."
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <div className="min-w-[1120px]">
            <div className="sticky top-0 z-10 grid grid-cols-[64px_repeat(7,minmax(0,1fr))] border-b border-border bg-card">
              <div />
              {weekDays.map((d) => {
                const isToday = d.isoDate === todayIso;
                return (
                  <div
                    key={d.dia}
                    className={cn(
                      "border-l border-border px-3 py-2.5",
                      isToday && "bg-gym-accent/5",
                    )}
                  >
                    <p
                      className={cn(
                        "text-[11px] font-semibold uppercase tracking-wider",
                        isToday ? "text-gym-accent" : "text-muted-foreground",
                      )}
                    >
                      {DIA_FULL[d.dia]}
                    </p>
                    <div className="mt-0.5 flex items-baseline gap-1.5">
                      <span
                        className={cn(
                          "text-xl font-bold leading-none",
                          isToday ? "text-gym-accent" : "text-foreground",
                        )}
                      >
                        {d.date.getDate()}
                      </span>
                      {isToday ? (
                        <span className="rounded-full bg-gym-accent px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                          Hoje
                        </span>
                      ) : null}
                      <span className="text-[11px] text-muted-foreground">
                        {cardsByDay[d.dia].length}{" "}
                        {cardsByDay[d.dia].length === 1 ? "aula" : "aulas"}
                      </span>
                    </div>
                    {d.horarioDia ? (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {d.horarioDia.fechado
                          ? "Fechado"
                          : `${d.horarioDia.abre} - ${d.horarioDia.fecha}`}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-[64px_repeat(7,minmax(0,1fr))]">
              <div className="border-r border-border bg-card" style={{ height: totalH }}>
                {horas.map((h) => (
                  <div
                    key={h}
                    className="pr-2.5 pt-1 text-right text-[11px] font-medium text-muted-foreground"
                    style={{ height: PX_HORA }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {weekDays.map((d) => {
                const isToday = d.isoDate === todayIso;
                const placements = assignTracks(cardsByDay[d.dia]);
                const nowMinutes = isToday
                  ? nowDate.getHours() * 60 + nowDate.getMinutes()
                  : null;
                const showNow =
                  nowMinutes != null &&
                  nowMinutes >= hourIni * 60 &&
                  nowMinutes <= hourFim * 60;

                return (
                  <div
                    key={d.dia}
                    className={cn(
                      "relative border-l border-border",
                      isToday && "bg-gym-accent/5",
                    )}
                    style={{ height: totalH }}
                  >
                    {horas.map((_, i) =>
                      i === 0 ? null : (
                        <div
                          key={i}
                          className="absolute left-0 right-0 border-t border-border/50"
                          style={{ top: i * PX_HORA }}
                        />
                      ),
                    )}

                    {showNow && nowMinutes != null ? (
                      <div
                        className="absolute left-0 right-0 z-20 h-0.5 bg-destructive"
                        style={{ top: ((nowMinutes - hourIni * 60) / 60) * PX_HORA }}
                      >
                        <div className="absolute -left-1 -top-1 size-2.5 rounded-full bg-destructive" />
                      </div>
                    ) : null}

                    {placements.map(({ item, track, trackCount }) => (
                      <GradeWeekCard
                        key={`${item.id}-${item.diaExibicao}`}
                        item={item}
                        track={track}
                        trackCount={trackCount}
                        hourIni={hourIni}
                        pxHora={PX_HORA}
                        salaMap={salaMap}
                        funcionarioMap={funcionarioMap}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {kpis.total > 0 ? (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
          <span>
            <span className="font-mono text-sm font-bold text-foreground">{kpis.total}</span>{" "}
            aulas/semana
          </span>
          <span>
            <span className="font-mono text-sm font-bold text-foreground">{kpis.totalH}h</span>{" "}
            programadas
          </span>
          <span>
            <span className="font-mono text-sm font-bold text-foreground">{kpis.modCount}</span>{" "}
            modalidades
          </span>
          {sobDemandaCount > 0 ? (
            <span>
              ·{" "}
              <span className="font-mono font-bold text-foreground">{sobDemandaCount}</span> sob
              demanda (não exibidas)
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-1.5">
            <CalendarDays className="size-3.5" />
            <span>
              Editar grade em{" "}
              <Link
                href="/administrativo/atividades-grade"
                className="font-semibold text-foreground underline-offset-2 hover:underline"
              >
                Administrativo
              </Link>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight">Grade de Atividades</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Programação semanal · Cards posicionados por horário
      </p>
    </div>
  );
}
