"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, HelpCircle, Info } from "lucide-react";
import { HoverPopover } from "@/components/shared/hover-popover";
import { updateVoucherApi } from "@/lib/api/beneficios";
import { listPlanosApi } from "@/lib/api/comercial-catalogo";
import type { Plano, Voucher, VoucherAplicarEm, VoucherEscopo } from "@/lib/types";

const VOUCHER_TYPES = [
  { value: "DESCONTO", label: "Desconto" },
  { value: "ACESSO", label: "Acesso livre" },
  { value: "SESSAO", label: "Sessão avulsa" },
];

type EditarVoucherFormValues = {
  escopo: VoucherEscopo;
  tipo: string;
  nome: string;
  periodoInicio: string;
  periodoFim: string;
  prazoDeterminado: boolean;
  quantidade: string;
  ilimitada: boolean;
  usarNaVenda: boolean;
  planoIds: string[];
  umaVezPorCliente: boolean;
  aplicarEm: VoucherAplicarEm[];
};

function buildDefaultValues(voucher: Voucher): EditarVoucherFormValues {
  return {
    escopo: voucher.escopo,
    tipo: voucher.tipo,
    nome: voucher.nome,
    periodoInicio: voucher.periodoInicio,
    periodoFim: voucher.periodoFim ?? "",
    prazoDeterminado: voucher.prazoDeterminado,
    quantidade: voucher.quantidade?.toString() ?? "",
    ilimitada: voucher.ilimitado,
    usarNaVenda: voucher.usarNaVenda,
    planoIds: voucher.planoIds ?? [],
    umaVezPorCliente: voucher.umaVezPorCliente,
    aplicarEm: voucher.aplicarEm,
  };
}

