"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import { FieldAsyncFeedback } from "@/components/shared/field-async-feedback";
import { useAsyncFieldValidation } from "@/hooks/use-async-field-validation";
import { checkAlunoDuplicidadeService } from "@/lib/tenant/comercial/runtime";
import {
  buildPublicJourneyHref,
  getPublicPlanQuote,
  listPublicTenants,
  type PublicSignupDraft,
} from "@/lib/public/services";
import { publicSignupFormSchema } from "@/lib/forms/public-journey-schemas";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import type { Sexo, Tenant } from "@/lib/types";

const DEFAULT_SIGNUP: PublicSignupDraft = {
  nome: "",
  email: "",
  telefone: "",
  cpf: "",
  dataNascimento: "",
  sexo: "F",
  cidade: "",
  objetivo: "",
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function PublicJourneyFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
      Carregando jornada pública...
    </div>
  );
}

function CadastroPublicoPageContent() {
  const { context, loading, error, resolvedTenantRef, persistDraft, draft, planId } = usePublicJourney();
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);

  useEffect(() => {
    void listPublicTenants().then(setTenantOptions);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Carregando jornada pública...
      </div>
    );
  }

  if (!context) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-xl border-rose-500/40 bg-rose-500/10">
          <CardContent className="px-6 py-5 text-sm text-rose-100">
            {error || "Não foi possível carregar o cadastro público."}
          </CardContent>
        </Card>
      </div>
    );
  }

  const formSeed = draft.signup ?? DEFAULT_SIGNUP;
  const initialPlanId = planId ?? draft.planId ?? context.planos[0]?.id ?? "";
  const formKey = [
    context.tenant.id,
    initialPlanId,
    formSeed.nome,
    formSeed.email,
    formSeed.cpf,
  ].join(":");

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
      currentStep="CADASTRO"
      title="Complete o pré-cadastro"
      description="Dados mínimos para gerar cliente, venda, contrato e pendências com contexto do tenant."
      actions={
        <Button asChild variant="outline" className="border-border bg-transparent">
          <Link href={buildPublicJourneyHref("/adesao", { tenantRef: resolvedTenantRef, planId: initialPlanId })}>
            Voltar aos planos
          </Link>
        </Button>
      }
    >
      <CadastroPublicoForm
        key={formKey}
        context={context}
        initialForm={formSeed}
        initialPlanId={initialPlanId}
        resolvedTenantRef={resolvedTenantRef}
        persistDraft={persistDraft}
      />
    </PublicJourneyShell>
  );
}

