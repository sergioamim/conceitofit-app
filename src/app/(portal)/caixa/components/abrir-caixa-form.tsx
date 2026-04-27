"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { abrirCaixa, getCaixaAtivo, listCaixaCatalogos } from "@/lib/api/caixa";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";

import {
  AbrirCaixaSchema,
  type AbrirCaixaFormData,
} from "../lib/caixa-schemas";
import type { CaixaAtivo } from "./caixa-content";
import type { CaixaCatalogoResponse } from "@/lib/api/caixa.types";

interface AbrirCaixaFormProps {
  onSuccess: (ativo: CaixaAtivo) => void;
  onCaixaJaAberto: () => void;
}

/**
 * Formulário "Abrir caixa" — integra `react-hook-form` + `zodResolver`.
 *
 * O operador escolhe o catálogo de caixa já configurado no tenant.
 * UUID manual não é mais exposto na UI.
 */
export function AbrirCaixaForm({
  onSuccess,
  onCaixaJaAberto,
}: AbrirCaixaFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [catalogos, setCatalogos] = useState<CaixaCatalogoResponse[]>([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const form = useForm<AbrirCaixaFormData>({
    resolver: zodResolver(AbrirCaixaSchema),
    defaultValues: {
      caixaCatalogoId: "",
      valorAbertura: 0,
      observacoes: "",
    },
    mode: "onTouched",
  });

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  useEffect(() => {
    let active = true;
    setLoadingCatalogos(true);
    void listCaixaCatalogos()
      .then((items) => {
        if (!active) return;
        setCatalogos(items);
        if (items.length === 1) {
          setValue("caixaCatalogoId", items[0].id, { shouldValidate: true });
        }
      })
      .catch((err) => {
        if (!active) return;
        toast({
          variant: "destructive",
          title: "Não foi possível carregar os caixas",
          description:
            err instanceof Error ? err.message : "Tente novamente em instantes.",
        });
      })
      .finally(() => {
        if (active) setLoadingCatalogos(false);
      });

    return () => {
      active = false;
    };
  }, [setValue, toast]);

  const watchedCaixaCatalogoId = watch("caixaCatalogoId");
  const canSave = Boolean(watchedCaixaCatalogoId?.trim()) && !loadingCatalogos;

  async function onSubmit(data: AbrirCaixaFormData): Promise<void> {
    setSubmitting(true);
    try {
      const caixa = await abrirCaixa({
        caixaCatalogoId: data.caixaCatalogoId,
        valorAbertura: data.valorAbertura,
        observacoes: data.observacoes?.trim() ? data.observacoes.trim() : null,
      });
      // Após POST /abrir, chamamos GET /ativo para juntar saldo inicial.
      const ativo = await getCaixaAtivo();
      if (ativo) {
        onSuccess(ativo);
        return;
      }
      // Fallback: se /ativo não devolver (estado de corrida), monta saldo zero.
      onSuccess({
        caixa,
        saldo: {
          caixaId: caixa.id,
          total: caixa.valorAbertura,
          porFormaPagamento: { DINHEIRO: caixa.valorAbertura },
          movimentosCount: 0,
        },
      });
    } catch (err) {
      if (isCaixaApiError(err)) {
        const mapped = mapCaixaError(err);
        if (err.code === "CAIXA_JA_ABERTO") {
          toast({
            variant: "destructive",
            title: mapped.titulo,
            description: `${mapped.mensagem} — Ver caixa ativo`,
          });
          onCaixaJaAberto();
          return;
        }
        toast({
          variant: "destructive",
          title: mapped.titulo,
          description: mapped.mensagem,
        });
        return;
      }
      toast({
        variant: "destructive",
        title: "Falha ao abrir caixa",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-labelledby="abrir-caixa-title"
    >
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Wallet className="size-5" />
        </div>
        <div>
          <h2 id="abrir-caixa-title" className="text-lg font-semibold">
            Abrir caixa
          </h2>
          <p className="text-xs text-muted-foreground">
            Selecione o caixa configurado e informe o valor inicial do fundo de troco.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="caixaCatalogoId">
            Caixa <span className="text-gym-danger">*</span>
          </Label>
          <Controller
            control={control}
            name="caixaCatalogoId"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={loadingCatalogos || catalogos.length === 0}
              >
                <SelectTrigger
                  id="caixaCatalogoId"
                  className="w-full"
                  aria-invalid={Boolean(errors.caixaCatalogoId)}
                  aria-label="Caixa"
                >
                  <SelectValue
                    placeholder={
                      loadingCatalogos
                        ? "Carregando caixas..."
                        : catalogos.length === 0
                          ? "Nenhum caixa configurado"
                          : "Selecione o caixa"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {catalogos.map((catalogo) => (
                    <SelectItem key={catalogo.id} value={catalogo.id}>
                      {catalogo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.caixaCatalogoId ? (
            <p className="text-xs text-gym-danger">
              {errors.caixaCatalogoId.message}
            </p>
          ) : loadingCatalogos ? (
            <p className="text-xs text-muted-foreground">
              Carregando os caixas disponíveis para esta unidade...
            </p>
          ) : catalogos.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Nenhum caixa configurado para esta unidade.{" "}
              <Link
                href="/admin/caixas"
                className="underline"
              >
                Ver configurações
              </Link>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              O caixa selecionado identifica o PDV operacional que será aberto.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="valorAbertura">
            Valor de abertura (R$) <span className="text-gym-danger">*</span>
          </Label>
          <Input
            id="valorAbertura"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            aria-invalid={Boolean(errors.valorAbertura)}
            {...register("valorAbertura")}
          />
          {errors.valorAbertura ? (
            <p className="text-xs text-gym-danger">
              {errors.valorAbertura.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Input
          id="observacoes"
          placeholder="Ex.: abertura manhã — fundo de R$ 100 conferido"
          aria-invalid={Boolean(errors.observacoes)}
          {...register("observacoes")}
        />
        {errors.observacoes ? (
          <p className="text-xs text-gym-danger">{errors.observacoes.message}</p>
        ) : null}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={submitting || !canSave}>
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Abrindo…
            </>
          ) : (
            "Abrir caixa"
          )}
        </Button>
      </div>
    </form>
  );
}
