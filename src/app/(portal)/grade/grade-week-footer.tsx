import Link from "next/link";
import { CalendarDays } from "lucide-react";

export interface GradeWeekFooterProps {
  total: number;
  totalH: number;
  modCount: number;
  lotadas: number;
  sobDemandaCount: number;
}

export function GradeWeekFooter({
  total,
  totalH,
  modCount,
  lotadas,
  sobDemandaCount,
}: GradeWeekFooterProps) {
  if (total === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground">
      <Stat value={total} label="aulas/semana" />
      <Stat value={`${totalH}h`} label="programadas" />
      <Stat value={modCount} label="modalidades" />
      {lotadas > 0 ? <Stat value={lotadas} label="lotadas" danger /> : null}
      {sobDemandaCount > 0 ? (
        <span>
          · <span className="font-mono font-bold text-foreground">{sobDemandaCount}</span> sob
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
  );
}

function Stat({ value, label, danger }: { value: number | string; label: string; danger?: boolean }) {
  return (
    <span>
      <span
        className={`font-mono text-sm font-bold ${danger ? "text-destructive" : "text-foreground"}`}
      >
        {value}
      </span>{" "}
      {label}
    </span>
  );
}
