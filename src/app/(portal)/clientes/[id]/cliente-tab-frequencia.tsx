"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Activity, CalendarDays } from "lucide-react";
import type { Presenca } from "@/lib/shared/types";

type Periodo = "30d" | "90d" | "365d" | "total";

const PERIODO_LABEL: Record<Periodo, string> = {
  "30d": "30 dias",
  "90d": "90 dias",
  "365d": "12 meses",
  total: "Tudo",
};

const PERIODO_DAYS: Record<Periodo, number | null> = {
  "30d": 30,
  "90d": 90,
  "365d": 365,
  total: null,
};

/**
 * Aba "Frequência" (Perfil v3 — Wave 4, AC4.1). Histórico completo de
 * check-ins/aulas/acesso com filtro de período, resumo agregado e lista
 * cronológica invertida.
 */
export function ClienteTabFrequencia({ presencas }: { presencas: Presenca[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("90d");
  // Congela a referência de "hoje" no mount — evita re-render cascata no useMemo.
  const hoje = useMemo(() => new Date(), []);

  const filtradas = useMemo(() => {
    const limite = PERIODO_DAYS[periodo];
    if (limite === null) return presencas;
    const cutoff = new Date(hoje);
    cutoff.setDate(cutoff.getDate() - limite);
    return presencas.filter((p) => parseLocalDate(p.data) >= cutoff);
  }, [presencas, periodo, hoje]);

  const ordenadas = useMemo(() => {
    return [...filtradas].sort((a, b) => (a.data > b.data ? -1 : 1));
  }, [filtradas]);

  const totalPresencas = filtradas.length;
  const diasUnicos = new Set(filtradas.map((p) => p.data)).size;
  const ultima = ordenadas[0];
  const diasSemVisita = ultima
    ? Math.floor((hoje.getTime() - parseLocalDate(ultima.data).getTime()) / 86400000)
    : null;

  const porOrigem = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of filtradas) {
      acc[p.origem] = (acc[p.origem] ?? 0) + 1;
    }
    return acc;
  }, [filtradas]);

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="font-display text-base font-bold">Frequência</h2>
        </div>
        <div className="flex gap-1" role="tablist" aria-label="Período">
          {(Object.keys(PERIODO_LABEL) as Periodo[]).map((p) => (
            <button
              key={p}
              role="tab"
              aria-selected={periodo === p}
              onClick={() => setPeriodo(p)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                periodo === p
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {PERIODO_LABEL[p]}
            </button>
          ))}
        </div>
      </div>

      {/* Resumo agregado */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatBox label="Check-ins" valor={String(totalPresencas)} hint={`em ${PERIODO_LABEL[periodo].toLowerCase()}`} />
        <StatBox label="Dias distintos" valor={String(diasUnicos)} />
        <StatBox
          label="Última visita"
          valor={diasSemVisita === null ? "—" : diasSemVisita === 0 ? "hoje" : `há ${diasSemVisita}d`}
          hint={ultima ? formatDateBR(ultima.data) : undefined}
        />
        <StatBox
          label="Origens"
          valor={Object.keys(porOrigem).length ? Object.entries(porOrigem).map(([o, n]) => `${o}: ${n}`).join(" · ") : "—"}
          mono={false}
        />
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-sm font-bold">Linha do tempo</h3>
          <span className="text-xs text-muted-foreground">
            {ordenadas.length} registro{ordenadas.length !== 1 ? "s" : ""}
          </span>
        </div>
        {ordenadas.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sem check-ins nesse período.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {ordenadas.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                  <CalendarDays className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {formatDateBR(p.data)}
                    {p.horario ? <span className="ml-2 font-mono text-xs text-muted-foreground">{p.horario}</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {p.origem}
                    {p.atividade ? ` · ${p.atividade}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Abrir no módulo de frequências (futuro) */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" className="h-8 text-xs" disabled title="Em breve">
          Abrir painel de frequências
        </Button>
      </div>
    </div>
  );
}

function StatBox({
  label,
  valor,
  hint,
  mono = true,
}: {
  label: string;
  valor: string;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-display font-bold leading-tight",
          mono ? "text-2xl" : "text-sm"
        )}
      >
        {valor}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatDateBR(iso: string): string {
  const d = parseLocalDate(iso);
  return d.toLocaleDateString("pt-BR");
}
