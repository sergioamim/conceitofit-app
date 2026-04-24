"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Loader2, Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { abrirCaixa, getCaixaAtivo } from "@/lib/api/caixa";
import {
  isCaixaApiError,
  mapCaixaError,
} from "@/lib/api/caixa-error-handler";

import {
  AbrirCaixaSchema,
  type AbrirCaixaFormData,
} from "../lib/caixa-schemas";
import type { CaixaAtivo } from "./caixa-content";

interface AbrirCaixaFormProps {
  onSuccess: (ativo: CaixaAtivo) => void;
  onCaixaJaAberto: () => void;
}

/**
 * Formulário "Abrir caixa" — integra `react-hook-form` + `zodResolver`.
 *
 * Nota sobre `caixaCatalogoId`: um endpoint de listagem dos catálogos de
 * caixa (`GET /api/caixas/catalogo`) ainda não foi mapeado no FE (CXO-105
 * só entrega os verbos de caixa). Mantemos input de UUID manual e
 * placeholder com instrução — assim que a integração existir, basta trocar
 * o `Input` por um `Select`.
 */
export function AbrirCaixaForm({
  onSuccess,
  onCaixaJaAberto,
}: AbrirCaixaFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

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
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = form;

  // Manual watch do required: caixaCatalogoId (UUID). valorAbertura aceita 0.
  const watchedCaixaCatalogoId = watch("caixaCatalogoId");
  const canSave = Boolean(watchedCaixaCatalogoId?.trim());

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
            Informe o catálogo e o valor inicial do fundo de troco.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="caixaCatalogoId">
            Caixa do catálogo (UUID) <span className="text-gym-danger">*</span>
          </Label>
          <Input
            id="caixaCatalogoId"
            placeholder="ex.: 123e4567-e89b-12d3-a456-426614174000"
            aria-invalid={Boolean(errors.caixaCatalogoId)}
            {...register("caixaCatalogoId")}
          />
          {errors.caixaCatalogoId ? (
            <p className="text-xs text-gym-danger">
              {errors.caixaCatalogoId.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Endpoint de listagem em progresso — peça o UUID ao gerente.{" "}
              <Link
                href="/administrativo/formas-pagamento"
                className="underline"
              >
                Ver configurações
              </Link>
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
