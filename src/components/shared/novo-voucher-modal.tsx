"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, HelpCircle, Info } from "lucide-react";
import { HoverPopover } from "@/components/shared/hover-popover";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import type { Plano, VoucherAplicarEm, VoucherEscopo } from "@/lib/types";

const VOUCHER_TYPES = [
  { value: "DESCONTO", label: "Desconto" },
  { value: "ACESSO", label: "Acesso livre" },
  { value: "SESSAO", label: "Sessão avulsa" },
];

type VoucherCodeType = "UNICO" | "ALEATORIO";

export interface NovoVoucherPayload {
  escopo: VoucherEscopo;
  tipo: string;
  nome: string;
  periodoInicio: string;
  periodoFim?: string;
  prazoDeterminado: boolean;
  quantidade?: number;
  ilimitado: boolean;
  codigoTipo: VoucherCodeType;
  codigoUnicoCustom?: string;
  usarNaVenda: boolean;
  planoIds: string[];
  umaVezPorCliente: boolean;
  aplicarEm: VoucherAplicarEm[];
}

type NovoVoucherFormValues = {
  escopo: VoucherEscopo;
  tipo: string;
  nome: string;
  periodoInicio: string;
  periodoFim: string;
  prazoDeterminado: boolean;
  quantidade: string;
  ilimitada: boolean;
  codigoTipo: VoucherCodeType;
  codigoUnicoCustom: string;
  usarNaVenda: boolean;
  planoIds: string[];
  umaVezPorCliente: boolean;
  aplicarEm: VoucherAplicarEm[];
};

const DEFAULT_VALUES: NovoVoucherFormValues = {
  escopo: "UNIDADE",
  tipo: "",
  nome: "",
  periodoInicio: "",
  periodoFim: "",
  prazoDeterminado: true,
  quantidade: "",
  ilimitada: false,
  codigoTipo: "UNICO",
  codigoUnicoCustom: "",
  usarNaVenda: false,
  planoIds: [],
  umaVezPorCliente: false,
  aplicarEm: ["CONTRATO"],
};

