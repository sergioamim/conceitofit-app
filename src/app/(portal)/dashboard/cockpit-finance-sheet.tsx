"use client";

import Link from "next/link";
import type { DashboardData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatBRL, formatDate } from "@/lib/formatters";
import { AlertTriangle } from "lucide-react";

type Pendente = DashboardData["pagamentosPendentes"][number];

export function CockpitFinanceSheet({
  open,
  onOpenChange,
  referenceLabel,
  items,
  inadimplenciaTotal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  referenceLabel: string;
  items: Pendente[];
  inadimplenciaTotal: number;
}) {
  const count = items.length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton
        className="flex w-full flex-col border-l border-border/60 bg-background sm:max-w-lg"
      >
        <SheetHeader className="border-b border-border/40 pb-4 text-left">
          <SheetTitle className="font-display text-xl tracking-tight">
            Cobrança — janela 30 dias
          </SheetTitle>
          <SheetDescription>
            Referência {referenceLabel} · {count} lançamento(s) na lista ·{" "}
            <span className="font-semibold text-foreground">{formatBRL(inadimplenciaTotal)}</span>{" "}
            em inadimplência (KPI alinhado ao painel)
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-2 py-4" data-testid="cockpit-finance-sheet-list">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhum vencido nesta janela.
            </p>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/50 bg-muted/20 p-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gym-danger/15 text-gym-danger">
                      <AlertTriangle size={18} aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold leading-tight">{p.aluno?.nome ?? "—"}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Vence {formatDate(p.dataVencimento)}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-gym-accent">{formatBRL(p.valorFinal)}</p>
                    <StatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <SheetFooter className="border-t border-border/40 pt-2">
          <Button asChild className="w-full rounded-xl font-bold" variant="secondary">
            <Link href="/pagamentos">Abrir recebimentos</Link>
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            Paginação dedicada e scroll infinito no roadmap (contrato paginado).
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
