"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar, ShieldCheck, Link2 } from "lucide-react";
import { formatBRL, formatDate } from "@/lib/formatters";
import type { Plano } from "@/lib/types";
import type { AgregadorVinculoResponse } from "@/lib/api/agregadores-vinculos";

const AGREGADOR_LABEL: Record<string, string> = {
  WELLHUB: "Wellhub",
  TOTALPASS: "TotalPass",
  OUTRO: "Agregador",
};

function AgregadorVinculoLine({ vinculo }: { vinculo: AgregadorVinculoResponse }) {
  const label = AGREGADOR_LABEL[vinculo.agregador] ?? vinculo.agregador;
  return (
    <div className="flex items-start gap-2 rounded-md border border-gym-teal/30 bg-gym-teal/5 p-2">
      <Link2 className="mt-0.5 size-3.5 shrink-0 text-gym-teal" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gym-teal">
          Vínculo {label}
        </p>
        <p className="mt-0.5 truncate font-mono text-xs text-foreground">
          {vinculo.usuarioExternoId}
        </p>
        {vinculo.cicloExpiraEm ? (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            Ciclo até {formatDate(vinculo.cicloExpiraEm)}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Card "Plano ativo" do Resumo (Perfil v3 — Wave 3, AC3.2 + AC3.3).
 * Countdown em tipografia grande com cor condicional + linha de próxima
 * cobrança quando recorrente. Quando não há plano, renderiza CTA claro.
 *
 * Extensão: agregadorVinculos — quando o cliente tem vínculo B2B ativo
 * (Wellhub/TotalPass), renderiza o vínculo como "contrato" alternativo
 * (ou adicional, quando há plano próprio também).
 */
export function ClientePlanoCard({
  planoAtivo,
  planoAtivoInfo,
  recorrente,
  agregadorVinculos = [],
  onRenovar,
  onPausar,
  hoje,
}: {
  planoAtivo: { dataFim: string; dataInicio?: string } | null;
  planoAtivoInfo?: Plano | null;
  recorrente?: { data: string; plano: { nome: string }; valor: number } | null;
  agregadorVinculos?: AgregadorVinculoResponse[];
  onRenovar?: () => void;
  onPausar?: () => void;
  hoje?: Date;
}) {
  const referencia = hoje ?? new Date();
  const temVinculos = agregadorVinculos.length > 0;

  if (!planoAtivo) {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plano ativo
        </p>
        {temVinculos ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-muted-foreground">
              Sem plano próprio — acesso via agregador:
            </p>
            {agregadorVinculos.map((vinculo) => (
              <AgregadorVinculoLine key={vinculo.id} vinculo={vinculo} />
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Cliente sem contrato ativo</p>
        )}
      </div>
    );
  }

  const fim = parseLocalDate(planoAtivo.dataFim);
  const dias = Math.floor((fim.getTime() - referencia.getTime()) / 86400000);
  const vencido = dias < 0;
  const venceLogo = dias >= 0 && dias <= 14;
  const valueColor = vencido
    ? "text-gym-danger"
    : venceLogo
    ? "text-gym-warning"
    : "text-gym-teal";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Plano ativo
        </p>
        <ShieldCheck className={cn("size-3.5", valueColor)} />
      </div>

      <p className="mt-2 font-display text-lg font-bold leading-tight">
        {planoAtivoInfo?.nome ?? "Plano"}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={cn("font-display text-3xl font-extrabold leading-none", valueColor)}>
          {Math.abs(dias)}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {vencido ? "dia" + (Math.abs(dias) !== 1 ? "s" : "") + " vencido" : dias === 0 ? "vence hoje" : "dia" + (dias !== 1 ? "s" : "") + " restante" + (dias !== 1 ? "s" : "")}
        </span>
      </div>

      <p className="mt-1 text-[11px] text-muted-foreground">
        Até <span className="font-mono">{formatDate(planoAtivo.dataFim)}</span>
      </p>

      {recorrente ? (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-gym-accent/30 bg-gym-accent/5 p-2">
          <Calendar className="mt-0.5 size-3.5 shrink-0 text-gym-accent" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gym-accent">
              Próxima cobrança
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-foreground">
              {formatDate(recorrente.data)} · {formatBRL(recorrente.valor)}
            </p>
          </div>
        </div>
      ) : null}

      {temVinculos ? (
        <div className="mt-3 space-y-2">
          {agregadorVinculos.map((vinculo) => (
            <AgregadorVinculoLine key={vinculo.id} vinculo={vinculo} />
          ))}
        </div>
      ) : null}

      {(onRenovar || onPausar) && (
        <div className="mt-3 flex gap-2">
          {onRenovar ? (
            <Button variant="outline" size="sm" className="h-7 flex-1 text-xs" onClick={onRenovar}>
              Renovar
            </Button>
          ) : null}
          {onPausar ? (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onPausar}>
              Pausar
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}
