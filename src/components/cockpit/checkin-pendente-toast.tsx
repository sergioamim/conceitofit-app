"use client";

import { useEffect, useState } from "react";
import { BellRing, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CheckinPendenteReceived } from "@/hooks/use-checkin-pendente-stream";

interface CheckinPendenteToastProps {
  pendente: CheckinPendenteReceived;
  onDismiss: () => void;
}

/**
 * Toast lateral persistente (não auto-dismiss) — mostra nome do aluno +
 * agregador + contador "expira em N min". Usuário dispensa manualmente via X.
 *
 * Relógio de expiração é **derivado do `validoAte`** do backend (não do clock
 * local) — evita drift quando recepção está em máquina com horário errado.
 */
export function CheckinPendenteToast({
  pendente,
  onDismiss,
}: CheckinPendenteToastProps) {
  const label = pendente.alunoNome ?? `Usuário ${pendente.agregador}`;
  const agregadorLabel = formatAgregador(pendente.agregador);
  const expiraEm = useExpiraEmLabel(pendente.validoAte);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-lg border border-border bg-card p-3 shadow-lg"
      data-testid="checkin-pendente-toast"
    >
      <div
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary",
        )}
      >
        <BellRing className="size-4" aria-hidden />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">
          Check-in {agregadorLabel} recebido · {expiraEm}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-7 shrink-0"
        onClick={onDismiss}
        aria-label={`Dispensar aviso de ${label}`}
      >
        <X className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}

interface CheckinPendenteStackProps {
  pendentes: CheckinPendenteReceived[];
  pendentesOcultos: number;
  onDismiss: (id: string) => void;
}

/**
 * Stack visível (até 3) + badge "+N" pros colapsados.
 */
export function CheckinPendenteStack({
  pendentes,
  pendentesOcultos,
  onDismiss,
}: CheckinPendenteStackProps) {
  if (pendentes.length === 0 && pendentesOcultos === 0) {
    return null;
  }
  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2"
      data-testid="checkin-pendente-stack"
    >
      {pendentes.map((p) => (
        <CheckinPendenteToast
          key={p.checkinPendenteId}
          pendente={p}
          onDismiss={() => onDismiss(p.checkinPendenteId)}
        />
      ))}
      {pendentesOcultos > 0 ? (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto mr-auto rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
          data-testid="checkin-pendente-overflow"
        >
          +{pendentesOcultos} check-in{pendentesOcultos > 1 ? "s" : ""} pendente
          {pendentesOcultos > 1 ? "s" : ""}
        </div>
      ) : null}
    </div>
  );
}

function formatAgregador(agregador: string): string {
  switch (agregador.toUpperCase()) {
    case "WELLHUB":
      return "Gympass";
    case "TOTALPASS":
      return "TotalPass";
    default:
      return agregador;
  }
}

/**
 * Hook que retorna label do tipo "expira em 42 min" / "expira em breve" /
 * "expirado". Re-renderiza a cada 30s pra o texto ficar live.
 */
function useExpiraEmLabel(validoAte: string | null): string {
  const [, force] = useState(0);

  useEffect(() => {
    if (!validoAte) return;
    const timer = setInterval(() => force((v) => v + 1), 30_000);
    return () => clearInterval(timer);
  }, [validoAte]);

  if (!validoAte) return "expira em breve";
  const venceMs = Date.parse(validoAte);
  if (Number.isNaN(venceMs)) return "expira em breve";
  const diffMin = Math.round((venceMs - Date.now()) / 60_000);
  if (diffMin <= 0) return "expirado";
  if (diffMin === 1) return "expira em 1 min";
  if (diffMin <= 60) return `expira em ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  return `expira em ${hours}h`;
}
