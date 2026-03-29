"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2 } from "lucide-react";

const experimentalSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome."),
  telefone: z.string().trim().min(10, "Informe um telefone valido."),
  email: z.string().trim().email("Informe um e-mail valido.").optional().or(z.literal("")),
  horarioPreferido: z.string().optional(),
  mensagem: z.string().optional(),
});

type ExperimentalFormValues = z.infer<typeof experimentalSchema>;

async function submitExperimental(tenantId: string, data: ExperimentalFormValues) {
  const baseUrl =
    (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL : undefined) ?? "";
  const url = baseUrl
    ? `${baseUrl}/api/v1/publico/storefront/experimental`
    : "/backend/api/v1/publico/storefront/experimental";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ ...data, tenantId }),
  });

  if (!res.ok) {
    let message = `Erro ao enviar (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch { /* ignore JSON parse error — already have fallback message */ }
    throw new Error(message);
  }

  return res.json();
}

export function ExperimentalForm({ tenantId }: { tenantId: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ExperimentalFormValues>({
    resolver: zodResolver<ExperimentalFormValues>(experimentalSchema),
    defaultValues: {
      nome: "",
      telefone: "",
      email: "",
      horarioPreferido: "",
      mensagem: "",
    },
  });

  async function onSubmit(values: ExperimentalFormValues) {
    setApiError(null);
    try {
      await submitExperimental(tenantId, values);
      setSubmitted(true);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Erro inesperado. Tente novamente.");
    }
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gym-teal/30 bg-gym-teal/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-gym-teal" />
        <h3 className="font-display text-xl font-bold">Solicitacao recebida!</h3>
        <p className="text-sm text-muted-foreground">
          Entraremos em contato para agendar sua aula experimental. Ate breve!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
    >
      {apiError && (
        <div className="rounded-lg border border-gym-danger/30 bg-gym-danger/5 px-4 py-3 text-sm text-gym-danger">
          {apiError}
        </div>
      )}

      {/* Nome */}
      <div>
        <label htmlFor="exp-nome" className="mb-1 block text-sm font-medium">
          Nome *
        </label>
        <input
          id="exp-nome"
          type="text"
          autoComplete="name"
          {...register("nome")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Seu nome"
        />
        {errors.nome && <p className="mt-1 text-xs text-gym-danger">{errors.nome.message}</p>}
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="exp-telefone" className="mb-1 block text-sm font-medium">
          Telefone / WhatsApp *
        </label>
        <input
          id="exp-telefone"
          type="tel"
          autoComplete="tel"
          {...register("telefone")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="(11) 99999-0000"
        />
        {errors.telefone && <p className="mt-1 text-xs text-gym-danger">{errors.telefone.message}</p>}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="exp-email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="exp-email"
          type="email"
          autoComplete="email"
          {...register("email")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="seu@email.com"
        />
        {errors.email && <p className="mt-1 text-xs text-gym-danger">{errors.email.message}</p>}
      </div>

      {/* Horario preferido */}
      <div>
        <label htmlFor="exp-horario" className="mb-1 block text-sm font-medium">
          Horario preferido
        </label>
        <select
          id="exp-horario"
          {...register("horarioPreferido")}
          className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus:border-gym-accent"
        >
          <option value="">Sem preferencia</option>
          <option value="manha">Manha (6h - 12h)</option>
          <option value="tarde">Tarde (12h - 18h)</option>
          <option value="noite">Noite (18h - 22h)</option>
        </select>
      </div>

      {/* Mensagem */}
      <div>
        <label htmlFor="exp-mensagem" className="mb-1 block text-sm font-medium">
          Observacao (opcional)
        </label>
        <textarea
          id="exp-mensagem"
          rows={3}
          {...register("mensagem")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-gym-accent"
          placeholder="Ex: Tenho interesse em musculacao e funcional"
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
          "Agendar aula experimental"
        )}
      </button>

      <p className="text-center text-xs text-muted-foreground">
        Sem compromisso. Entraremos em contato para confirmar.
      </p>
    </form>
  );
}
