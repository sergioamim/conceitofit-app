"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import type {
  Convenio,
  Plano,
  TipoDescontoConvenio,
  TipoFormaPagamento,
} from "@/lib/types";
import { convenioFormSchema } from "@/lib/tenant/forms/administrativo-schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBRL } from "@/lib/formatters";
import { applyApiFieldErrors, buildFormApiErrorMessage } from "@/lib/forms/api-form-errors";
import { cn } from "@/lib/utils";

type EscopoPlanos = "TODOS" | "ESPECIFICOS";
type EscopoPagamento = "TODAS" | "ESPECIFICAS";

type EscopoVigencia = "SEM_LIMITE" | "INTERVALO";

type ConvenioFormValues = {
  nome: string;
  tipoDesconto: TipoDescontoConvenio;
  descontoPercentual: string;
  descontoValor: string;
  ativo: boolean;
  permiteVoucherAcumulado: boolean;
  escopoPlanos: EscopoPlanos;
  planoIds: string[];
  escopoPagamento: EscopoPagamento;
  formasPagamentoPermitidas: string[];
  escopoVigencia: EscopoVigencia;
  validoDe: string;
  validoAte: string;
  observacoes: string;
};

const FORMAS_PAGAMENTO: Array<{ value: TipoFormaPagamento; label: string }> = [
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "PIX", label: "PIX" },
  { value: "CARTAO_CREDITO", label: "Cartão de crédito" },
  { value: "CARTAO_DEBITO", label: "Cartão de débito" },
  { value: "BOLETO", label: "Boleto" },
  { value: "RECORRENTE", label: "Recorrente" },
];

function toFormValues(initial?: Convenio | null): ConvenioFormValues {
  if (!initial) {
    return {
      nome: "",
      tipoDesconto: "PERCENTUAL",
      descontoPercentual: "0",
      descontoValor: "",
      ativo: true,
      permiteVoucherAcumulado: true,
      escopoPlanos: "TODOS",
      planoIds: [],
      escopoPagamento: "TODAS",
      formasPagamentoPermitidas: [],
      escopoVigencia: "SEM_LIMITE",
      validoDe: "",
      validoAte: "",
      observacoes: "",
    };
  }
  const temPlanos = Boolean(initial.planoIds && initial.planoIds.length > 0);
  const temFormas = Boolean(
    initial.formasPagamentoPermitidas && initial.formasPagamentoPermitidas.length > 0,
  );
  const temVigencia = Boolean(initial.validoDe || initial.validoAte);
  return {
    nome: initial.nome,
    tipoDesconto: initial.tipoDesconto ?? "PERCENTUAL",
    descontoPercentual: String(initial.descontoPercentual ?? 0),
    descontoValor: initial.descontoValor != null ? String(initial.descontoValor) : "",
    ativo: initial.ativo,
    permiteVoucherAcumulado: initial.permiteVoucherAcumulado ?? true,
    escopoPlanos: temPlanos ? "ESPECIFICOS" : "TODOS",
    planoIds: initial.planoIds ?? [],
    escopoPagamento: temFormas ? "ESPECIFICAS" : "TODAS",
    formasPagamentoPermitidas: (initial.formasPagamentoPermitidas ?? []) as string[],
    escopoVigencia: temVigencia ? "INTERVALO" : "SEM_LIMITE",
    validoDe: initial.validoDe ?? "",
    validoAte: initial.validoAte ?? "",
    observacoes: initial.observacoes ?? "",
  };
}

