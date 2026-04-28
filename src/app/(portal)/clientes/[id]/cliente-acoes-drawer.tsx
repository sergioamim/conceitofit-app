"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PrioridadeAcao, SugestaoAcao, TipoAcao } from "@/lib/domain/sugestoes-cliente";
import {
  Coins,
  ShieldCheck,
  MessageCircle,
  Gift,
  Camera,
  KeyRound,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICON_BY_TIPO: Record<TipoAcao, LucideIcon> = {
  "cobrar-pendencia": Coins,
  "reativar-plano": ShieldCheck,
  "renovar-plano": ShieldCheck,
  "retencao-ativa": MessageCircle,
  "parabens-aniversario": Gift,
  "liberar-acesso": KeyRound,
  "solicitar-foto": Camera,
};

const PRIORIDADE_CLASSES: Record<PrioridadeAcao, { chip: string; label: string }> = {
  alta: {
    chip: "bg-gym-danger/15 text-gym-danger border-gym-danger/30",
    label: "Alta",
  },
  media: {
    chip: "bg-gym-warning/15 text-gym-warning border-gym-warning/30",
    label: "Média",
  },
  baixa: {
    chip: "bg-muted text-muted-foreground border-border",
    label: "Baixa",
  },
};

export function ClienteAcoesDrawer({
  open,
  onOpenChange,
  sugestoes,
  onAction,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sugestoes: SugestaoAcao[];
  onAction: (sugestao: SugestaoAcao) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0">
        <SheetHeader className="border-b border-border bg-gym-accent/5 p-5">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gym-accent" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gym-accent">
              Próximas ações
            </span>
          </div>
          <SheetTitle className="mt-1 text-lg">
            {sugestoes.length} oportunidade{sugestoes.length !== 1 ? "s" : ""}
          </SheetTitle>
          <SheetDescription>
            Sugestões priorizadas geradas a partir da situação atual do cliente.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4">
          {sugestoes.length === 0 ? (
            <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Nada a sugerir no momento. Este cliente está em dia.
            </div>
          ) : (
            <ul className="space-y-2">
              {sugestoes.map((s) => {
                const Icon = ICON_BY_TIPO[s.tipo];
                const prio = PRIORIDADE_CLASSES[s.prioridade];
                return (
                  <li
                    key={s.id}
                    className="rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-md border",
                          prio.chip
                        )}
                        aria-hidden
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{s.titulo}</p>
                          <span
                            className={cn(
                              "shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                              prio.chip
                            )}
                          >
                            {prio.label}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.descricao}</p>
                        <Button
                          size="sm"
                          variant={s.prioridade === "alta" ? "default" : "outline"}
                          className="mt-2 h-7 text-xs"
                          onClick={() => {
                            onAction(s);
                            onOpenChange(false);
                          }}
                        >
                          {s.cta}
                        </Button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
