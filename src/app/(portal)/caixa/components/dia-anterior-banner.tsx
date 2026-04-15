"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DiaAnteriorBannerProps {
  abertoEm: string;
  onFechar: () => void;
}

/**
 * Banner amarelo exibido quando o caixa foi aberto em um dia anterior.
 * A formatação de data acontece APÓS mount (não é calculada no render SSR)
 * pra respeitar hydration safety.
 */
export function DiaAnteriorBanner({
  abertoEm,
  onFechar,
}: DiaAnteriorBannerProps) {
  const [formatted, setFormatted] = useState<string>("");

  useEffect(() => {
    const date = new Date(abertoEm);
    if (Number.isNaN(date.getTime())) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormatted(abertoEm);
      return;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const next = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
    setFormatted(next);
  }, [abertoEm]);

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-gym-warning/30 bg-gym-warning/10 p-4 md:flex-row md:items-center md:justify-between"
      data-testid="dia-anterior-banner"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-gym-warning/20 text-gym-warning">
          <AlertTriangle className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-gym-warning">
            Caixa aberto em dia anterior
          </p>
          <p className="text-xs text-muted-foreground">
            Você tem caixa aberto desde{" "}
            <span className="font-semibold text-foreground">
              {formatted || "—"}
            </span>
            . Encerre antes de continuar operando hoje.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        className="border-gym-warning/50 text-gym-warning hover:bg-gym-warning/10"
        onClick={onFechar}
      >
        Fechar para abrir novo
      </Button>
    </div>
  );
}