export function ConvenioModal({
  open,
  onClose,
  onSave,
  planos,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Convenio, "id">, id?: string) => Promise<void> | void;
  planos: Plano[];
  initial?: Convenio | null;
}) {
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<ConvenioFormValues>({
    resolver: zodResolver(convenioFormSchema),
    mode: "onTouched",
    defaultValues: toFormValues(initial),
  });

  useEffect(() => {
    reset(toFormValues(initial));
  }, [initial, open, reset]);

  const planosAtivos = useMemo(() => planos.filter((p) => p.ativo), [planos]);

  const nomeWatch = watch("nome");
  const tipoDescontoWatch = watch("tipoDesconto");
  const descontoPercentualWatch = watch("descontoPercentual");
  const descontoValorWatch = watch("descontoValor");
  const escopoPlanosWatch = watch("escopoPlanos");
  const escopoPagamentoWatch = watch("escopoPagamento");
  const escopoVigenciaWatch = watch("escopoVigencia");
  const validoDeWatch = watch("validoDe");
  const validoAteWatch = watch("validoAte");
  const ativoWatch = watch("ativo");
  const planoIdsWatch = watch("planoIds") ?? [];
  const formasPermitidasWatch = watch("formasPagamentoPermitidas") ?? [];

  const descontoPercentualNum = Number.parseFloat(descontoPercentualWatch ?? "0");
  const descontoValorNum = Number.parseFloat(descontoValorWatch ?? "0");

  const descontoPercentualValido =
    Number.isFinite(descontoPercentualNum) &&
    descontoPercentualNum >= 0 &&
    descontoPercentualNum <= 100;

  const descontoValorValido = Number.isFinite(descontoValorNum) && descontoValorNum > 0;

  const descontoValido =
    tipoDescontoWatch === "PERCENTUAL" ? descontoPercentualValido : descontoValorValido;

  // Validação de vigência: quando INTERVALO, exige ao menos uma ponta.
  // Se ambas preenchidas, validoDe <= validoAte.
  const vigenciaValida =
    escopoVigenciaWatch === "SEM_LIMITE" ||
    (() => {
      const de = validoDeWatch?.trim();
      const ate = validoAteWatch?.trim();
      if (!de && !ate) return false;
      if (de && ate && de > ate) return false;
      return true;
    })();

  const canSave =
    Boolean(nomeWatch?.trim()) &&
    descontoValido &&
    (escopoPlanosWatch === "TODOS" || planoIdsWatch.length > 0) &&
    (escopoPagamentoWatch === "TODAS" || formasPermitidasWatch.length > 0) &&
    vigenciaValida;

  // Preview
  const precoExemplo = 150;
  const descontoExemploPercent = (precoExemplo * (Number.isFinite(descontoPercentualNum) ? descontoPercentualNum : 0)) / 100;
  const descontoExemploFixo = Math.min(
    Number.isFinite(descontoValorNum) && descontoValorNum > 0 ? descontoValorNum : 0,
    precoExemplo,
  );
  const descontoExemplo = tipoDescontoWatch === "PERCENTUAL" ? descontoExemploPercent : descontoExemploFixo;
  const precoFinal = Math.max(0, precoExemplo - descontoExemplo);

  function togglePlano(id: string) {
    const atual = planoIdsWatch;
    const proximo = atual.includes(id) ? atual.filter((x) => x !== id) : [...atual, id];
    setValue("planoIds", proximo, { shouldDirty: true, shouldValidate: true });
  }

  function toggleTodosAtivos() {
    const todosIds = planosAtivos.map((p) => p.id);
    const todosSelecionados = todosIds.every((id) => planoIdsWatch.includes(id));
    setValue("planoIds", todosSelecionados ? [] : todosIds, { shouldDirty: true, shouldValidate: true });
  }

  function toggleFormaPagamento(forma: TipoFormaPagamento) {
    const atual = formasPermitidasWatch;
    const proximo = atual.includes(forma) ? atual.filter((x) => x !== forma) : [...atual, forma];
    setValue("formasPagamentoPermitidas", proximo, { shouldDirty: true, shouldValidate: true });
  }

  async function handleSave(values: ConvenioFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;

    const isPercentual = values.tipoDesconto === "PERCENTUAL";
    const desconto = Number.parseFloat(values.descontoPercentual) || 0;
    const valorFixo = Number.parseFloat(values.descontoValor) || 0;

    try {
      setSaving(true);
      setSubmitError(null);
      await onSave(
        {
          nome,
          ativo: values.ativo,
          permiteVoucherAcumulado: values.permiteVoucherAcumulado,
          tipoDesconto: values.tipoDesconto,
          descontoPercentual: isPercentual ? desconto : 0,
          descontoValor: isPercentual ? undefined : valorFixo,
          planoIds:
            values.escopoPlanos === "ESPECIFICOS" && values.planoIds.length > 0
              ? values.planoIds
              : undefined,
          formasPagamentoPermitidas:
            values.escopoPagamento === "ESPECIFICAS" && values.formasPagamentoPermitidas.length > 0
              ? (values.formasPagamentoPermitidas as TipoFormaPagamento[])
              : undefined,
          validoDe:
            values.escopoVigencia === "INTERVALO" && values.validoDe.trim()
              ? values.validoDe
              : undefined,
          validoAte:
            values.escopoVigencia === "INTERVALO" && values.validoAte.trim()
              ? values.validoAte
              : undefined,
          observacoes: values.observacoes.trim() || undefined,
        },
        initial?.id,
      );
    } catch (error) {
      const { appliedFields, unmatchedFieldErrors, hasFieldErrors } = applyApiFieldErrors(error, setError);
      if (!hasFieldErrors || Object.keys(unmatchedFieldErrors).length > 0) {
        setSubmitError(buildFormApiErrorMessage(error, {
          appliedFields,
          fallbackMessage: "Revise os dados do convênio e tente novamente.",
        }));
      }
    } finally {
      setSaving(false);
    }
  }

  const todosAtivosSelecionados =
    planosAtivos.length > 0 && planosAtivos.every((p) => planoIdsWatch.includes(p.id));

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-border bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar convênio" : "Novo convênio"}
          </DialogTitle>
          <DialogDescription>
            Defina nome, desconto aplicado e restrições de plano e forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
          {submitError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </div>
          ) : null}
          {/* --------------------- Identificação --------------------- */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Identificação
            </h3>
            <div className="space-y-1.5">
              <Label htmlFor="convenio-nome">
                Nome <span className="text-gym-danger">*</span>
              </Label>
              <Input
                id="convenio-nome"
                autoFocus
                placeholder="Ex.: Empresa ABC, Unimed, GymPass"
                aria-invalid={errors.nome ? "true" : "false"}
                {...register("nome")}
                className="border-border bg-secondary"
              />
              {errors.nome ? (
                <p className="text-xs text-gym-danger">{errors.nome.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="convenio-observacoes">Observações</Label>
              <Textarea
                id="convenio-observacoes"
                placeholder="Notas internas sobre o convênio (não aparece ao cliente)"
                {...register("observacoes")}
                className="min-h-[70px] border-border bg-secondary"
              />
            </div>
          </section>

          {/* ------------------- Regra de desconto ------------------- */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Regra de desconto
            </h3>

            {/* Tipo de desconto */}
            <Controller
              control={control}
              name="tipoDesconto"
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de desconto">
                  {([
                    { value: "PERCENTUAL" as const, label: "Percentual", hint: "% sobre o valor do plano" },
                    { value: "VALOR_FIXO" as const, label: "Valor fixo", hint: "R$ abatido por venda" },
                  ]).map((opt) => (
                    <label
                      key={opt.value}
                      className={cn(
                        "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 transition-colors",
                        field.value === opt.value
                          ? "border-gym-accent bg-gym-accent/10"
                          : "border-border hover:bg-secondary/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="tipoDesconto"
                        value={opt.value}
                        checked={field.value === opt.value}
                        onChange={() => field.onChange(opt.value)}
                        className="mt-0.5 accent-gym-accent"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.hint}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            />

            {/* Campo de valor — muda conforme tipo */}
            {tipoDescontoWatch === "PERCENTUAL" ? (
              <div className="space-y-1.5">
                <Label htmlFor="convenio-desconto-percent">
                  Desconto <span className="text-gym-danger">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="convenio-desconto-percent"
                    type="number"
                    min={0}
                    max={100}
                    step="0.01"
                    aria-invalid={!descontoPercentualValido ? "true" : "false"}
                    {...register("descontoPercentual")}
                    className="border-border bg-secondary pr-8"
                  />
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
                {!descontoPercentualValido ? (
                  <p className="text-xs text-gym-danger">
                    O desconto deve estar entre 0 e 100%.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="convenio-desconto-valor">
                  Valor do desconto <span className="text-gym-danger">*</span>
                </Label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    R$
                  </span>
                  <Input
                    id="convenio-desconto-valor"
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="30,00"
                    aria-invalid={!descontoValorValido ? "true" : "false"}
                    {...register("descontoValor")}
                    className="border-border bg-secondary pl-9"
                  />
                </div>
                {!descontoValorValido ? (
                  <p className="text-xs text-gym-danger">
                    Informe um valor maior que zero.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Em planos com valor menor que {formatBRL(descontoValorNum)}, o desconto é limitado ao valor do plano.
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {descontoValido ? (
              <p className="text-xs text-muted-foreground">
                Exemplo: plano de {formatBRL(precoExemplo)} →{" "}
                <span className="font-semibold text-foreground">{formatBRL(precoFinal)}</span>{" "}
                ({formatBRL(descontoExemplo)} de desconto)
              </p>
            ) : null}

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
              <div>
                <Label htmlFor="convenio-ativo" className="cursor-pointer">
                  Disponível nas vendas
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando desativado, o convênio não aparece no checkout.
                </p>
              </div>
              <Controller
                control={control}
                name="ativo"
                render={({ field }) => (
                  <Switch
                    id="convenio-ativo"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
              <div>
                <Label htmlFor="convenio-acumula-voucher" className="cursor-pointer">
                  Acumula com voucher
                </Label>
                <p className="text-xs text-muted-foreground">
                  Quando desativado, se o cliente aplicar um voucher na venda,
                  o desconto deste convênio é ignorado (voucher vence).
                </p>
              </div>
              <Controller
                control={control}
                name="permiteVoucherAcumulado"
                render={({ field }) => (
                  <Switch
                    id="convenio-acumula-voucher"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
            </div>

            {!ativoWatch ? (
              <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                Convênio salvo como inativo — não será oferecido em novas vendas.
              </p>
            ) : null}
          </section>

          {/* ------------------- Escopo de planos -------------------- */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Escopo de planos
            </h3>

            <Controller
              control={control}
              name="escopoPlanos"
              render={({ field }) => (
                <div className="grid gap-2" role="radiogroup" aria-label="Escopo de planos">
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "TODOS"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoPlanos"
                      value="TODOS"
                      checked={field.value === "TODOS"}
                      onChange={() => field.onChange("TODOS")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Todos os planos ativos</p>
                      <p className="text-xs text-muted-foreground">
                        O desconto vale para qualquer plano ativo hoje e futuros.
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "ESPECIFICOS"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoPlanos"
                      value="ESPECIFICOS"
                      checked={field.value === "ESPECIFICOS"}
                      onChange={() => field.onChange("ESPECIFICOS")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Planos específicos</p>
                      <p className="text-xs text-muted-foreground">
                        Escolha quais planos ativos participam do convênio.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            />

            {escopoPlanosWatch === "ESPECIFICOS" ? (
              <div className="space-y-2">
                {planosAtivos.length === 0 ? (
                  <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
                    Nenhum plano ativo cadastrado. Cadastre/ative um plano antes de restringir o escopo.
                  </p>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {planoIdsWatch.length} de {planosAtivos.length} selecionado{planosAtivos.length === 1 ? "" : "s"}
                      </span>
                      <button
                        type="button"
                        onClick={toggleTodosAtivos}
                        className="text-xs font-medium text-gym-accent hover:underline"
                      >
                        {todosAtivosSelecionados ? "Desmarcar todos" : "Selecionar todos ativos"}
                      </button>
                    </div>
                    <div className="grid max-h-56 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-2 sm:grid-cols-2">
                      {planosAtivos.map((plano) => {
                        const selecionado = planoIdsWatch.includes(plano.id);
                        return (
                          <button
                            key={plano.id}
                            type="button"
                            onClick={() => togglePlano(plano.id)}
                            aria-pressed={selecionado}
                            className={cn(
                              "flex items-center justify-between rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                              selecionado
                                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                            )}
                          >
                            <span className="truncate font-medium">{plano.nome}</span>
                            <span className="ml-2 shrink-0 text-[10px] opacity-80">
                              {formatBRL(plano.valor)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {planoIdsWatch.length === 0 ? (
                      <p className="text-xs text-gym-danger">
                        Selecione ao menos um plano ou troque para &quot;Todos os planos&quot;.
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            ) : null}
          </section>

          {/* --------------- Formas de pagamento permitidas --------------- */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Formas de pagamento permitidas
            </h3>

            <Controller
              control={control}
              name="escopoPagamento"
              render={({ field }) => (
                <div className="grid gap-2" role="radiogroup" aria-label="Escopo de formas de pagamento">
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "TODAS"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoPagamento"
                      value="TODAS"
                      checked={field.value === "TODAS"}
                      onChange={() => field.onChange("TODAS")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Todas as formas</p>
                      <p className="text-xs text-muted-foreground">
                        O desconto vale independentemente da forma escolhida no checkout.
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "ESPECIFICAS"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoPagamento"
                      value="ESPECIFICAS"
                      checked={field.value === "ESPECIFICAS"}
                      onChange={() => field.onChange("ESPECIFICAS")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Restringir a formas específicas</p>
                      <p className="text-xs text-muted-foreground">
                        O desconto só é aplicado se a venda usar uma das formas marcadas.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            />

            {escopoPagamentoWatch === "ESPECIFICAS" ? (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {formasPermitidasWatch.length} de {FORMAS_PAGAMENTO.length} selecionadas
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {FORMAS_PAGAMENTO.map((forma) => {
                    const selecionada = formasPermitidasWatch.includes(forma.value);
                    return (
                      <button
                        key={forma.value}
                        type="button"
                        onClick={() => toggleFormaPagamento(forma.value)}
                        aria-pressed={selecionada}
                        className={cn(
                          "rounded-md border px-2.5 py-2 text-left text-xs transition-colors",
                          selecionada
                            ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                            : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",
                        )}
                      >
                        <span className="font-medium">{forma.label}</span>
                      </button>
                    );
                  })}
                </div>
                {formasPermitidasWatch.length === 0 ? (
                  <p className="text-xs text-gym-danger">
                    Selecione ao menos uma forma ou troque para &quot;Todas as formas&quot;.
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>

          {/* ----------------------- Vigência ----------------------- */}
          <section className="space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vigência
            </h3>

            <Controller
              control={control}
              name="escopoVigencia"
              render={({ field }) => (
                <div className="grid gap-2" role="radiogroup" aria-label="Vigência do convênio">
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "SEM_LIMITE"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoVigencia"
                      value="SEM_LIMITE"
                      checked={field.value === "SEM_LIMITE"}
                      onChange={() => field.onChange("SEM_LIMITE")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Sem limite de tempo</p>
                      <p className="text-xs text-muted-foreground">
                        O convênio vale enquanto estiver ativo.
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                      field.value === "INTERVALO"
                        ? "border-gym-accent bg-gym-accent/10"
                        : "border-border hover:bg-secondary/60",
                    )}
                  >
                    <input
                      type="radio"
                      name="escopoVigencia"
                      value="INTERVALO"
                      checked={field.value === "INTERVALO"}
                      onChange={() => field.onChange("INTERVALO")}
                      className="mt-0.5 accent-gym-accent"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Intervalo de datas</p>
                      <p className="text-xs text-muted-foreground">
                        Útil para campanhas e convênios renovados anualmente.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            />

            {escopoVigenciaWatch === "INTERVALO" ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="convenio-valido-de">Válido de</Label>
                  <Input
                    id="convenio-valido-de"
                    type="date"
                    {...register("validoDe")}
                    className="border-border bg-secondary"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="convenio-valido-ate">Válido até</Label>
                  <Input
                    id="convenio-valido-ate"
                    type="date"
                    {...register("validoAte")}
                    className="border-border bg-secondary"
                  />
                </div>
                {!vigenciaValida ? (
                  <p className="col-span-2 text-xs text-gym-danger">
                    {validoDeWatch?.trim() && validoAteWatch?.trim() && validoDeWatch > validoAteWatch
                      ? "Data inicial precisa ser anterior ou igual à final."
                      : "Preencha ao menos uma das datas ou troque para \"Sem limite\"."}
                  </p>
                ) : (
                  <p className="col-span-2 text-xs text-muted-foreground">
                    {validoDeWatch && validoAteWatch
                      ? "Convênio vale apenas dentro do intervalo."
                      : validoDeWatch
                      ? "Sem data fim — válido indefinidamente a partir da data inicial."
                      : "Sem data início — válido até a data final informada."}
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave || saving}>
              {saving ? "Salvando..." : initial ? "Salvar" : "Criar convênio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
