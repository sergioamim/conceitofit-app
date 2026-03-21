"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  createVendaService,
  listAlunosService,
  listConveniosService,
  listFormasPagamentoService,
  listPlanosService,
} from "@/lib/comercial/runtime";
import { getBusinessTodayIso } from "@/lib/business-date";
import { buildPlanoVendaItems } from "@/lib/comercial/plano-flow";
import { useTenantContext } from "@/hooks/use-session-context";
import type { Aluno, Plano, TipoFormaPagamento, Convenio } from "@/lib/types";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type NovaMatriculaFormValues = {
  alunoId: string;
  planoId: string;
  dataInicio: string;
  formaPagamento: TipoFormaPagamento | "";
  desconto: string;
  motivoDesconto: string;
  renovacao: boolean;
  convenioId: string;
  parcelasAnuidade: string;
  pagamentoPendente: boolean;
};

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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
  const { tenantId, tenantResolved } = useTenantContext();
  const CONVENIO_SEM_CONVENIO = "__SEM_CONVENIO__";

  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [formas, setFormas] = useState<{ id: string; nome: string; tipo: TipoFormaPagamento }[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { control, register, handleSubmit, reset, setValue, getValues } = useForm<NovaMatriculaFormValues>({
    defaultValues: {
      alunoId: "",
      planoId: "",
      dataInicio: getBusinessTodayIso(),
      formaPagamento: "",
      desconto: "",
      motivoDesconto: "",
      renovacao: false,
      convenioId: CONVENIO_SEM_CONVENIO,
      parcelasAnuidade: "1",
      pagamentoPendente: false,
    },
  });

  const alunoId = useWatch({ control, name: "alunoId" });
  const planoId = useWatch({ control, name: "planoId" });
  const selectedPlano = useMemo(() => planos.find((plano) => plano.id === planoId), [planoId, planos]);
  const conveniosPlano = selectedPlano
    ? convenios.filter((convenio) => (convenio.planoIds ?? []).includes(selectedPlano.id))
    : [];

  useEffect(() => {
    if (!open || !tenantResolved || !tenantId) return;
    Promise.all([
      listAlunosService({ tenantId }),
      listPlanosService({ tenantId, apenasAtivos: true }),
      listFormasPagamentoService({ tenantId }),
      listConveniosService(true),
    ])
      .then(([als, pls, fps, cvs]) => {
        setAlunos(als);
        setPlanos(pls);
        setFormas(fps);
        setConvenios(cvs);
        reset({
          alunoId: prefillClienteId ?? "",
          planoId: "",
          dataInicio: getBusinessTodayIso(),
          formaPagamento: "",
          desconto: "",
          motivoDesconto: "",
          renovacao: false,
          convenioId: CONVENIO_SEM_CONVENIO,
          parcelasAnuidade: "1",
          pagamentoPendente: false,
        });
      })
      .catch(() => {
        setAlunos([]);
        setPlanos([]);
        setFormas([]);
        setConvenios([]);
      });
  }, [open, prefillClienteId, reset, tenantId, tenantResolved]);

  useEffect(() => {
    setValue("convenioId", CONVENIO_SEM_CONVENIO);
  }, [CONVENIO_SEM_CONVENIO, planoId, setValue]);

  function resetForm() {
    reset({
      alunoId: "",
      planoId: "",
      dataInicio: getBusinessTodayIso(),
      formaPagamento: "",
      desconto: "",
      motivoDesconto: "",
      renovacao: false,
      convenioId: CONVENIO_SEM_CONVENIO,
      parcelasAnuidade: "1",
      pagamentoPendente: false,
    });
    setError("");
  }

  async function onSubmit(values: NovaMatriculaFormValues) {
    if (!tenantId || !values.alunoId || !values.planoId || !values.dataInicio || !values.formaPagamento) return;
    const plano = planos.find((item) => item.id === values.planoId);
    if (!plano) return;
    if (values.pagamentoPendente) {
      const ok = confirm("Confirmar venda com pagamento pendente?");
      if (!ok) return;
    }
    setLoading(true);
    setError("");
    try {
      const manualDiscount = Math.max(0, Number.parseFloat(values.desconto) || 0);
      const convenioSelecionado =
        values.convenioId === CONVENIO_SEM_CONVENIO ? undefined : convenios.find((item) => item.id === values.convenioId);
      const descontoConvenio = convenioSelecionado ? (Number(plano.valor ?? 0) * convenioSelecionado.descontoPercentual) / 100 : 0;
      const descontoTotal = manualDiscount + descontoConvenio;
      const items = buildPlanoVendaItems(plano, Math.max(1, Number.parseInt(values.parcelasAnuidade, 10) || 1));
      const subtotal = items.reduce((sum, item) => sum + item.valorUnitario * item.quantidade, 0);
      const total = Math.max(0, subtotal - descontoTotal);

      await createVendaService({
        tenantId,
        data: {
          tipo: "PLANO",
          clienteId: values.alunoId,
          itens: items.map((item) => ({
            tipo: item.tipo,
            referenciaId: item.referenciaId,
            descricao: item.descricao,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            desconto: item.desconto,
          })),
          descontoTotal,
          pagamento: {
            formaPagamento: values.formaPagamento as TipoFormaPagamento,
            valorPago: values.pagamentoPendente ? 0 : total,
            status: values.pagamentoPendente ? "PENDENTE" : "PAGO",
          },
          planoContexto: {
            planoId: values.planoId,
            dataInicio: values.dataInicio,
            descontoPlano: manualDiscount,
            motivoDesconto: values.motivoDesconto || undefined,
            renovacaoAutomatica: values.renovacao,
            convenioId: convenioSelecionado?.id,
          },
        },
      });
      setLoading(false);
      resetForm();
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar contratação.");
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Nova contratação de plano</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Este atalho usa o mesmo fluxo comercial da venda canônica e já vincula venda, contratação e cobrança.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cliente *</label>
              {prefillClienteId ? (
                <div className="rounded-md border border-border bg-secondary px-3 py-2 text-sm">
                  {alunos.find((aluno) => aluno.id === alunoId)?.nome ?? "Cliente selecionado"}
                </div>
              ) : (
                <Controller
                  control={control}
                  name="alunoId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                      setValue("parcelasAnuidade", "1");
                      if (!nextPlano?.permiteRenovacaoAutomatica) {
                        setValue("renovacao", false);
                      }
                      if (!nextPlano?.permiteCobrancaRecorrente && getValues("formaPagamento") === "RECORRENTE") {
                        setValue("formaPagamento", "");
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
                <Input type="date" {...register("dataInicio")} className="border-border bg-secondary" />
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
                <Input type="number" min={0} step="0.01" {...register("desconto")} className="border-border bg-secondary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Parcelas da anuidade</label>
                <Input type="number" min={1} max={12} {...register("parcelasAnuidade")} className="border-border bg-secondary" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Motivo do desconto</label>
              <Input {...register("motivoDesconto")} className="border-border bg-secondary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Convênio</label>
              <Controller
                control={control}
                name="convenioId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
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
                <input type="checkbox" {...register("renovacao")} disabled={!selectedPlano?.permiteRenovacaoAutomatica} />
                Renovação automática
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" {...register("pagamentoPendente")} />
                Registrar com pagamento pendente
              </label>
            </div>
            {selectedPlano ? (
              <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
                Total de referência: <span className="font-medium text-foreground">{formatBRL(buildPlanoVendaItems(selectedPlano, Math.max(1, Number.parseInt(getValues("parcelasAnuidade"), 10) || 1)).reduce((sum, item) => sum + item.valorUnitario * item.quantidade - item.desconto, 0))}</span>
              </div>
            ) : null}
            {error ? (
              <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-3 py-2 text-sm text-gym-danger">{error}</div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Confirmar contratação"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
