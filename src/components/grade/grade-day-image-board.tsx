"use client";

import { useEffect, useState } from "react";
import { getStore } from "@/lib/mock/store";
import type { Academia, Atividade, AtividadeGrade, DiaSemana, Funcionario, HorarioFuncionamento, Sala } from "@/lib/types";

const DAY_TAG_BY_JS_DAY: DiaSemana[] = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SAB"];
const DIA_LABEL: Record<DiaSemana, string> = {
  SEG: "Segunda-feira",
  TER: "Terça-feira",
  QUA: "Quarta-feira",
  QUI: "Quinta-feira",
  SEX: "Sexta-feira",
  SAB: "Sábado",
  DOM: "Domingo",
};

type GradeItem = AtividadeGrade & {
  atividade?: Atividade;
  sala?: Sala;
  funcionario?: Funcionario;
};

function toIsoDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function parseDateParam(raw: string | null): string {
  if (!raw) return toIsoDate(new Date());
  const safe = raw.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(safe) ? safe : toIsoDate(new Date());
}

function toMinutes(time: string) {
  const [hh, mm] = time.split(":").map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

function formatTimeRange(start: string, end: string) {
  return `${start} - ${end}`;
}

function formatDatePtBr(dateIso: string) {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatWeekDay(dateIso: string): DiaSemana {
  const jsDay = new Date(`${dateIso}T00:00:00`).getDay();
  return DAY_TAG_BY_JS_DAY[jsDay] ?? "SEG";
}

function getAtividadeCapacityLabel(item: GradeItem, dateIso: string) {
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
  const tenant = store.tenants.find((t) => t.id === currentTenantId) ?? store.tenant;
  const academiaId = tenant.academiaId ?? tenant.groupId;
  const academia =
    store.academias.find((a) => a.id === academiaId) ??
    store.academias[0] ??
    ({ id: "acd-default", nome: "Conceito Fit" } as Academia);
  const dateIso = dateOverride ?? toIsoDate(new Date());
  const dayTag = formatWeekDay(dateIso);

  const atividadesMap = new Map(
    store.atividades.filter((a) => a.tenantId === tenant.id && a.ativo).map((a) => [a.id, a])
  );
  const salasMap = new Map(
    store.salas.filter((s) => s.tenantId === tenant.id && s.ativo).map((s) => [s.id, s])
  );
  const funcionariosMap = new Map(
    store.funcionarios.filter((f) => f.ativo).map((f) => [f.id, f])
  );
  const horarioDia = store.horarios.find((h) => h.dia === dayTag) as HorarioFuncionamento | undefined;

  const itens: GradeItem[] = store.atividadeGrades
    .filter((g) => g.tenantId === tenant.id && g.ativo && g.diasSemana.includes(dayTag))
    .map((g) => ({
      ...g,
      atividade: atividadesMap.get(g.atividadeId),
      sala: g.salaId ? salasMap.get(g.salaId) : undefined,
      funcionario: g.funcionarioId ? funcionariosMap.get(g.funcionarioId) : undefined,
    }))
    .filter((g) => g.atividade && g.definicaoHorario === "PREVIAMENTE")
    .sort((a, b) => toMinutes(a.horaInicio) - toMinutes(b.horaInicio));

  return { tenant, academia, itens, dateIso, dayTag, horarioDia };
}

export function GradeDayImageBoard({
  tenantId,
  date,
}: {
  tenantId?: string;
  date?: string;
}) {
  const safeDate = parseDateParam(date ?? null);
  const [data, setData] = useState(() => buildSnapshot(tenantId, safeDate));

  useEffect(() => {
    setData(buildSnapshot(tenantId, safeDate));
  }, [tenantId, safeDate]);

  useEffect(() => {
    function handleUpdate() {
      setData(buildSnapshot(tenantId, safeDate));
    }
    window.addEventListener("academia-store-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("academia-store-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [tenantId, safeDate]);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1400px] rounded-2xl border border-border bg-card p-4 md:p-6">
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
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Grade de atividades</p>
              <h1 className="truncate font-display text-xl font-bold md:text-2xl">{data.academia.nome}</h1>
              <p className="truncate text-sm text-muted-foreground">Unidade: {data.tenant.nome}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{DIA_LABEL[data.dayTag]}</p>
            <p className="font-display text-lg font-bold">{formatDatePtBr(data.dateIso)}</p>
            <p className="text-xs text-muted-foreground">
              {data.horarioDia?.fechado
                ? "Unidade fechada"
                : `${data.horarioDia?.abre ?? "--:--"} - ${data.horarioDia?.fecha ?? "--:--"}`}
            </p>
          </div>
        </div>

        {data.itens.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl font-bold">Sem atividades programadas</p>
            <p className="mt-2 text-muted-foreground">Não há aulas agendadas para este dia.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.itens.map((item) => (
              <div key={`${item.id}-${item.horaInicio}`} className="rounded-xl border border-border bg-secondary/35 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-lg font-bold">{item.atividade?.nome}</p>
                    <p className="text-sm text-muted-foreground">{formatTimeRange(item.horaInicio, item.horaFim)}</p>
                  </div>
                  {item.atividade?.checkinObrigatorio ? (
                    <span className="shrink-0 rounded-full bg-gym-warning/15 px-2 py-0.5 text-[11px] font-semibold text-gym-warning">
                      Check-in obrigatório
                    </span>
                  ) : null}
                </div>

                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  <p>
                    <span className="text-foreground/75">Local:</span>{" "}
                    {item.sala?.nome ?? item.local ?? "Não definido"}
                  </p>
                  <p>
                    <span className="text-foreground/75">Professor:</span>{" "}
                    {item.funcionario?.nome ?? item.instrutor ?? "Não definido"}
                  </p>
                  <p>{getAtividadeCapacityLabel(item, data.dateIso)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
