"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { usePublicTenants } from "@/lib/query/use-public-tenants";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import {
  buildPublicJourneyHref,
  submitPublicTrial,
} from "@/lib/public/services";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import { publicTrialFormSchema } from "@/lib/forms/public-journey-schemas";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

function PublicJourneyFallback() {
  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
  );
}

function TrialPageContent() {
  const router = useRouter();
  const { context, loading, error, resolvedTenantRef, persistDraft, draft, planId } = usePublicJourney();
  const { data: tenantOptions = [] } = usePublicTenants();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<import("zod").input<typeof publicTrialFormSchema>>({
    resolver: zodResolver(publicTrialFormSchema),
    defaultValues: {
      nome: "",
      email: "",
      telefone: "",
      objetivo: "",
    },
  });

  useEffect(() => {
    if (!success) return;
    reset({
      nome: "",
      email: "",
      telefone: "",
      objetivo: "",
    });
  }, [reset, success]);

  if (loading) {
    return (
      <SuspenseFallback variant="page" message="Carregando jornada pública..." />
    );
  }

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-xl border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">
            {error || "Não foi possível carregar o trial digital."}
          </CardContent>
        </Card>
      </div>
    );
  }

  async function onSubmit(values: import("zod").input<typeof publicTrialFormSchema>) {
    setSaving(true);
    try {
      const lead = await submitPublicTrial({
        tenantRef: resolvedTenantRef,
        ...values,
      });
      persistDraft({
        tenantRef: resolvedTenantRef,
        trialLeadId: lead.id,
        trialLeadNome: lead.nome,
      });
      setSuccess("Trial registrado. Um consultor vai assumir esse lead no CRM.");
    } catch (submitError) {
      setError("root", {
        type: "manual",
        message: submitError instanceof Error ? submitError.message : "Falha ao registrar o trial.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
      currentStep="PLANOS"
      title="Agende um trial antes de fechar"
      description="Capture o lead no CRM e leve o visitante para o plano certo sem sair da unidade pública."
      actions={
        <Button asChild variant="outline" className="border-border bg-transparent">
          <Link href={buildPublicJourneyHref("/adesao", { tenantRef: resolvedTenantRef, planId })}>
            Ver planos
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Por que pedir um trial?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              O lead entra direto no CRM da unidade, com origem <span className="font-semibold text-foreground">SITE</span>,
              pronto para follow-up comercial.
            </p>
            <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
              <p className="text-sm font-semibold text-foreground">Fluxo sugerido</p>
              <p className="mt-2">
                Trial agora, cadastro depois. Se o visitante já estiver decidido, use o botão abaixo para cair
                direto no plano selecionado.
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                router.push(
                  buildPublicJourneyHref("/adesao/cadastro", {
                    tenantRef: resolvedTenantRef,
                    planId: planId ?? context.planos[0]?.id,
                  })
                )
              }
            >
              Ir direto para adesão
            </Button>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Formulário de trial</CardTitle>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                  {success}
                </div>
                <Button asChild className="w-full">
                  <Link
                    href={buildPublicJourneyHref("/adesao/cadastro", {
                      tenantRef: resolvedTenantRef,
                      planId: planId ?? draft.planId ?? context.planos[0]?.id,
                    })}
                  >
                    Continuar para cadastro
                  </Link>
                </Button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="space-y-1.5">
                  <label htmlFor="trial-nome" className="text-sm font-medium">
                    Nome completo
                  </label>
                  <Input
                    id="trial-nome"
                    {...register("nome")}
                    placeholder="Ex: Mariana Costa"
                    className="border-border bg-secondary"
                  />
                  {errors.nome ? <p className="text-xs text-rose-300">{errors.nome.message}</p> : null}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="trial-email" className="text-sm font-medium">
                      E-mail
                    </label>
                    <Input
                      id="trial-email"
                      type="email"
                      {...register("email")}
                      placeholder="voce@email.com"
                      className="border-border bg-secondary"
                    />
                    {errors.email ? <p className="text-xs text-rose-300">{errors.email.message}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="trial-telefone" className="text-sm font-medium">
                      Telefone
                    </label>
                    <Input
                      id="trial-telefone"
                      {...register("telefone")}
                      placeholder="(11) 99999-9999"
                      className="border-border bg-secondary"
                    />
                    {errors.telefone ? <p className="text-xs text-rose-300">{errors.telefone.message}</p> : null}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="trial-objetivo" className="text-sm font-medium">
                    Objetivo do aluno
                  </label>
                  <Textarea
                    id="trial-objetivo"
                    {...register("objetivo")}
                    placeholder="Ex: emagrecimento, musculação, aulas coletivas"
                    className="border-border bg-secondary"
                  />
                </div>
                {errors.root?.message ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {errors.root.message}
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving ? "Registrando..." : "Registrar trial"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </PublicJourneyShell>
  );
}

export default function TrialPage() {
  return (
    <Suspense fallback={<PublicJourneyFallback />}>
      <TrialPageContent />
    </Suspense>
  );
}
