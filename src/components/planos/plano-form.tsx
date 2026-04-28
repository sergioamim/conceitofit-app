"use client";

import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import type { Atividade, TipoPlano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { cn } from "@/lib/utils";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import {
  type PlanoFormValues,
  TIPO_PLANO_LABEL,
  filterAtividadesSelecionadas,
  getDefaultPlanoFormValues,
} from "@/lib/tenant/planos/form";
import { useFormDraft } from "@/hooks/use-form-draft";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";
import { planoFormSchema } from "./plano-form-schema";

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
  const [submitError, setSubmitError] = useState<string | null>(null);
  const formMethods = useForm<PlanoFormState>({
    resolver: zodResolver(planoFormSchema),
    defaultValues: toFormState(initial),
    mode: "onChange",
  });
  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors, isValid },
  } = formMethods;

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

  function setTodasAtividadesSelecionadas(selected: boolean) {
    setValue(
      "atividades",
      selected ? atividades.map((atividade) => atividade.id) : [],
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
    if (submitting) return;

    try {
      setSubmitError(null);
      await onSubmit({
        ...payload,
        atividades: filterAtividadesSelecionadas(atividades, payload.atividades),
      });
      clearDraft();
    } catch (error) {
      const fieldResult = applyApiFieldErrors(error, setError);
      if (fieldResult.appliedFields.length > 0) {
        if (fieldResult.appliedFields.some((field) => ["contratoTemplateHtml", "contratoAssinatura"].includes(field))) {
          setActiveTab("CONTRATO");
        } else if (fieldResult.appliedFields.some((field) => ["atividades", "beneficios"].includes(field))) {
          setActiveTab("BENEFICIOS");
        } else {
          setActiveTab("CONFIG");
        }
      }

      const message = buildFormApiErrorMessage(error, {
        appliedFields: fieldResult.appliedFields,
      });
      if (message) {
        setSubmitError(message);
      }
    }
  }

  return (
    <>
      <RestoreDraftModal
        hasDraft={hasDraft}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
      />
      <form className="space-y-6" onSubmit={handleSubmit(submitForm)}>
      {submitError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {submitError}
        </div>
      ) : null}
      <div role="tablist" aria-label="Seções do plano" className="flex items-center gap-2 rounded-xl border border-border bg-card p-2">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "CONFIG"}
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
          role="tab"
          aria-selected={activeTab === "CONTRATO"}
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
          role="tab"
          aria-selected={activeTab === "BENEFICIOS"}
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
        <div role="tabpanel" aria-label="Configurações">
          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="text-base font-semibold text-foreground">Dados do plano</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="plano-form-nome" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome *</label>
                <Input id="plano-form-nome" {...register("nome")} placeholder="Ex: Mensal Completo" className="border-border bg-secondary" />
                {errors.nome?.message ? <p className="text-xs text-destructive">{errors.nome.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plano-form-descricao" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Descrição</label>
                <Input id="plano-form-descricao" {...register("descricao")} placeholder="Descrição do plano" className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plano-form-tipo" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tipo *</label>
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
                      <SelectTrigger id="plano-form-tipo" className="w-full border-border bg-secondary">
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
                {errors.tipo?.message ? <p className="text-xs text-destructive">{errors.tipo.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plano-form-duracao-dias" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Duração (dias) *</label>
                <Input id="plano-form-duracao-dias" type="number" min={1} {...register("duracaoDias")} className="border-border bg-secondary" />
                {errors.duracaoDias?.message ? <p className="text-xs text-destructive">{errors.duracaoDias.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plano-form-valor" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Valor (R$) *</label>
                <Input id="plano-form-valor" type="number" min={0} step="0.01" {...register("valor")} className="border-border bg-secondary" />
                {errors.valor?.message ? <p className="text-xs text-destructive">{errors.valor.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="plano-form-valor-matricula" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Matrícula (R$)</label>
                <Input id="plano-form-valor-matricula" type="number" min={0} step="0.01" {...register("valorMatricula")} className="border-border bg-secondary" />
                {errors.valorMatricula?.message ? <p className="text-xs text-destructive">{errors.valorMatricula.message}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 md:p-5">
            <h2 className="text-base font-semibold text-foreground">Regras financeiras</h2>
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
                    {errors.valorAnuidade?.message ? <p className="text-xs text-destructive">{errors.valorAnuidade.message}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Máx. parcelas anuidade</label>
                    <Input type="number" min={1} max={24} {...register("parcelasMaxAnuidade")} disabled={!form.cobraAnuidade} className="border-border bg-secondary" />
                    {errors.parcelasMaxAnuidade?.message ? <p className="text-xs text-destructive">{errors.parcelasMaxAnuidade.message}</p> : null}
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
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Dia de cobrança</label>
                  <Input placeholder="Ex: 5" {...register("diaCobrancaPadrao")} disabled={!form.permiteCobrancaRecorrente || form.tipo === "AVULSO"} className="border-border bg-secondary" />
                  <p className="text-[10px] text-muted-foreground">Informe um único dia de 1 a 28. Vazio = livre.</p>
                  {errors.diaCobrancaPadrao?.message ? <p className="text-xs text-destructive">{errors.diaCobrancaPadrao.message}</p> : null}
                </div>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" {...register("destaque")} />
                  Exibir plano como destaque
                </label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" {...register("permiteVendaOnline")} />
                  Permitir venda online na storefront
                </label>
                <div className="space-y-1.5 md:max-w-60">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ordem</label>
                  <Input type="number" {...register("ordem")} className="border-border bg-secondary" />
                  {errors.ordem?.message ? <p className="text-xs text-destructive">{errors.ordem.message}</p> : null}
                </div>
                <div className="space-y-1.5 md:max-w-60">
                  <label
                    htmlFor="plano-form-parcelas-maximas-cartao"
                    className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    Máx. parcelas em cartão de crédito
                  </label>
                  <Input
                    id="plano-form-parcelas-maximas-cartao"
                    type="number"
                    min={1}
                    max={24}
                    placeholder="12"
                    {...register("parcelasMaximasCartao")}
                    className="border-border bg-secondary"
                    data-testid="plano-form-parcelas-maximas-cartao"
                  />
                  <p className="text-[10px] text-muted-foreground">Vazio = default 12x. Aplica ao parcelamento no momento da venda.</p>
                  {errors.parcelasMaximasCartao?.message ? <p className="text-xs text-destructive">{errors.parcelasMaximasCartao.message}</p> : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "CONTRATO" ? (
        <div role="tabpanel" aria-label="Contrato">
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="text-base font-semibold text-foreground">Contrato do plano</h2>
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
              {errors.contratoAssinatura?.message ? <p className="text-xs text-destructive">{errors.contratoAssinatura.message}</p> : null}
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
              <textarea {...register("contratoTemplateHtml")} placeholder="<h1>Contrato</h1><p>Cliente: {{NOME_CLIENTE}}</p>" className="focus-ring-brand h-56 w-full resize-y rounded-md border border-border bg-secondary p-3 text-sm font-mono outline-none" />
            )}
          </div>
        </div>
        </div>
      ) : null}

      {activeTab === "BENEFICIOS" ? (
        <div role="tabpanel" aria-label="Atividades e benefícios">
        <div className="rounded-xl border border-border bg-card p-4 md:p-5">
          <h2 className="text-base font-semibold text-foreground">Atividades e benefícios</h2>
          <div className="mt-4 space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Atividades incluídas</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setTodasAtividadesSelecionadas(true)}
                    disabled={atividades.length === 0}
                  >
                    Selecionar todas
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => setTodasAtividadesSelecionadas(false)}
                    disabled={(form.atividades ?? []).length === 0}
                  >
                    Limpar
                  </Button>
                </div>
              </div>
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
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" className="border-border" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!isValid || submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
    </>
  );
}
