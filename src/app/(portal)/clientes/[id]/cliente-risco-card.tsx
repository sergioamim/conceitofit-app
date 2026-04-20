"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TrendingDown, ChevronRight } from "lucide-react";
import {
  computeRiscoEvasao,
  computeTendenciaRisco,
  type FatorRisco,
  type RiscoEvasaoInput,
  type RiscoLabel,
} from "@/lib/domain/risco-evasao";

/**
 * Card "Risco de evasão" no Resumo (Perfil v3 — Wave 3, AC3.5-3.9).
 * Score + rótulo + sparkline condicional + top 3 fatores.
 * Link "Ver detalhes" abre painel lateral com lista completa e tendência
 * semanal tabulada (AC3.7).
 */
export function ClienteRiscoCard({
  input,
  clienteNome,
}: {
  input: RiscoEvasaoInput;
  clienteNome?: string;
}) {
  const [detalheOpen, setDetalheOpen] = useState(false);
  const risco = computeRiscoEvasao(input);
  const tendencia = computeTendenciaRisco({ presencas: input.presencas, hoje: input.hoje });

  const toneClasses = labelToTone(risco.label);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Risco de evasão
          </p>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
              toneClasses.chip
            )}
          >
            {risco.label}
          </span>
        </div>

        {!risco.temDadosSuficientes ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="size-3.5" />
            Sem dados suficientes para calcular
          </div>
        ) : (
          <>
            <div className="mt-2 flex items-baseline gap-1">
              <span
                className={cn(
                  "font-mono text-4xl font-extrabold leading-none tracking-tight",
                  toneClasses.valor
                )}
              >
                {risco.score}
              </span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>

            {tendencia ? (
              <Sparkline valores={tendencia} className="mt-2 h-8 w-full" color={toneClasses.stroke} />
            ) : null}

            <div className="mt-3 border-t border-border pt-2">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Principais fatores
              </p>
              <ul className="space-y-1">
                {risco.fatores.slice(0, 3).map((f) => (
                  <FatorRow key={f.key} fator={f} />
                ))}
              </ul>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 h-7 w-full justify-between text-xs"
              onClick={() => setDetalheOpen(true)}
            >
              Ver detalhes
              <ChevronRight className="size-3.5" />
            </Button>
          </>
        )}
      </div>

      <Sheet open={detalheOpen} onOpenChange={setDetalheOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="border-b border-border p-5">
            <div className="flex items-center justify-between">
              <SheetTitle className="font-display text-lg">
                Risco de evasão
                {clienteNome ? <span className="ml-2 text-sm font-normal text-muted-foreground">· {clienteNome}</span> : null}
              </SheetTitle>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                  toneClasses.chip
                )}
              >
                {risco.label}
              </span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={cn("font-mono text-4xl font-extrabold", toneClasses.valor)}>
                {risco.score}
              </span>
              <span className="text-xs text-muted-foreground">/100 · versão {risco.version}</span>
            </div>
            <SheetDescription>
              Heurística determinística baseada em sinais observáveis do perfil.
              Fatores sem dado no backend são omitidos.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-5">
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fatores aplicados ({risco.fatores.length})
              </h3>
              {risco.fatores.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum fator disparado.</p>
              ) : (
                <ul className="space-y-2">
                  {risco.fatores.map((f) => (
                    <li key={f.key}>
                      <FatorRow fator={f} detalhado />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-6">
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tendência (7 semanas)
              </h3>
              {tendencia ? (
                <>
                  <Sparkline valores={tendencia} className="h-14 w-full" color={toneClasses.stroke} />
                  <table className="mt-2 w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="py-1 font-semibold">Semana</th>
                        <th className="py-1 font-semibold">Score proxy</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tendencia.map((score, i) => (
                        <tr key={i} className="border-t border-border">
                          <td className="py-1 font-mono text-muted-foreground">S-{tendencia.length - 1 - i}</td>
                          <td className={cn("py-1 font-mono font-semibold", toneStrokeForScore(score))}>
                            {score}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Sem histórico de presença suficiente para compor a tendência.
                </p>
              )}
            </section>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function FatorRow({ fator, detalhado = false }: { fator: FatorRisco; detalhado?: boolean }) {
  const positivo = fator.sinal === "positivo";
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "inline-block size-1.5 shrink-0 rounded-full",
            positivo ? "bg-gym-teal" : fator.peso >= 20 ? "bg-gym-danger" : "bg-gym-warning"
          )}
        />
        <span className="truncate text-foreground">{fator.label}</span>
      </div>
      <span
        className={cn(
          "shrink-0 font-mono font-bold",
          positivo ? "text-gym-teal" : fator.peso >= 20 ? "text-gym-danger" : "text-gym-warning"
        )}
      >
        {positivo ? "−" : "+"}
        {fator.peso}
        {detalhado ? <span className="ml-1 text-[10px] font-normal text-muted-foreground">pts</span> : null}
      </span>
    </div>
  );
}

function Sparkline({
  valores,
  className,
  color,
}: {
  valores: number[];
  className?: string;
  color: string;
}) {
  if (valores.length === 0) return null;
  const max = Math.max(...valores);
  const min = Math.min(...valores);
  const range = Math.max(1, max - min);
  const W = 120;
  const H = 36;
  const points = valores
    .map((v, i) => {
      const x = (i / Math.max(1, valores.length - 1)) * W;
      const y = H - ((v - min) / range) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden
    >
      <polyline fill="none" stroke={color} strokeWidth="1.8" points={points} />
      {valores.map((v, i) => {
        const x = (i / Math.max(1, valores.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i === valores.length - 1 ? 2.5 : 1.5}
            fill={color}
          />
        );
      })}
    </svg>
  );
}

function labelToTone(label: RiscoLabel): {
  chip: string;
  valor: string;
  stroke: string;
} {
  switch (label) {
    case "Alto":
      return {
        chip: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
        valor: "text-gym-danger",
        stroke: "currentColor",
      };
    case "Médio":
      return {
        chip: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
        valor: "text-gym-warning",
        stroke: "currentColor",
      };
    case "Baixo":
      return {
        chip: "bg-gym-teal/15 text-gym-teal border-gym-teal/30",
        valor: "text-gym-teal",
        stroke: "currentColor",
      };
  }
}

function toneStrokeForScore(score: number): string {
  if (score >= 50) return "text-gym-danger";
  if (score >= 35) return "text-gym-warning";
  return "text-gym-teal";
}
