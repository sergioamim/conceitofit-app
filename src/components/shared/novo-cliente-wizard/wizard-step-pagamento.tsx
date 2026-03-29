"use client";

import { Controller } from "react-hook-form";
import type { UseFormReturn } from "react-hook-form";
import type { FormaPagamento } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";
import type { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import type { ClienteWizardForm } from "./wizard-types";

export function Step3Pagamento({
  fps, form, commercial
}: {
  fps: FormaPagamento[];
  form: UseFormReturn<ClienteWizardForm>;
  commercial: ReturnType<typeof useCommercialFlow>;
}) {
  const { register, control } = form;
  const { dryRun, selectedPlano } = commercial;

  return (
    <div className="space-y-5">
      {selectedPlano && (
        <div className="rounded-lg border border-border bg-secondary/40 p-4 text-sm">
          <p className="text-muted-foreground">Plano: <span className="font-semibold text-foreground">{selectedPlano.nome}</span></p>
          <p className="text-muted-foreground">Valor: <span className="font-bold text-gym-accent">{formatBRL(selectedPlano.valor)}</span></p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Data de início *
          </label>
          <Input
            type="date"
            {...register("pagamento.dataInicio")}
            onChange={(e) => {
              register("pagamento.dataInicio").onChange(e);
              commercial.setDataInicioPlano(e.target.value);
            }}
            className="bg-card border-border"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Forma de pagamento *</label>
          <Controller name="pagamento.formaPagamento" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full bg-card border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent className="bg-card border-border">
                {fps.map((fp) => (
                  <SelectItem
                    key={fp.id}
                    value={fp.tipo}
                    disabled={fp.tipo === "RECORRENTE" && !!selectedPlano && !selectedPlano.permiteCobrancaRecorrente}
                  >
                    {fp.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desconto (R$)</label>
          <Input
            type="number"
            min={0}
            placeholder="0,00"
            {...register("pagamento.desconto")}
            onChange={(e) => {
              register("pagamento.desconto").onChange(e);
              commercial.setManualDiscount(parseFloat(e.target.value) || 0);
            }}
            className="bg-card border-border"
          />
        </div>
      </div>
      {dryRun && (
        <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(dryRun.subtotal)}</span></div>
          {dryRun.descontoTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Descontos</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoTotal)}</span></div>}
          <div className="flex justify-between border-t border-border pt-1.5 font-semibold">
            <span>Total final</span>
            <span className="font-display text-base font-bold text-gym-accent">{formatBRL(dryRun.total)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
