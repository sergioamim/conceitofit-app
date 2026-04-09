"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { getBusinessTodayIso } from "@/lib/business-date";
import { requiredTrimmedString, optionalTrimmedString } from "@/lib/forms/zod-helpers";
import { useFormDraft } from "@/hooks/use-form-draft";
import { FormDraftIndicator, RestoreDraftModal } from "@/components/shared/form-draft-components";
import { useCommercialFlow } from "@/lib/tenant/hooks/use-commercial-flow";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import type { TipoFormaPagamento } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatBRL } from "@/lib/formatters";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

const novaMatriculaSchema = z.object({
  alunoId: requiredTrimmedString("Selecione o cliente."),
  planoId: requiredTrimmedString("Selecione o plano."),
  dataInicio: requiredTrimmedString("Informe a data de início."),
  formaPagamento: z.enum(["DINHEIRO", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "BOLETO", "RECORRENTE"], {
    message: "Selecione a forma de pagamento.",
  }).or(z.literal("")),
  desconto: z.string(),
  motivoDesconto: optionalTrimmedString().default(""),
  renovacao: z.boolean(),
  convenioId: z.string(),
  parcelasAnuidade: z.string(),
  pagamentoPendente: z.boolean(),
});

type NovaMatriculaFormValues = z.infer<typeof novaMatriculaSchema>;

