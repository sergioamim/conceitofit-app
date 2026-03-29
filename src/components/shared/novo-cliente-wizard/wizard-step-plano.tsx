"use client";

import { Check, CheckCircle2 } from "lucide-react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { Plano } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/formatters";
import { TIPO_PLANO_LABEL, type ClienteWizardForm } from "./wizard-types";

export function Step2Plano({
  planos,
  form,
  onSelectPlano
}: {
  planos: Plano[];
  form: UseFormReturn<ClienteWizardForm>;
  onSelectPlano: (plano: Plano) => void;
}) {
  const { control, setValue } = form;
  const selected = useWatch({ control, name: "selectedPlano" });
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Escolha o plano administrativo</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {planos.map((p) => (
          <button key={p.id} type="button" onClick={() => {
            setValue("selectedPlano", p.id);
            onSelectPlano(p);
          }}
            className={cn("relative rounded-xl border p-4 text-left transition-all",
              selected === p.id ? "border-gym-accent bg-gym-accent/5 shadow-sm" : "border-border bg-secondary/40 hover:border-border/80"
            )}
          >
            {p.destaque && (
              <span className="absolute -top-2.5 left-3 rounded-full bg-gym-accent px-2 py-0.5 text-[10px] font-bold uppercase text-background">Popular</span>
            )}
            <div className="font-display font-bold">{p.nome}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{TIPO_PLANO_LABEL[p.tipo]} · {p.duracaoDias} dias</div>
            <div className="mt-2 font-display text-xl font-extrabold text-gym-accent">{formatBRL(p.valor)}</div>
            {p.valorMatricula > 0 && <div className="text-xs text-muted-foreground">+ {formatBRL(p.valorMatricula)} matrícula</div>}
            {p.beneficios?.slice(0, 2).map((b) => (
              <div key={b} className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="size-3 text-gym-teal" />{b}
              </div>
            ))}
            {selected === p.id && <CheckCircle2 className="absolute right-3 top-3 size-4 text-gym-accent" />}
          </button>
        ))}
      </div>
    </div>
  );
}
