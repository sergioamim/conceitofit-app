"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { listPlanos } from "@/lib/mock/services";
import type { Plano } from "@/lib/types";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<string, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  AVULSO: "Avulso",
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function PlanosPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);

  useEffect(() => {
    listPlanos().then(setPlanos);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Planos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Planos disponíveis para matrícula
        </p>
      </div>

      <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
        {planos.map((p) => (
          <div
            key={p.id}
            className={cn(
              "relative rounded-xl border p-5 transition-all",
              p.destaque
                ? "border-gym-accent bg-gym-accent/5"
                : "border-border bg-card"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-4 rounded-full bg-gym-accent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
                Popular
              </span>
            )}

            <div className="font-display text-lg font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              {TIPO_LABEL[p.tipo]} · {p.duracaoDias} dias
            </div>

            <div className="mt-4">
              <span
                className={cn(
                  "font-display text-3xl font-extrabold",
                  p.destaque ? "text-gym-accent" : "text-foreground"
                )}
              >
                {formatBRL(p.valor)}
              </span>
              <span className="text-xs text-muted-foreground"> / plano</span>
            </div>

            {p.valorMatricula > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                + {formatBRL(p.valorMatricula)} de matrícula
              </p>
            )}

            {p.beneficios && p.beneficios.length > 0 && (
              <ul className="mt-4 space-y-2">
                {p.beneficios.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2 text-xs text-muted-foreground"
                  >
                    <Check className="mt-0.5 size-3 shrink-0 text-gym-teal" />
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Summary table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Plano
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Duração
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Matrícula
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Destaque
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {planos.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 font-medium text-sm">{p.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[p.tipo]}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.duracaoDias} dias
                </td>
                <td className="px-4 py-3 font-display font-bold text-gym-accent">
                  {formatBRL(p.valor)}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {p.valorMatricula > 0 ? formatBRL(p.valorMatricula) : "—"}
                </td>
                <td className="px-4 py-3">
                  {p.destaque ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gym-accent/15 px-2 py-0.5 text-[11px] font-semibold text-gym-accent">
                      <Check className="size-3" /> Popular
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