export function NovaMatriculaModal({
  open,
  onClose,
  onDone,
  prefillClienteId,
}: {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
  prefillClienteId?: string;
}) {
  const { tenantId } = useTenantContext();
  const CONVENIO_SEM_CONVENIO = "__SEM_CONVENIO__";

  const commercial = useCommercialFlow({
    tenantId,
    initialClienteId: prefillClienteId,
  });

  const {
    alunos,
    planos,
    formasPagamento: formas,
    loadAlunos,
    setClienteId,
    selectedPlano,
    conveniosPlano,
    setConvenioPlanoId,
    addPlanoToCart,
    clearCart,
    dryRun,
    total,
    processSale,
    saving: loading,
  } = commercial;

  const [error, setError] = useState("");
  const { confirm, ConfirmDialog: ConfirmPendente } = useConfirmDialog();
  const formMethods = useForm<NovaMatriculaFormValues>({
    resolver: zodResolver(novaMatriculaSchema),
    defaultValues: {
      alunoId: prefillClienteId ?? "",
      planoId: "",
      dataInicio: getBusinessTodayIso(),
      formaPagamento: "",
      desconto: "0",
      motivoDesconto: "",
      renovacao: false,
      convenioId: CONVENIO_SEM_CONVENIO,
      parcelasAnuidade: "1",
      pagamentoPendente: false,
    },
  });
  const { control, register, handleSubmit, reset, setValue } = formMethods;

  const { hasDraft, restoreDraft, discardDraft, clearDraft, lastModified } = useFormDraft({
    key: "nova_matricula",
    form: formMethods,
  });

  useEffect(() => {
    if (open) {
      loadAlunos();
    }
  }, [open, loadAlunos]);

  useEffect(() => {
    if (prefillClienteId) {
      setClienteId(prefillClienteId);
      setValue("alunoId", prefillClienteId);
    }
  }, [prefillClienteId, setClienteId, setValue]);

  function resetForm() {
    reset({
      alunoId: prefillClienteId ?? "",
      planoId: "",
      dataInicio: getBusinessTodayIso(),
      formaPagamento: "",
      desconto: "0",
      motivoDesconto: "",
      renovacao: false,
      convenioId: CONVENIO_SEM_CONVENIO,
      parcelasAnuidade: "1",
      pagamentoPendente: false,
    });
    setError("");
    clearCart();
  }

  async function executeSubmit(values: NovaMatriculaFormValues) {
    setError("");
    try {
      await processSale({
        formaPagamento: values.formaPagamento as TipoFormaPagamento,
        valorPago: values.pagamentoPendente ? 0 : total,
        status: values.pagamentoPendente ? "PENDENTE" : "PAGO",
      });

      clearDraft();
      resetForm();
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar contratação.");
    }
  }

  function onSubmit(values: NovaMatriculaFormValues) {
    if (!tenantId || !values.alunoId || !values.planoId || !values.dataInicio || !values.formaPagamento || !dryRun) return;

    if (values.pagamentoPendente) {
      confirm("Confirmar venda com pagamento pendente?", () => executeSubmit(values), {
        title: "Pagamento pendente",
        confirmLabel: "Confirmar venda",
      });
      return;
    }
    void executeSubmit(values);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          onClose();
          resetForm();
        }
      }}
    >
      {ConfirmPendente}
      <RestoreDraftModal
        hasDraft={hasDraft && open}
        onRestore={restoreDraft}
        onDiscard={discardDraft}
      />
      <DialogContent className="border-border bg-card sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Nova contratação de plano</DialogTitle>
          </DialogHeader>
          <FormDraftIndicator lastModified={lastModified} />
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Este atalho utiliza o motor comercial unificado para garantir consistência de regras e valores.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente *</label>
              {prefillClienteId ? (
                <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                  {alunos.find((aluno) => aluno.id === prefillClienteId)?.nome ?? "Cliente selecionado"}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="alunoId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(val) => {
                      field.onChange(val);
                      setClienteId(val);
                    }}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        {alunos.map((aluno) => (
                          <SelectItem key={aluno.id} value={aluno.id}>
                            {aluno.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plano *</label>
              <Controller
                control={control}
                name="planoId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(nextPlanoId) => {
                      const nextPlano = planos.find((plano) => plano.id === nextPlanoId);
                      field.onChange(nextPlanoId);
                      if (nextPlano) {
                        addPlanoToCart(nextPlano);
                        setValue("parcelasAnuidade", "1");
                        setValue("renovacao", nextPlano.permiteRenovacaoAutomatica);
                      }
                    }}
                  >
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {planos.map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Data de início *</label>
                <Input 
                  type="date" 
                  {...register("dataInicio")} 
                  onChange={(e) => {
                    register("dataInicio").onChange(e);
                    commercial.setDataInicioPlano(e.target.value);
                  }}
                  className="border-border bg-secondary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Forma de pagamento *</label>
                <Controller
                  control={control}
                  name="formaPagamento"
                  render={({ field }) => (
                    <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                      <SelectTrigger className="w-full border-border bg-secondary">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="__none__">Selecione</SelectItem>
                        {formas.map((fp) => (
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
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Desconto (R$)</label>
                <Input 
                  type="number" 
                  min={0} 
                  step="0.01" 
                  {...register("desconto")} 
                  onChange={(e) => {
                    register("desconto").onChange(e);
                    commercial.setManualDiscount(parseFloat(e.target.value) || 0);
                  }}
                  className="border-border bg-secondary" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas da anuidade</label>
                <Input 
                  type="number" 
                  min={1} 
                  max={selectedPlano?.parcelasMaxAnuidade || 1} 
                  {...register("parcelasAnuidade")} 
                  onChange={(e) => {
                    register("parcelasAnuidade").onChange(e);
                    commercial.setParcelasAnuidade(e.target.value);
                  }}
                  className="border-border bg-secondary" 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Motivo do desconto</label>
              <Input 
                {...register("motivoDesconto")} 
                onChange={(e) => {
                  register("motivoDesconto").onChange(e);
                  commercial.setMotivoDesconto(e.target.value);
                }}
                className="border-border bg-secondary" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Convênio</label>
              <Controller
                control={control}
                name="convenioId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(val) => {
                    field.onChange(val);
                    setConvenioPlanoId(val);
                  }}>
                    <SelectTrigger className="w-full border-border bg-secondary">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value={CONVENIO_SEM_CONVENIO}>Sem convênio</SelectItem>
                      {conveniosPlano.map((convenio) => (
                        <SelectItem key={convenio.id} value={convenio.id}>
                          {convenio.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2 rounded-lg border border-border bg-secondary/30 p-3 text-sm">
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  {...register("renovacao")} 
                  disabled={!selectedPlano?.permiteRenovacaoAutomatica}
                  onChange={(e) => {
                    register("renovacao").onChange(e);
                    commercial.setRenovacaoAutomaticaPlano(e.target.checked);
                  }}
                />
                Renovação automática
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("pagamentoPendente")} />
                Registrar com pagamento pendente
              </label>
            </div>
            {dryRun && (
              <div className="rounded-xl border border-border bg-card p-3 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatBRL(dryRun.subtotal)}</span></div>
                {dryRun.descontoTotal > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Descontos</span><span className="text-gym-teal">- {formatBRL(dryRun.descontoTotal)}</span></div>}
                <div className="flex justify-between border-t border-border pt-1.5 font-semibold text-sm">
                  <span>Total final</span>
                  <span className="text-gym-accent">{formatBRL(dryRun.total)}</span>
                </div>
              </div>
            )}
            {error ? (
              <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">{error}</div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { onClose(); resetForm(); }} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !dryRun}>
              {loading ? "Salvando..." : "Confirmar contratação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