function CadastroPublicoForm({
  context,
  initialForm,
  initialPlanId,
  resolvedTenantRef,
  persistDraft,
}: {
  context: NonNullable<ReturnType<typeof usePublicJourney>["context"]>;
  initialForm: PublicSignupDraft;
  initialPlanId: string;
  resolvedTenantRef: string;
  persistDraft: (patch: Partial<Parameters<ReturnType<typeof usePublicJourney>["persistDraft"]>[0]>) => void;
}) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<import("zod").input<typeof publicSignupFormSchema>>({
    resolver: zodResolver(publicSignupFormSchema),
    defaultValues: {
      ...initialForm,
      planId: initialPlanId,
    },
  });
  const selectedPlanId = useWatch({ control, name: "planId" });
  const selectedPlan = context.planos.find((item) => item.id === selectedPlanId) ?? context.planos[0];
  const quote = selectedPlan ? getPublicPlanQuote(selectedPlan) : null;

  const watchedCpf = useWatch({ control, name: "cpf" });
  const watchedEmail = useWatch({ control, name: "email" });

  const validateCpf = useCallback(
    async (value: string) => {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 11) return { valid: true };
      const result = await checkAlunoDuplicidadeService({
        tenantId: context.tenant.id,
        search: digits,
      });
      return result.exists
        ? { valid: false, message: "Este CPF já está cadastrado." }
        : { valid: true, message: "CPF disponível" };
    },
    [context.tenant.id]
  );

  const validateEmail = useCallback(
    async (value: string) => {
      if (!value.includes("@")) return { valid: true };
      const result = await checkAlunoDuplicidadeService({
        tenantId: context.tenant.id,
        search: value,
      });
      return result.exists
        ? { valid: false, message: "E-mail já cadastrado." }
        : { valid: true, message: "E-mail disponível" };
    },
    [context.tenant.id]
  );

  const cpfValidation = useAsyncFieldValidation({ validate: validateCpf });
  const emailValidation = useAsyncFieldValidation({ validate: validateEmail });

  useEffect(() => {
    if (watchedCpf && watchedCpf.replace(/\D/g, "").length >= 11) {
      cpfValidation.trigger(watchedCpf);
    } else {
      cpfValidation.reset();
    }
  }, [watchedCpf]);

  useEffect(() => {
    if (watchedEmail && watchedEmail.includes("@")) {
      emailValidation.trigger(watchedEmail);
    } else {
      emailValidation.reset();
    }
  }, [watchedEmail]);

  const asyncBlocking = cpfValidation.status === "loading" || cpfValidation.status === "error"
    || emailValidation.status === "loading" || emailValidation.status === "error";

  useEffect(() => {
    reset({
      ...initialForm,
      planId: initialPlanId,
    });
  }, [initialForm, initialPlanId, reset]);

  function onSubmit(values: import("zod").input<typeof publicSignupFormSchema>) {
    const signupValues: PublicSignupDraft = {
      nome: values.nome,
      email: values.email,
      telefone: values.telefone,
      cpf: values.cpf,
      dataNascimento: values.dataNascimento,
      sexo: values.sexo,
      cidade: values.cidade,
      objetivo: values.objetivo,
    };

    persistDraft({
      tenantRef: resolvedTenantRef,
      planId: values.planId,
      signup: signupValues,
    });

    router.push(
      buildPublicJourneyHref("/adesao/checkout", {
        tenantRef: resolvedTenantRef,
        planId: values.planId,
      })
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Dados do cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1.5">
              <label htmlFor="signup-plan" className="text-sm font-medium">
                Plano escolhido
              </label>
              <Controller
                control={control}
                name="planId"
                render={({ field }) => (
                  <select
                    id="signup-plan"
                    value={field.value}
                    onChange={field.onChange}
                    className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                  >
                    {context.planos.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.nome}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.planId ? <p className="text-xs text-rose-300">{errors.planId.message}</p> : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="signup-nome" className="text-sm font-medium">
                  Nome completo
                </label>
                <Input
                  id="signup-nome"
                  {...register("nome")}
                  className="border-border bg-secondary"
                />
                {errors.nome ? <p className="text-xs text-rose-300">{errors.nome.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-email" className="text-sm font-medium">
                  E-mail
                </label>
                <Input
                  id="signup-email"
                  type="email"
                  {...register("email")}
                  className="border-border bg-secondary"
                />
                {errors.email ? <p className="text-xs text-rose-300">{errors.email.message}</p> : null}
                <FieldAsyncFeedback status={emailValidation.status} message={emailValidation.message} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-telefone" className="text-sm font-medium">
                  Telefone
                </label>
                <Input
                  id="signup-telefone"
                  {...register("telefone")}
                  className="border-border bg-secondary"
                />
                {errors.telefone ? <p className="text-xs text-rose-300">{errors.telefone.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-cpf" className="text-sm font-medium">
                  CPF
                </label>
                <Input
                  id="signup-cpf"
                  {...register("cpf")}
                  className="border-border bg-secondary"
                />
                {errors.cpf ? <p className="text-xs text-rose-300">{errors.cpf.message}</p> : null}
                <FieldAsyncFeedback status={cpfValidation.status} message={cpfValidation.message} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-data" className="text-sm font-medium">
                  Data de nascimento
                </label>
                <Input
                  id="signup-data"
                  type="date"
                  {...register("dataNascimento")}
                  className="border-border bg-secondary"
                />
                {errors.dataNascimento ? <p className="text-xs text-rose-300">{errors.dataNascimento.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-sexo" className="text-sm font-medium">
                  Sexo
                </label>
                <Controller
                  control={control}
                  name="sexo"
                  render={({ field }) => (
                    <select
                      id="signup-sexo"
                      value={field.value}
                      onChange={(event) => field.onChange(event.target.value as Sexo)}
                      className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                    >
                      <option value="F">Feminino</option>
                      <option value="M">Masculino</option>
                      <option value="OUTRO">Outro</option>
                    </select>
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-cidade" className="text-sm font-medium">
                  Cidade
                </label>
                <Input
                  id="signup-cidade"
                  {...register("cidade")}
                  className="border-border bg-secondary"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="signup-objetivo" className="text-sm font-medium">
                Objetivo / observações
              </label>
              <Textarea
                id="signup-objetivo"
                {...register("objetivo")}
                className="border-border bg-secondary"
                placeholder="Ex: foco em musculação e aulas de spinning no período da manhã"
              />
            </div>

            <Button type="submit" className="w-full" disabled={asyncBlocking}>
              {asyncBlocking ? "Verificando dados..." : "Ir para checkout"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/70 backdrop-blur">
        <CardHeader>
          <CardTitle>Resumo do plano</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedPlan && quote ? (
            <>
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{selectedPlan.tipo}</p>
                <h3 className="mt-2 font-display text-3xl font-bold">{selectedPlan.nome}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contrato: {selectedPlan.contratoAssinatura.toLowerCase()} • Renovação automática {selectedPlan.permiteRenovacaoAutomatica ? "disponível" : "indisponível"}
                </p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                <p className="text-sm font-medium text-muted-foreground">Total inicial</p>
                <p className="mt-2 font-display text-4xl font-bold text-gym-accent">{formatCurrency(quote.total)}</p>
              </div>
              <div className="space-y-3">
                {quote.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{item.descricao}</p>
                      {item.detalhes ? <p className="text-xs text-muted-foreground">{item.detalhes}</p> : null}
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(item.valor)}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhum plano selecionado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function CadastroPublicoPage() {
  return (
    <Suspense fallback={<PublicJourneyFallback />}>
      <CadastroPublicoPageContent />
    </Suspense>
  );
}