export function EditarVoucherModal({
  tenantId,
  voucher,
  onClose,
  onSaved,
}: {
  tenantId?: string;
  voucher: Voucher;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<EditarVoucherFormValues>({
    defaultValues: buildDefaultValues(voucher),
  });
  const prazoDeterminado = useWatch({ control, name: "prazoDeterminado" });
  const ilimitada = useWatch({ control, name: "ilimitada" });
  const planoIds = useWatch({ control, name: "planoIds" }) ?? [];
  const aplicarEm = useWatch({ control, name: "aplicarEm" }) ?? [];

  useEffect(() => {
    reset(buildDefaultValues(voucher));
    clearErrors();
    setSaveError("");
  }, [clearErrors, reset, voucher]);

  useEffect(() => {
    if (!tenantId) {
      setPlanos([]);
      return;
    }
    void listPlanosApi({ tenantId, apenasAtivos: true }).then(setPlanos);
  }, [tenantId]);

  const todosPlanosSelecionados = planos.length > 0 && planoIds.length === planos.length;

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

  function toggleTodosPlanos() {
    setValue("planoIds", todosPlanosSelecionados ? [] : planos.map((plano) => plano.id), { shouldDirty: true });
  }

  async function handleSalvar(values: EditarVoucherFormValues) {
    clearErrors();
    setSaveError("");

    const nextErrors: Partial<Record<keyof EditarVoucherFormValues, string>> = {};
    if (!values.tipo) nextErrors.tipo = "Selecione o tipo de voucher";
    if (!values.nome.trim()) nextErrors.nome = "Informe o nome do voucher";
    if (!values.periodoInicio) nextErrors.periodoInicio = "Informe a data de início";
    if (values.prazoDeterminado && !values.periodoFim) nextErrors.periodoFim = "Informe a data de término";
    if (!values.ilimitada && !values.quantidade) nextErrors.quantidade = "Informe a quantidade ou marque ilimitada";

    if (Object.keys(nextErrors).length > 0) {
      Object.entries(nextErrors).forEach(([field, message]) => {
        setError(field as keyof EditarVoucherFormValues, {
          type: "manual",
          message,
        });
      });
      return;
    }

    setSaving(true);
    try {
      await updateVoucherApi(voucher.id, {
        escopo: values.escopo,
        tipo: values.tipo,
        nome: values.nome.trim(),
        periodoInicio: values.periodoInicio,
        periodoFim: values.prazoDeterminado ? values.periodoFim : undefined,
        prazoDeterminado: values.prazoDeterminado,
        quantidade: values.ilimitada ? undefined : Number(values.quantidade),
        ilimitado: values.ilimitada,
        usarNaVenda: values.usarNaVenda,
        planoIds: values.planoIds,
        umaVezPorCliente: values.umaVezPorCliente,
        aplicarEm: values.aplicarEm,
      });
      onSaved();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Erro ao salvar voucher.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <DialogContent className="max-w-lg border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">Editar voucher</DialogTitle>
        </DialogHeader>

        <form className="max-h-[65vh] space-y-5 overflow-y-auto pr-1" onSubmit={handleSubmit(handleSalvar)}>
          {saveError ? (
            <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/10 px-4 py-3 text-sm text-gym-danger">
              {saveError}
            </div>
          ) : null}

          <div className="space-y-0.5 rounded-xl border border-border bg-secondary/40 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de código (não editável)
            </p>
            <p className="text-sm font-medium">
              {voucher.codigoTipo === "UNICO" ? "Código único" : "Códigos aleatórios"}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Escopo</span>
              <HoverPopover content="Unidade: voucher exclusivo da unidade atual. Grupo: voucher global para toda a rede.">
                <HelpCircle className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <Controller
              control={control}
              name="escopo"
              render={({ field }) => (
                <Select value={field.value} onValueChange={(value) => field.onChange(value as VoucherEscopo)}>
                  <SelectTrigger className="w-full border-border bg-secondary text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-border bg-card">
                    <SelectItem value="UNIDADE">Apenas esta unidade</SelectItem>
                    <SelectItem value="GRUPO">Grupo (rede inteira)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Tipo de voucher *</span>
              <HoverPopover content="Finalidade do voucher (desconto, sessão, acesso etc.).">
                <HelpCircle className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <Controller
              control={control}
              name="tipo"
              render={({ field }) => (
                <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                  <SelectTrigger className="w-full border-border bg-secondary text-sm">
                    <SelectValue />
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
            <Input {...register("nome")} className="border-border bg-secondary" />
            {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Período de validade
              </p>
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={!prazoDeterminado}
                  onChange={(event) => setValue("prazoDeterminado", !event.target.checked, { shouldDirty: true })}
                />
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
                <Input
                  type="date"
                  {...register("periodoFim")}
                  disabled={!prazoDeterminado}
                  className="border-border bg-background disabled:opacity-40"
                />
                {errors.periodoFim ? <p className="text-xs text-gym-danger">{errors.periodoFim.message}</p> : null}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Quantidade *
              <HoverPopover content="Quantidade máxima de vouchers emitidos.">
                <Info className="size-4 text-muted-foreground" />
              </HoverPopover>
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min={1}
                step={1}
                {...register("quantidade")}
                disabled={ilimitada}
                className="w-28 border-border bg-secondary disabled:opacity-40"
                placeholder="Ex: 100"
              />
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                <input type="checkbox" {...register("ilimitada")} />
                Ilimitada
              </label>
            </div>
            {!ilimitada && errors.quantidade ? <p className="text-xs text-gym-danger">{errors.quantidade.message}</p> : null}
          </div>

          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            <input id="usarNaVendaEdit" type="checkbox" {...register("usarNaVenda")} />
            Utilizar na página de vendas
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Contratos aplicáveis
              </p>
              {planos.length > 0 ? (
                <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={todosPlanosSelecionados}
                    onChange={toggleTodosPlanos}
                  />
                  Selecionar todos
                </label>
              ) : null}
            </div>
            <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-xl border border-border bg-secondary/40 p-3">
              {planos.map((plano) => (
                <label
                  key={plano.id}
                  className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={planoIds.includes(plano.id)}
                    onChange={() => togglePlano(plano.id)}
                  />
                  <span className="flex-1">{plano.nome}</span>
                  <span className="text-xs text-muted-foreground">
                    R$ {plano.valor.toFixed(2).replace(".", ",")}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Regras de uso
            </p>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3 transition-colors hover:bg-secondary/60">
              <input type="checkbox" className="mt-0.5" {...register("umaVezPorCliente")} />
              <div>
                <p className="text-sm font-medium">Utilizar uma única vez por cliente</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cada cliente poderá resgatar este voucher somente uma vez.
                </p>
              </div>
            </label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Aplicar no valor de</span>
              <HoverPopover content="Define se incide sobre o contrato, a anuidade, ou ambos.">
                <Info className="size-4 text-muted-foreground" />
              </HoverPopover>
            </div>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: "CONTRATO" as VoucherAplicarEm, label: "Contrato", desc: "Aplica no valor do plano/mensalidade." },
                  { value: "ANUIDADE" as VoucherAplicarEm, label: "Anuidade", desc: "Aplica no valor anual do plano." },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/50 bg-secondary/60 px-3 py-2.5 transition-colors hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    checked={aplicarEm.includes(option.value)}
                    onChange={() => toggleAplicarEm(option.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{option.label}</p>
                    <p className="text-xs text-muted-foreground">{option.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando…" : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
