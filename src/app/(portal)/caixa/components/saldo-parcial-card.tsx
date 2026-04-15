"use client";

import { useEffect, useState } from "react";
import { TrendingUp } from "lucide-react";

import type {
  CaixaResponse,
  SaldoParcialResponse,
} from "@/lib/api/caixa.types";

interface SaldoParcialCardProps {
  saldo: SaldoParcialResponse;
  caixa: CaixaResponse;
}

const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

/**
 * Formata o ISO `abertoEm` para exibição humana — APÓS mount, pra manter
 * SSR e client idênticos (hydration safety, vide CLAUDE.md).
 */
function useFormattedAbertoEm(isoValue: string): string {
  const [formatted, setFormatted] = useState<string>("");
  useEffect(() => {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormatted(isoValue);
      return;
    }
    const pad = (n: number) => String(n).padStart(2, "0");
    const next = `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(
      date.getHours(),
    )}:${pad(date.getMinutes())}`;
    setFormatted(next);
  }, [isoValue]);
  return formatted;
}

/**
 * Exibe o saldo parcial do caixa ativo: total + breakdown por forma de
 * pagamento. Sem estados de hover mirabolantes — foco em legibilidade.
 */
export function SaldoParcialCard({ saldo, caixa }: SaldoParcialCardProps) {
  const formattedAbertoEm = useFormattedAbertoEm(caixa.abertoEm);

  const entradas = Object.entries(saldo.porFormaPagamento ?? {})
    .filter(([, value]) => Number.isFinite(value))
    .sort((a, b) => b[1] - a[1]);

  return (
    <section
      className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm"
      data-testid="saldo-parcial-card"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
            Saldo parcial
          </p>
          <h2 className="mt-1 font-display text-4xl font-extrabold tracking-tight">
            {BRL.format(saldo.total)}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {saldo.movimentosCount}{" "}
            {saldo.movimentosCount === 1 ? "movimento" : "movimentos"} · abriu{" "}
            {formattedAbertoEm || "—"}
          </p>
        </div>
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TrendingUp className="size-5" />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        {entradas.length === 0 ? (
          <p className="text-xs text-muted-foreground md:col-span-3">
            Nenhuma entrada por forma de pagamento ainda — o fundo de abertura
            conta apenas no total.
          </p>
        ) : (
          entradas.map(([formaPagamento, valor]) => (
            <div
              key={formaPagamento}
              className="rounded-xl border border-border/40 bg-muted/30 px-3 py-2"
              data-testid={`saldo-forma-${formaPagamento}`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {formaPagamento}
              </p>
              <p className="mt-1 text-sm font-semibold">
                {BRL.format(valor)}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
