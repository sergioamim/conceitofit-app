"use client";

import { useEffect, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Convenio, Plano } from "@/lib/types";
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
import { cn } from "@/lib/utils";

type EscopoPlanos = "TODOS" | "ESPECIFICOS";

type ConvenioFormValues = {
  nome: string;
  descontoPercentual: string;
  ativo: boolean;
  escopoPlanos: EscopoPlanos;
  planoIds: string[];
  observacoes: string;
};

function toFormValues(initial?: Convenio | null): ConvenioFormValues {
  if (!initial) {
    return {
      nome: "",
      descontoPercentual: "0",
      ativo: true,
      escopoPlanos: "TODOS",
      planoIds: [],
      observacoes: "",
    };
  }
  const temPlanos = Boolean(initial.planoIds && initial.planoIds.length > 0);
  return {
    nome: initial.nome,
    descontoPercentual: String(initial.descontoPercentual ?? 0),
    ativo: initial.ativo,
    escopoPlanos: temPlanos ? "ESPECIFICOS" : "TODOS",
    planoIds: initial.planoIds ?? [],
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
  onSave: (data: Omit<Convenio, "id">, id?: string) => void;
  planos: Plano[];
  initial?: Convenio | null;
}) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
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
  const descontoWatch = watch("descontoPercentual");
  const escopoWatch = watch("escopoPlanos");
  const ativoWatch = watch("ativo");
  const planoIdsWatch = watch("planoIds") ?? [];

  const descontoNumero = Number.parseFloat(descontoWatch ?? "0");
  const descontoValido =
    Number.isFinite(descontoNumero) && descontoNumero >= 0 && descontoNumero <= 100;

  const canSave =
    Boolean(nomeWatch?.trim()) &&
    descontoValido &&
    (escopoWatch === "TODOS" || planoIdsWatch.length > 0);

  const precoExemplo = 150;
  const descontoExemplo = (precoExemplo * (Number.isFinite(descontoNumero) ? descontoNumero : 0)) / 100;
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

  function handleSave(values: ConvenioFormValues) {
    const nome = values.nome.trim();
    if (!nome) return;
    const desconto = Number.parseFloat(values.descontoPercentual) || 0;
    onSave(
      {
        nome,
        ativo: values.ativo,
        descontoPercentual: desconto,
        planoIds:
          values.escopoPlanos === "ESPECIFICOS" && values.planoIds.length > 0
            ? values.planoIds
            : undefined,
        observacoes: values.observacoes.trim() || undefined,
      },
      initial?.id
    );
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
            Defina nome, desconto aplicado e quais planos participam.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-6">
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

            <div className="space-y-1.5">
              <Label htmlFor="convenio-desconto">
                Desconto <span className="text-gym-danger">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="convenio-desconto"
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  aria-invalid={!descontoValido ? "true" : "false"}
                  {...register("descontoPercentual")}
                  className="border-border bg-secondary pr-8"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  %
                </span>
              </div>
              {!descontoValido ? (
                <p className="text-xs text-gym-danger">
                  O desconto deve estar entre 0 e 100%.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Exemplo: plano de {formatBRL(precoExemplo)} →{" "}
                  <span className="font-semibold text-foreground">
                    {formatBRL(precoFinal)}
                  </span>{" "}
                  ({formatBRL(descontoExemplo)} de desconto)
                </p>
              )}
            </div>

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
                        : "border-border hover:bg-secondary/60"
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
                        : "border-border hover:bg-secondary/60"
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

            {escopoWatch === "ESPECIFICOS" ? (
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
                                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
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

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="border-border">
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSave}>
              {initial ? "Salvar" : "Criar convênio"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
