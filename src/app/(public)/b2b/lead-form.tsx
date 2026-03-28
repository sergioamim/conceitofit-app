"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";
import {
  leadB2bFormSchema,
  type LeadB2bFormValues,
} from "@/lib/public/lead-b2b-schema";
import { submitLeadB2b } from "@/lib/public/lead-b2b-api";

function extractUtmParams(): Pick<LeadB2bFormValues, "utmSource" | "utmMedium" | "utmCampaign"> {
  if (typeof window === "undefined") return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

export function LeadB2bForm() {
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadB2bFormValues>({
    resolver: zodResolver<LeadB2bFormValues>(leadB2bFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      nomeAcademia: "",
      quantidadeAlunos: undefined,
      origem: "LANDING_PAGE",
    },
  });

  async function onSubmit(values: LeadB2bFormValues) {
    setApiError(null);
    try {
      const utm = extractUtmParams();
      await submitLeadB2b({ ...values, ...utm });
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gym-teal/30 bg-gym-teal/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-gym-teal" />
        <h3 className="font-display text-xl font-bold">Recebemos seu contato!</h3>
        <p className="text-sm text-muted-foreground">
          Nosso time entrara em contato em breve para agendar sua demonstracao.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto w-full max-w-lg space-y-4 rounded-2xl border border-border/60 bg-card p-6 text-left sm:p-8"
    >
      <div className="text-center">
        <h3 className="font-display text-lg font-bold">Agendar demonstracao</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha seus dados e entraremos em contato.
        </p>
      </div>

      {apiError && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/5 px-4 py-3 text-sm text-gym-danger">
          {apiError}
        </div>
      )}

      {/* Nome */}
      <div>
        <label htmlFor="lead-nome" className="mb-1 block text-sm font-medium">
          Nome *
        </label>
        <input
          id="lead-nome"
          type="text"
          autoComplete="name"
          {...register("nome")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Seu nome completo"
        />
        {errors.nome && (
          <p className="mt-1 text-xs text-gym-danger">{errors.nome.message}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="lead-email" className="mb-1 block text-sm font-medium">
          E-mail *
        </label>
        <input
          id="lead-email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="voce@academia.com.br"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-gym-danger">{errors.email.message}</p>
        )}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="lead-telefone" className="mb-1 block text-sm font-medium">
          Telefone / WhatsApp *
        </label>
        <input
          id="lead-telefone"
          type="tel"
          autoComplete="tel"
          {...register("telefone")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="(11) 99999-0000"
        />
        {errors.telefone && (
          <p className="mt-1 text-xs text-gym-danger">{errors.telefone.message}</p>
        )}
      </div>

      {/* Nome da Academia */}
      <div>
        <label htmlFor="lead-academia" className="mb-1 block text-sm font-medium">
          Nome da academia
        </label>
        <input
          id="lead-academia"
          type="text"
          {...register("nomeAcademia")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Ex: Academia Power Gym"
        />
      </div>

      {/* Quantidade de alunos */}
      <div>
        <label htmlFor="lead-alunos" className="mb-1 block text-sm font-medium">
          Quantidade de alunos (aproximada)
        </label>
        <input
          id="lead-alunos"
          type="number"
          inputMode="numeric"
          min={0}
          {...register("quantidadeAlunos")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Ex: 200"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gym-accent font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enviando...
          </>
        ) : (
          "Agendar demonstracao"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Sem compromisso. Seus dados estao protegidos conforme nossa politica de privacidade.
      </p>
    </form>
  );
}
