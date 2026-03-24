"use client";

import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { cn } from "@/lib/utils";
import {
  type PlanoFormValues,
  TIPO_PLANO_LABEL,
  filterAtividadesSelecionadas,
  getDefaultPlanoFormValues,
  isPlanoFormValid,
} from "@/lib/planos/form";
import { useFormDraft } from "@/hooks/use-form-draft";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";

type PlanoFormState = Omit<PlanoFormValues, "beneficios"> & {
  beneficios: Array<{ value: string }>;
};

function toFormState(initial?: PlanoFormValues): PlanoFormState {
  const seed = initial ?? getDefaultPlanoFormValues();
  return {
    ...seed,
    beneficios: seed.beneficios.map((beneficio) => ({ value: beneficio })),
  };
}

function toPayload(values: PlanoFormState): PlanoFormValues {
  return {
    ...values,
    beneficios: values.beneficios.map((item) => item.value),
  };
}

export function PlanoForm({
  initial,
  atividades,
  onSubmit,
  onCancel,
  submitLabel,
  submitting = false,
}: {
  initial?: PlanoFormValues;
  atividades: Atividade[];
  onSubmit: (values: PlanoFormValues) => Promise<void> | void;
  onCancel: () => void;
  submitLabel: string;
  submitting?: boolean;
}) {
  const [beneficioInput, setBeneficioInput] = useState("");
  const [activeTab, setActiveTab] = useState<"CONFIG" | "CONTRATO" | "BENEFICIOS">("CONFIG");
  const [contratoEditorMode, setContratoEditorMode] = useState<"VISUAL" | "HTML">("VISUAL");
  const formMethods = useForm<PlanoFormState>({
    defaultValues: toFormState(initial),
  });
  const { register, control, handleSubmit, reset, setValue } = formMethods;

  const { hasDraft, restoreDraft, discardDraft, clearDraft, lastModified } = useFormDraft({
    key: initial ? "plano_form_edit" : "plano_form_new",
    form: formMethods,
  });

  const { fields: beneficioFields, append, remove } = useFieldArray({
    control,
    name: "beneficios",
  });
  const form = (useWatch({ control }) as PlanoFormState) ?? toFormState(initial);

  useEffect(() => {
    reset(toFormState(initial));
  }, [initial, reset]);

  function toggleAtividade(id: string) {
    const current = form.atividades ?? [];
    setValue(
      "atividades",
      current.includes(id) ? current.filter((atividadeId) => atividadeId !== id) : [...current, id],
      { shouldDirty: true }
    );
  }

  function addBeneficio() {
    if (!beneficioInput.trim()) return;
    append({ value: beneficioInput.trim() });
    setBeneficioInput("");
  }

  async function submitForm(values: PlanoFormState) {
    const payload = toPayload(values);
    if (!isPlanoFormValid(payload) || submitting) return;

    await onSubmit({
      ...payload,
      atividades: filterAtividadesSelecionadas(atividades, payload.atividades),
    });
    
    clearDraft();
  }

  return (
    <>
      <RestoreDraftModal
        hasDraft={hasDraft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
      />
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <button
          type="button"
          onClick={() => setActiveTab("CONFIG")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "CONFIG" ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Configurações
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("CONTRATO")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "CONTRATO" ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Contrato
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("BENEFICIOS")}
          className={cn(
            "cursor-pointer rounded-md px-3 py-2 text-sm font-medium transition-colors",
            activeTab === "BENEFICIOS" ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Atividades e benefícios
        </button>
        <div className="ml-auto">
          <FormDraftIndicator lastModified={lastModified} />
        </div>
      </div>

      {activeTab === "CONFIG" ? (
        <>
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Dados do plano</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input {...register("nome")} placeholder="Ex: Mensal Completo" className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input {...register("descricao")} placeholder="Descrição do plano" className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</label>
                <Controller
                  control={control}
                  name="tipo"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        const tipo = value as TipoPlano;
                        field.onChange(tipo);
                        if (tipo === "AVULSO") {
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
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
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
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Regras financeiras</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-3">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.cobraAnuidade}
                    onChange={(event) => {
                      setValue("cobraAnuidade", event.target.checked);
                      setValue("valorAnuidade", event.target.checked ? (form.valorAnuidade || "0") : "0");
                      setValue("parcelasMaxAnuidade", event.target.checked ? (form.parcelasMaxAnuidade || "1") : "1");
                    }}
                  />
                  Cobrar anuidade (a cada 12 meses)
                </label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor anuidade (R$)</label>
                    <Input type="number" min={0} step="0.01" {...register("valorAnuidade")} disabled={!form.cobraAnuidade} className="border-border bg-secondary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Máx. parcelas anuidade</label>
                    <Input type="number" min={1} max={24} {...register("parcelasMaxAnuidade")} disabled={!form.cobraAnuidade} className="border-border bg-secondary" />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.permiteRenovacaoAutomatica} disabled={form.tipo === "AVULSO"} onChange={(event) => setValue("permiteRenovacaoAutomatica", event.target.checked)} />
                  Permite renovação automática
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={form.permiteCobrancaRecorrente}
                    disabled={form.tipo === "AVULSO"}
                    onChange={(event) => {
                      setValue("permiteCobrancaRecorrente", event.target.checked);
                      if (!event.target.checked) setValue("diaCobrancaPadrao", "");
                    }}
                  />
                  Permite cobrança recorrente
                </label>
                <div className="space-y-1.5 md:max-w-60">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dia padrão de cobrança</label>
                  <Input type="number" min={1} max={28} placeholder="1 a 28" {...register("diaCobrancaPadrao")} disabled={!form.permiteCobrancaRecorrente || form.tipo === "AVULSO"} className="border-border bg-secondary" />
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" {...register("destaque")} />
                  Exibir plano como destaque
                </label>
                <div className="space-y-1.5 md:max-w-60">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ordem</label>
                  <Input type="number" {...register("ordem")} className="border-border bg-secondary" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {activeTab === "CONTRATO" ? (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Contrato do plano</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Assinatura</label>
              <Controller
                control={control}
                name="contratoAssinatura"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="DIGITAL">Digital</SelectItem>
                      <SelectItem value="PRESENCIAL">Presencial</SelectItem>
                      <SelectItem value="AMBAS">Digital ou presencial</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm text-muted-foreground md:mt-0 md:self-end">
              <input type="checkbox" {...register("contratoEnviarAutomaticoEmail")} />
              Enviar contrato automaticamente por e-mail após a venda
            </label>
          </div>
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Template do contrato</label>
              <div className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 p-1">
                <button type="button" onClick={() => setContratoEditorMode("VISUAL")} className={cn("cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors", contratoEditorMode === "VISUAL" ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground")}>Visual</button>
                <button type="button" onClick={() => setContratoEditorMode("HTML")} className={cn("cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors", contratoEditorMode === "HTML" ? "bg-gym-accent/15 text-gym-accent" : "text-muted-foreground hover:text-foreground")}>HTML</button>
              </div>
            </div>
            {contratoEditorMode === "VISUAL" ? (
              <Controller
                control={control}
                name="contratoTemplateHtml"
                render={({ field }) => (
                  <RichTextEditor value={field.value} onChange={field.onChange} placeholder="Digite o contrato do plano. Exemplo: Cliente {{NOME_CLIENTE}}..." />
                )}
              />
            ) : (
              <textarea {...register("contratoTemplateHtml")} placeholder="<h1>Contrato</h1><p>Cliente: {{NOME_CLIENTE}}</p>" className="h-56 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm font-mono outline-none" />
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "BENEFICIOS" ? (
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Atividades e benefícios</h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividades incluídas</p>
              <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                {atividades.map((atividade) => (
                  <button
                    type="button"
                    key={atividade.id}
                    onClick={() => toggleAtividade(atividade.id)}
                    className={cn(
                      "cursor-pointer rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                      (form.atividades ?? []).includes(atividade.id)
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    )}
                  >
                    <span className="block font-medium">{atividade.nome}</span>
                    <span className="mt-1 block text-[11px] opacity-80">
                      {!atividade.ativo ? "Inativa" : atividade.permiteCheckin ? (atividade.checkinObrigatorio ? "Check-in obrigatório" : "Check-in opcional") : "Sem check-in"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Benefícios</label>
              <div className="mt-2 flex gap-2">
                <Input value={beneficioInput} onChange={(event) => setBeneficioInput(event.target.value)} placeholder="Adicionar benefício" className="border-border bg-secondary" />
                <Button type="button" onClick={addBeneficio}>Adicionar</Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {beneficioFields.map((field, index) => (
                  <span key={field.id} className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                    {form.beneficios?.[index]?.value ?? ""}
                    <button type="button" onClick={() => remove(index)} className="cursor-pointer text-muted-foreground/60 hover:text-foreground">
                      x
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" className="border-border" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isPlanoFormValid(toPayload(form)) || submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
    </>
  );
}
