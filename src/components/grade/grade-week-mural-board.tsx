"use client";

import { useEffect, useState } from "react";
import { getStore } from "@/lib/mock/store";
import type {
  Academia,
  Atividade,
  AtividadeGrade,
  DiaSemana,
  Funcionario,
  HorarioFuncionamento,
  Sala,
} from "@/lib/types";

const DIA_ORDER: DiaSemana[] = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];
const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda",
  TER: "Terça",
  QUA: "Quarta",
  QUI: "Quinta",
  SEX: "Sexta",
  SAB: "Sábado",
  DOM: "Domingo",
};

type GradeItem = AtividadeGrade & {
  atividade?: Atividade;
  sala?: Sala;
  funcionario?: Funcionario;
};

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

function parseDateParam(raw: string | null): Date {
  if (!raw) return new Date();
  const safe = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(safe)) return new Date();
  return new Date(`${safe}T12:00:00`);
}

function startOfWeekMonday(base: Date): Date {
  const date = new Date(base);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(base: Date, days: number): Date {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date;
}

function toMinutes(time: string): number {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("pt-BR");
}

function formatRange(start: string, end: string): string {
  return `${start} - ${end}`;
}

function getAtividadeCapacityLabel(item: GradeItem, dateIso: string): string {
  if (!item.atividade?.permiteCheckin) {
    return `Capacidade: ${item.capacidade}`;
  }

  const now = new Date();
  const start = new Date(`${dateIso}T${item.horaInicio}:00`);
  const openAt = new Date(start.getTime() - item.checkinLiberadoMinutosAntes * 60 * 1000);
  const isToday = toIsoDate(now) === dateIso;
  const checkinOpenNow = isToday && now >= openAt && now <= start;
  if (checkinOpenNow) {
    return `Vagas disponíveis: ${item.capacidade}`;
  }
  return `Check-in abre ${item.checkinLiberadoMinutosAntes} min antes`;
}

function buildSnapshot(tenantIdOverride?: string, dateOverride?: string) {
  const store = getStore();
  const currentTenantId = tenantIdOverride ?? store.currentTenantId ?? store.tenant.id;
  const tenant = store.tenants.find((item) => item.id === currentTenantId) ?? store.tenant;
  const academiaId = tenant.academiaId ?? tenant.groupId;
  const academia =
    store.academias.find((item) => item.id === academiaId) ??
    store.academias[0] ??
    ({ id: "acd-default", nome: "Conceito Fit" } as Academia);

  const baseDate = parseDateParam(dateOverride ?? null);
  const weekStart = startOfWeekMonday(baseDate);
  const weekEnd = addDays(weekStart, 6);

  const atividadesMap = new Map(
    store.atividades
      .filter((item) => item.tenantId === tenant.id && item.ativo)
      .map((item) => [item.id, item])
  );
  const salasMap = new Map(
    store.salas.filter((item) => item.tenantId === tenant.id && item.ativo).map((item) => [item.id, item])
  );
  const funcionariosMap = new Map(
    store.funcionarios.filter((item) => item.ativo).map((item) => [item.id, item])
  );
  const horariosMap = new Map(
    store.horarios.map((item) => [item.dia, item] as const)
  );

  const gradeBase: GradeItem[] = store.atividadeGrades
    .filter((item) => item.tenantId === tenant.id && item.ativo && item.definicaoHorario === "PREVIAMENTE")
    .map((item) => ({
      ...item,
      atividade: atividadesMap.get(item.atividadeId),
      sala: item.salaId ? salasMap.get(item.salaId) : undefined,
      funcionario: item.funcionarioId ? funcionariosMap.get(item.funcionarioId) : undefined,
    }))
    .filter((item) => item.atividade)
    .sort((a, b) => toMinutes(a.horaInicio) - toMinutes(b.horaInicio));

  const days = DIA_ORDER.map((dayTag, index) => {
    const date = addDays(weekStart, index);
    const isoDate = toIsoDate(date);
    const horarioDia = horariosMap.get(dayTag) as HorarioFuncionamento | undefined;
    const itens = gradeBase.filter((item) => item.diasSemana.includes(dayTag));
    return { dayTag, date, isoDate, horarioDia, itens };
  });

  return { tenant, academia, weekStart, weekEnd, days };
}

export function GradeWeekMuralBoard({
  tenantId,
  date,
}: {
  tenantId?: string;
  date?: string;
}) {
  const [data, setData] = useState(() => buildSnapshot(tenantId, date));

  useEffect(() => {
    setData(buildSnapshot(tenantId, date));
  }, [tenantId, date]);

  useEffect(() => {
    function handleUpdate() {
      setData(buildSnapshot(tenantId, date));
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [tenantId, date]);

  const totalAulas = data.days.reduce((acc, day) => acc + day.itens.length, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1680px] rounded-2xl border border-border bg-card p-4 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="flex min-w-0 items-start gap-3">
            {data.academia.branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.academia.branding.logoUrl}
                alt={data.academia.nome}
                className="h-12 w-auto rounded-md object-contain md:h-14"
              />
            ) : (
              <div className="grid h-12 w-12 place-items-center rounded-md bg-gym-accent/15 text-sm font-bold text-gym-accent md:h-14 md:w-14">
                CF
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Mural da grade semanal</p>
              <h1 className="truncate font-display text-xl font-bold md:text-2xl">{data.academia.nome}</h1>
              <p className="truncate text-sm text-muted-foreground">Unidade: {data.tenant.nome}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Semana atual</p>
            <p className="font-display text-lg font-bold">
              {formatDate(data.weekStart)} - {formatDate(data.weekEnd)}
            </p>
            <p className="text-xs text-muted-foreground">{totalAulas} aula(s) programada(s)</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="grid min-w-[1320px] grid-cols-7 gap-3">
            {data.days.map((day) => (
              <div key={day.dayTag} className="rounded-xl border border-border bg-secondary/20">
                <div className="border-b border-border px-3 py-2">
                  <p className="text-sm font-bold">{DIA_LABEL[day.dayTag]}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(day.date)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {day.horarioDia?.fechado
                      ? "Unidade fechada"
                      : `${day.horarioDia?.abre ?? "--:--"} - ${day.horarioDia?.fecha ?? "--:--"}`}
                  </p>
                </div>

                <div className="space-y-2 p-2">
                  {day.itens.length === 0 ? (
                    <div className="rounded-md border border-dashed border-border/70 bg-card/40 px-3 py-5 text-center text-xs text-muted-foreground">
                      Sem aulas
                    </div>
                  ) : (
                    day.itens.map((item) => (
                      <div key={`${item.id}-${day.dayTag}-${item.horaInicio}`} className="rounded-lg border border-border bg-card p-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <p className="line-clamp-1 text-sm font-semibold">{item.atividade?.nome}</p>
                          {item.atividade?.checkinObrigatorio ? (
                            <span className="shrink-0 rounded-full bg-gym-warning/15 px-2 py-0.5 text-[10px] font-semibold text-gym-warning">
                              Check-in obrigatório
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{formatRange(item.horaInicio, item.horaFim)}</p>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-1">
                          Local: {item.sala?.nome ?? item.local ?? "Não definido"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Professor: {item.funcionario?.nome ?? item.instrutor ?? "Não definido"}
                        </p>
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          {getAtividadeCapacityLabel(item, day.isoDate)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
