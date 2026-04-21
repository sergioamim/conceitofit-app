"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";

/**
 * Card "Frequência (14 dias)" do Resumo (Perfil v3 — Wave 3, AC3.1 + AC3.4).
 * Mini-barras verticais para cada um dos últimos 14 dias — preenchida quando
 * houve presença, esmaecida quando não. Leitura abaixo: {mes}/{meta} treinos
 * + última visita.
 *
 * Normaliza o campo `data` (aceita `YYYY-MM-DD` ou qualquer ISO string com
 * hora) para evitar dessincronização com o retorno do backend.
 */
export function ClienteFrequenciaCard({
  presencas,
  metaMensal = 12,
  hoje,
  debug = false,
}: {
  presencas: Array<{ data: string }>;
  metaMensal?: number;
  hoje?: Date;
  /** Log temporário no console para diagnóstico de acessos/frequência. */
  debug?: boolean;
}) {
  const referencia = hoje ?? new Date();
  const datasNormalizadas = presencas.map((p) => normalizeDateOnly(p.data)).filter(Boolean) as string[];
  const dias = buildUltimos14Dias(datasNormalizadas, referencia);
  const treinosMes = countTreinosNoMes(datasNormalizadas, referencia);
  const ultima = ultimaVisita(datasNormalizadas);
  const diasSemVisita = ultima
    ? Math.floor((referencia.getTime() - parseLocalDate(ultima).getTime()) / 86400000)
    : null;

  useEffect(() => {
    if (!debug) return;
    // eslint-disable-next-line no-console
    console.log("[ClienteFrequenciaCard DEBUG]", {
      total: presencas.length,
      raw: presencas.slice(0, 5).map((p) => p.data),
      normalizadas: datasNormalizadas.slice(0, 5),
      treinosMes,
      ultima,
      diasSemVisita,
      janela14: dias,
    });
  }, [debug, presencas, datasNormalizadas, dias, treinosMes, ultima, diasSemVisita]);

  const percMeta = Math.min(100, Math.round((treinosMes / Math.max(1, metaMensal)) * 100));
  const tomMeta =
    percMeta >= 75 ? "text-gym-teal" : percMeta >= 33 ? "text-gym-warning" : "text-gym-danger";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Frequência (14 dias)
        </p>
        <Activity className="size-3.5 text-muted-foreground" />
      </div>

      <div className="mt-3 flex h-10 items-end gap-1" role="img" aria-label={`${treinosMes} de ${metaMensal} treinos no mês`}>
        {dias.map((presente, i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-sm",
              presente ? "bg-gym-accent" : "bg-muted"
            )}
            style={{ height: presente ? "100%" : "32%" }}
            data-state={presente ? "presente" : "ausente"}
          />
        ))}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div>
          <span className={cn("font-display text-2xl font-extrabold leading-none", tomMeta)}>
            {treinosMes}
          </span>
          <span className="ml-1 text-xs text-muted-foreground">/ {metaMensal}</span>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            treinos no mês
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-foreground">
            {ultima === null
              ? "—"
              : diasSemVisita === 0
              ? "hoje"
              : `há ${diasSemVisita}d`}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            última visita
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Extrai `YYYY-MM-DD` de strings como `2026-04-21`, `2026-04-21T10:30:00Z`,
 * `2026-04-21 10:30:00`. Retorna `null` quando o valor não bate no padrão.
 */
function normalizeDateOnly(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function buildUltimos14Dias(datas: string[], referencia: Date): boolean[] {
  const out: boolean[] = [];
  const set = new Set(datas);
  for (let i = 13; i >= 0; i -= 1) {
    const d = new Date(referencia);
    d.setDate(d.getDate() - i);
    const iso = toISODate(d);
    out.push(set.has(iso));
  }
  return out;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function countTreinosNoMes(datas: string[], referencia: Date): number {
  const ano = referencia.getFullYear();
  const mes = referencia.getMonth();
  return datas.filter((data) => {
    const d = parseLocalDate(data);
    return d.getFullYear() === ano && d.getMonth() === mes;
  }).length;
}

function ultimaVisita(datas: string[]): string | null {
  if (datas.length === 0) return null;
  return datas.reduce((latest, data) => (data > latest ? data : latest));
}