export function NovoVoucherModal({
  open,
  onClose,
  onNext,
  tenantId,
}: {
  open: boolean;
  onClose: () => void;
  onNext: (payload: NovoVoucherPayload) => void;
  tenantId?: string;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    control,
    setValue,
    formState: { errors },
  } = useForm<NovoVoucherFormValues>({
    defaultValues: DEFAULT_VALUES,
  });
  const prazoDeterminado = useWatch({ control, name: "prazoDeterminado" });
  const ilimitada = useWatch({ control, name: "ilimitada" });
  const codigoTipo = useWatch({ control, name: "codigoTipo" });
  const tipo = useWatch({ control, name: "tipo" });
  const planoIds = useWatch({ control, name: "planoIds" }) ?? [];
  const aplicarEm = useWatch({ control, name: "aplicarEm" }) ?? [];

  useEffect(() => {
    if (!open || !tenantId) return;
    void listPlanosApi({ tenantId, apenasAtivos: true }).then(setPlanos);
  }, [open, tenantId]);

  function resetAll() {
    setStep(1);
    reset(DEFAULT_VALUES);
    clearErrors();
  }

  function handleClose() {
    resetAll();
    onClose();
  }

  function handleProximo(values: NovoVoucherFormValues) {
    clearErrors();
    const nextErrors: Record<string, string> = {};
    if (!values.tipo) nextErrors.tipo = "Selecione o tipo de voucher";
    if (!values.nome.trim()) nextErrors.nome = "Informe o nome do voucher";
    if (!values.periodoInicio) nextErrors.periodoInicio = "Informe a data de início";
    if (values.prazoDeterminado && !values.periodoFim) nextErrors.periodoFim = "Informe a data de término";
    if (!values.ilimitada && !values.quantidade) nextErrors.quantidade = "Informe a quantidade ou marque ilimitada";
    if (values.codigoTipo === "UNICO" && !values.codigoUnicoCustom.trim()) nextErrors.codigoUnicoCustom = "Digite o código único do voucher";
    if (Object.keys(nextErrors).length > 0) {
      Object.entries(nextErrors).forEach(([field, message]) => {
        setError(field as keyof NovoVoucherFormValues, { type: "manual", message });
      });
      return;
    }
    setStep(2);
  }

  function handleGerar(values: NovoVoucherFormValues) {
    onNext({
      escopo: values.escopo,
      tipo: values.tipo,
      nome: values.nome.trim(),
      periodoInicio: values.periodoInicio,
      periodoFim: values.prazoDeterminado ? values.periodoFim : undefined,
      prazoDeterminado: values.prazoDeterminado,
      quantidade: values.ilimitada ? undefined : Number(values.quantidade),
      ilimitado: values.ilimitada,
      codigoTipo: values.codigoTipo,
      codigoUnicoCustom: values.codigoTipo === "UNICO" ? values.codigoUnicoCustom.trim().toUpperCase() : undefined,
      usarNaVenda: values.usarNaVenda,
      planoIds: values.planoIds,
      umaVezPorCliente: values.umaVezPorCliente,
      aplicarEm: values.aplicarEm,
    });
    resetAll();
  }

  function togglePlano(id: string) {
    setValue(
      "planoIds",
      planoIds.includes(id) ? planoIds.filter((item) => item !== id) : [...planoIds, id],
      { shouldDirty: true }
    );
  }

  function toggleAplicarEm(value: VoucherAplicarEm) {
    setValue(
      "aplicarEm",
      aplicarEm.includes(value) ? aplicarEm.filter((item) => item !== value) : [...aplicarEm, value],
      { shouldDirty: true }
    );
  }

  const todosPlanosSelecionados = planos.length > 0 && planoIds.length === planos.length;

  function toggleTodosPlanos() {
    setValue("planoIds", todosPlanosSelecionados ? [] : planos.map((plano) => plano.id), { shouldDirty: true });
  }

  const TIPO_LABEL: Record<string, string> = {
    DESCONTO: "Desconto",
    ACESSO: "Acesso livre",
    SESSAO: "Sessão avulsa",
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Novo voucher
            <span className="ml-2 text-sm font-normal text-muted-foreground">Passo {step} de 2</span>
          </DialogTitle>
        </DialogHeader>

        {step === 1 ? (
          <form className="max-h-[65vh] space-y-5 overflow-y-auto pr-1" onSubmit={handleSubmit(handleProximo)}>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Escopo</span>
                <HoverPopover content="Unidade: voucher exclusivo da unidade atual. Grupo: voucher global para todas as unidades da rede.">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </HoverPopover>
              </div>
              <select {...register("escopo")} className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm">
                <option value="UNIDADE">Apenas esta unidade</option>
                <option value="GRUPO">Grupo (rede inteira)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Tipo de voucher *</span>
                <HoverPopover content="Escolha a finalidade do voucher (desconto, sessão, acesso etc.).">
                  <HelpCircle className="size-4 text-muted-foreground" />
                </HoverPopover>
              </div>
              <Controller
                control={control}
                name="tipo"
                render={({ field }) => (
                  <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                    <SelectTrigger className="w-full border-border bg-secondary text-sm">
                      <SelectValue placeholder="Selecione o tipo de voucher" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="__none__">Selecione</SelectItem>
                      {VOUCHER_TYPES.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo ? <p className="text-xs text-gym-danger">{errors.tipo.message}</p> : null}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Nome do voucher *</span>
                <HoverPopover content="Ex: Bônus de verão ou Voucher amigo">
                  <Info className="size-4 text-muted-foreground" />
                </HoverPopover>
              </div>
              <Input {...register("nome")} className="border-border bg-secondary" placeholder="Digite o nome do voucher" />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>

            <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Período de validade</p>
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                  <input type="checkbox" checked={!prazoDeterminado} onChange={(event) => setValue("prazoDeterminado", !event.target.checked)} />
                  Prazo indeterminado
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Início *
                    <Calendar className="size-3.5" />
                  </label>
                  <Input type="date" {...register("periodoInicio")} className="border-border bg-background" />
                  {errors.periodoInicio ? <p className="text-xs text-gym-danger">{errors.periodoInicio.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Término {prazoDeterminado ? "*" : ""}
                    <Calendar className="size-3.5" />
                  </label>
                  <Input type="date" {...register("periodoFim")} disabled={!prazoDeterminado} className="border-border bg-background disabled:opacity-40" />
                  {errors.periodoFim ? <p className="text-xs text-gym-danger">{errors.periodoFim.message}</p> : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quantidade</label>
                  <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <input type="checkbox" {...register("ilimitada")} />
                    Ilimitada
                  </label>
                </div>
                <Input type="number" min={1} {...register("quantidade")} disabled={ilimitada} className="border-border bg-secondary" />
                {errors.quantidade ? <p className="text-xs text-gym-danger">{errors.quantidade.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código</label>
                <Controller
                  control={control}
                  name="codigoTipo"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as VoucherCodeType)}>
                      <SelectTrigger className="w-full border-border bg-secondary text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-border bg-card">
                        <SelectItem value="UNICO">Único</SelectItem>
                        <SelectItem value="ALEATORIO">Aleatório</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            {codigoTipo === "UNICO" ? (
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Código customizado *</label>
                <Input {...register("codigoUnicoCustom")} className="border-border bg-secondary" placeholder="EX: AMIGO30" />
                {errors.codigoUnicoCustom ? <p className="text-xs text-gym-danger">{errors.codigoUnicoCustom.message}</p> : null}
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("usarNaVenda")} />
              Permitir aplicação direta na venda
            </label>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} className="border-border">Cancelar</Button>
              <Button type="submit">Próximo</Button>
            </DialogFooter>
          </form>
        ) : (
          <form className="max-h-[65vh] space-y-5 overflow-y-auto pr-1" onSubmit={handleSubmit(handleGerar)}>
            <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm">
              <p className="font-medium">{TIPO_LABEL[tipo ?? ""] ?? "Voucher"}</p>
              <p className="mt-1 text-muted-foreground">
                Configure onde o voucher poderá ser usado e como ele se comporta no contrato.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Planos elegíveis</p>
                <Button type="button" variant="outline" size="sm" className="border-border" onClick={toggleTodosPlanos}>
                  {todosPlanosSelecionados ? "Limpar todos" : "Selecionar todos"}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {planos.map((plano) => (
                  <button
                    key={plano.id}
                    type="button"
                    onClick={() => togglePlano(plano.id)}
                    className={`rounded-md border px-2.5 py-2 text-left text-xs transition-colors ${
                      planoIds.includes(plano.id)
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {plano.nome}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" {...register("umaVezPorCliente")} />
              Permitir uso apenas uma vez por cliente
            </label>

            <div className="space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aplicar em</p>
              <div className="grid grid-cols-2 gap-2">
                {(["CONTRATO", "VENDA", "CHECKOUT", "PENDENCIA"] as VoucherAplicarEm[]).map((item) => (
                  <label key={item} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                    <input type="checkbox" checked={aplicarEm.includes(item)} onChange={() => toggleAplicarEm(item)} />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep(1)} className="border-border">Voltar</Button>
              <Button type="submit">Gerar voucher</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
