"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Plano, Atividade } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  type PlanoFormValues,
  TIPO_PLANO_LABEL,
  getDefaultPlanoFormValues,
} from "@/lib/planos/form";

type PlanoModalFormState = Omit<PlanoFormValues, "beneficios"> & {
  beneficioInput: string;
  beneficios: Array<{ value: string }>;
};

function toFormState(initial?: Plano): PlanoModalFormState {
  const seed: PlanoFormValues = initial
    ? {
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        tipo: initial.tipo,
        duracaoDias: String(initial.duracaoDias),
        valor: String(initial.valor),
        valorMatricula: String(initial.valorMatricula ?? 0),
        cobraAnuidade: initial.cobraAnuidade ?? false,
        valorAnuidade: String(initial.valorAnuidade ?? 0),
        parcelasMaxAnuidade: String(initial.parcelasMaxAnuidade ?? 1),
        permiteRenovacaoAutomatica: initial.permiteRenovacaoAutomatica,
        permiteCobrancaRecorrente: initial.permiteCobrancaRecorrente,
        diaCobrancaPadrao: initial.diaCobrancaPadrao ? String(initial.diaCobrancaPadrao) : "",
        contratoTemplateHtml: initial.contratoTemplateHtml ?? "",
        contratoAssinatura: initial.contratoAssinatura ?? "AMBAS",
        contratoEnviarAutomaticoEmail: initial.contratoEnviarAutomaticoEmail ?? false,
        atividades: initial.atividades ?? [],
        beneficios: initial.beneficios ?? [],
        destaque: initial.destaque,
        ordem: initial.ordem ? String(initial.ordem) : "",
      }
    : getDefaultPlanoFormValues();
  return {
    ...seed,
    beneficioInput: "",
    beneficios: seed.beneficios.map((beneficio) => ({ value: beneficio })),
  };
}

function toPayload(values: PlanoModalFormState): PlanoFormValues {
  return {
    ...values,
    beneficios: values.beneficios.map((item) => item.value),
  };
}

export function PlanoModal({
  open,
  onClose,
  onSave,
  atividades,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: PlanoFormValues, id?: string) => void;
  atividades: Atividade[];
  initial?: Plano;
}) {
  const { register, control, handleSubmit, reset, setValue } = useForm<PlanoModalFormState>({
    defaultValues: toFormState(initial),
  });
  const { fields, append, remove } = useFieldArray({ control, name: "beneficios" });
  const form = useWatch({ control }) ?? toFormState(initial);

  useEffect(() => {
    reset(toFormState(initial));
  }, [initial, open, reset]);

  function toggleAtividade(id: string) {
    const current = form.atividades ?? [];
    setValue("atividades", current.includes(id) ? current.filter((item) => item !== id) : [...current, id], { shouldDirty: true });
  }

  function addBeneficio() {
    const beneficioInput = form.beneficioInput ?? "";
    if (!beneficioInput.trim()) return;
    append({ value: beneficioInput.trim() });
    setValue("beneficioInput", "", { shouldDirty: true });
  }

  function handleSave(values: PlanoModalFormState) {
    const payload = toPayload(values);
    if (!payload.nome || !payload.valor || !payload.duracaoDias) return;
    onSave(payload, initial?.id);
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="border-border bg-card sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">{initial ? "Editar Plano" : "Novo Plano"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)}>
          <div className="grid grid-cols-2 gap-5 py-2">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input placeholder="Ex: Mensal Completo" {...register("nome")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input placeholder="Descrição do plano" {...register("descricao")} className="border-border bg-secondary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</label>
                  <Controller
                    control={control}
                    name="tipo"
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(value) => {
                          field.onChange(value);
                          if (value === "AVULSO") {
                            setValue("permiteRenovacaoAutomatica", false);
                            setValue("permiteCobrancaRecorrente", false);
                            setValue("diaCobrancaPadrao", "");
                          }
                        }}
                      >
                        <SelectTrigger className="w-full border-border bg-secondary">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent className="border-border bg-card">
                          {Object.entries(TIPO_PLANO_LABEL).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração (dias) *</label>
                  <Input type="number" min={1} {...register("duracaoDias")} className="border-border bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$) *</label>
                  <Input type="number" min={0} step="0.01" {...register("valor")} className="border-border bg-secondary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Matrícula (R$)</label>
                  <Input type="number" min={0} step="0.01" {...register("valorMatricula")} className="border-border bg-secondary" />
                </div>
              </div>

              <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.cobraAnuidade} onChange={(event) => {
                    setValue("cobraAnuidade", event.target.checked);
                    if (!event.target.checked) {
                      setValue("valorAnuidade", "0");
                      setValue("parcelasMaxAnuidade", "1");
                    }
                  }} />
                  Cobrar anuidade
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" min={0} step="0.01" {...register("valorAnuidade")} disabled={!form.cobraAnuidade} className="border-border bg-secondary" />
                  <Input type="number" min={1} max={24} {...register("parcelasMaxAnuidade")} disabled={!form.cobraAnuidade} className="border-border bg-secondary" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.permiteRenovacaoAutomatica} disabled={form.tipo === "AVULSO"} onChange={(event) => setValue("permiteRenovacaoAutomatica", event.target.checked)} />
                  Renovação automática
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.permiteCobrancaRecorrente} disabled={form.tipo === "AVULSO"} onChange={(event) => {
                    setValue("permiteCobrancaRecorrente", event.target.checked);
                    if (!event.target.checked) setValue("diaCobrancaPadrao", "");
                  }} />
                  Cobrança recorrente
                </label>
                <Input type="number" min={1} max={28} placeholder="Dia padrão" {...register("diaCobrancaPadrao")} disabled={!form.permiteCobrancaRecorrente || form.tipo === "AVULSO"} className="border-border bg-secondary" />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" {...register("destaque")} />
                  Destacar plano
                </label>
                <Input type="number" placeholder="Ordem" {...register("ordem")} className="border-border bg-secondary" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assinatura do contrato</label>
                <Controller
                  control={control}
                  name="contratoAssinatura"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full border-border bg-secondary"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="DIGITAL">Digital</SelectItem>
                        <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                        <SelectItem value="AMBAS">Digital ou presencial</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("contratoEnviarAutomaticoEmail")} />
                Enviar contrato automaticamente por e-mail
              </label>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Template do contrato</label>
                <textarea {...register("contratoTemplateHtml")} className="h-40 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm" />
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividades</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {atividades.map((atividade) => (
                    <button
                      key={atividade.id}
                      type="button"
                      onClick={() => toggleAtividade(atividade.id)}
                      className={cn(
                        "cursor-pointer rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                        (form.atividades ?? []).includes(atividade.id)
                          ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                          : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                      )}
                    >
                      {atividade.nome}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Benefícios</label>
                <div className="mt-2 flex gap-2">
                  <Input {...register("beneficioInput")} className="border-border bg-secondary" />
                  <Button type="button" onClick={addBeneficio}>Adicionar</Button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {fields.map((field, index) => (
                    <span key={field.id} className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {form.beneficios?.[index]?.value ?? ""}
                      <button type="button" onClick={() => remove(index)} className="cursor-pointer text-muted-foreground/60 hover:text-foreground">x</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">Cancelar</Button>
            <Button type="submit">{initial ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
