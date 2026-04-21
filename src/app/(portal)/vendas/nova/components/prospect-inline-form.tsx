"use client";

import { useEffect, useState } from "react";
import { Controller, useForm, type Path } from "react-hook-form";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/shared/phone-input";
import { useToast } from "@/components/ui/use-toast";
import { createProspectApi } from "@/lib/api/crm";
import { formatCpf } from "@/lib/formatters";
import type { Prospect } from "@/lib/types";

import {
  prospectInlineFormSchema,
  type ProspectInlineFormValues,
} from "./prospect-inline-form.schema";

/**
 * Mini-form inline para criação rápida de Prospect a partir da busca
 * universal do cockpit de venda (VUN-2.4 — RN-014).
 *
 * Fluxo:
 * - Disparado quando usuário digita CPF válido (11 dígitos + DV) e nenhum
 *   cliente é retornado.
 * - Campos mínimos: nome, telefone (exigido pelo backend) e CPF readonly.
 * - Submit chama `POST /api/v1/academia/prospects` via `createProspectApi`.
 * - Origem default `VISITA_PRESENCIAL` (atendente na recepção).
 *
 * Deviação da story: backend exige `telefone` no payload
 * `ProspectUpsertApiRequest`, então o form pede também telefone (mitigação
 * prevista no quadro de riscos).
 */
export interface ProspectInlineFormProps {
  /** CPF pré-preenchido (pode conter máscara ou apenas dígitos). */
  cpf: string;
  /** Tenant atual — obrigatório para a chamada ao backend. */
  tenantId: string;
  /** Callback disparado após criação bem-sucedida. */
  onCreated: (prospect: Prospect) => void;
  /** Cancelar/fechar o form sem criar. */
  onCancel: () => void;
}

export function ProspectInlineForm({
  cpf,
  tenantId,
  onCreated,
  onCancel,
}: ProspectInlineFormProps) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<ProspectInlineFormValues>({
    defaultValues: {
      nome: "",
      telefone: "",
      cpf,
      observacoes: "",
    },
    mode: "onSubmit",
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = form;

  // Mantém o CPF do form alinhado caso a prop mude entre renderizações
  useEffect(() => {
    reset((prev) => ({ ...prev, cpf }));
  }, [cpf, reset]);

  /**
   * Validação manual com `parse` síncrono. Evita dependência na compat entre
   * `@hookform/resolvers/zod@3.x` (checa `error.errors`) e Zod 4
   * (que expõe `error.issues`). Populamos `react-hook-form` via `setError`.
   */
  async function onSubmit(rawValues: ProspectInlineFormValues): Promise<void> {
    clearErrors();
    const parsed = prospectInlineFormSchema.safeParse(rawValues);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path.join(".") as Path<ProspectInlineFormValues>;
        if (field) {
          setError(field, { type: issue.code, message: issue.message });
        }
      }
      return;
    }
    const values = parsed.data;
    setSubmitting(true);
    try {
      const prospect = await createProspectApi({
        tenantId,
        data: {
          nome: values.nome,
          telefone: values.telefone,
          cpf: values.cpf,
          origem: "VISITA_PRESENCIAL",
          observacoes: values.observacoes || undefined,
        },
      });
      toast({
        title: "Prospect criado",
        description: `${prospect.nome} adicionado com sucesso.`,
      });
      onCreated(prospect);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha ao criar prospect",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      aria-label="Criar prospect inline"
      data-testid="prospect-inline-form"
    >
      <header className="space-y-1">
        <h3 className="font-display text-sm font-semibold text-foreground">
          Cadastro rápido de prospect
        </h3>
        <p className="text-xs text-muted-foreground">
          Informe nome e telefone — o CPF já foi capturado pela busca.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="prospect-inline-nome">Nome completo *</Label>
          <Input
            id="prospect-inline-nome"
            placeholder="Nome do cliente"
            autoFocus
            aria-invalid={Boolean(errors.nome)}
            aria-required
            {...register("nome")}
          />
          {errors.nome ? (
            <p className="text-xs text-gym-danger" role="alert">
              {errors.nome.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prospect-inline-telefone">Telefone *</Label>
          <Controller
            control={control}
            name="telefone"
            render={({ field }) => (
              <PhoneInput
                id="prospect-inline-telefone"
                placeholder="(11) 99999-0000"
                value={field.value}
                onChange={field.onChange}
                aria-invalid={Boolean(errors.telefone)}
                aria-required
              />
            )}
          />
          {errors.telefone ? (
            <p className="text-xs text-gym-danger" role="alert">
              {errors.telefone.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="prospect-inline-cpf">CPF</Label>
        <Input
          id="prospect-inline-cpf"
          value={formatCpf(cpf)}
          readOnly
          aria-readonly
          className="bg-muted/60 cursor-not-allowed"
          data-testid="prospect-inline-cpf"
        />
        {errors.cpf ? (
          <p className="text-xs text-gym-danger" role="alert">
            {errors.cpf.message}
          </p>
        ) : null}
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          data-testid="prospect-inline-submit"
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
              Criando...
            </>
          ) : (
            "Criar prospect"
          )}
        </Button>
      </div>
    </form>
  );
}
