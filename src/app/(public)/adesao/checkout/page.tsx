"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import {
  buildPublicContractPreview,
  buildPublicJourneyHref,
  getPublicPlanQuote,
  listPublicTenants,
  startPublicCheckout,
  type PublicCheckoutInput,
} from "@/lib/public/services";
import { publicCheckoutFormSchema } from "@/lib/forms/public-journey-schemas";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatCurrency } from "@/lib/shared/formatters";
import type { Tenant, TipoFormaPagamento } from "@/lib/types";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

type CheckoutFormValues = {
  planId: string;
  formaPagamento: TipoFormaPagamento;
  parcelas: string;
  observacoes: string;
  renovacaoAutomatica: boolean;
  aceitarContratoAgora: boolean;
  aceitarTermos: boolean;
};

function PublicJourneyFallback() {
  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
  );
}

function CheckoutPublicoPageContent() {
  const router = useRouter();
  const { context, loading, error, resolvedTenantRef, persistDraft, draft, planId } = usePublicJourney();
  const [tenantOptions, setTenantOptions] = useState<Tenant[]>([]);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, control, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(publicCheckoutFormSchema),
    defaultValues: {
      planId: "",
      formaPagamento: "PIX",
      parcelas: "1",
      observacoes: "",
      renovacaoAutomatica: false,
      aceitarContratoAgora: true,
      aceitarTermos: false,
    },
  });

  useEffect(() => {
    void listPublicTenants().then(setTenantOptions);
  }, []);

  useEffect(() => {
    if (!context) return;
    const defaultPlanId = planId ?? draft.planId ?? context.planos[0]?.id ?? "";
    const defaultForma = context.formasPagamento[0] ?? "PIX";
    reset({
      planId: defaultPlanId,
      formaPagamento: defaultForma,
      parcelas: "1",
      observacoes: "",
      renovacaoAutomatica: Boolean(context.planos.find((plan) => plan.id === defaultPlanId)?.permiteRenovacaoAutomatica),
      aceitarContratoAgora: true,
      aceitarTermos: false,
    });
  }, [context, draft.planId, planId, reset]);

  const selectedPlanId = useWatch({ control, name: "planId" });
  const formaPagamento = useWatch({ control, name: "formaPagamento" });
  const selectedPlan = context?.planos.find((plan) => plan.id === selectedPlanId) ?? context?.planos[0] ?? null;
  const quote = selectedPlan ? getPublicPlanQuote(selectedPlan) : null;
  const contractPreviewRaw =
    context && selectedPlan && draft.signup
      ? buildPublicContractPreview({
          plano: selectedPlan,
          signup: draft.signup,
          tenant: context.tenant,
          academia: context.academia,
        })
      : undefined;
  // Sanitiza HTML do contrato — template vem do backend mas valores substituídos podem conter input de usuário
  const contractPreview = useMemo(
    () => (contractPreviewRaw ? sanitizeHtml(contractPreviewRaw) : undefined),
    [contractPreviewRaw],
  );

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
            {error || "Não foi possível carregar o checkout público."}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!draft.signup) {
    return (
      <PublicJourneyShell
        context={context}
        tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
        currentStep="CHECKOUT"
        title="Checkout aguardando cadastro"
        description="A rota de checkout depende do pré-cadastro concluído."
      >
        <Card className="mx-auto max-w-2xl border-border/70 bg-card/70 backdrop-blur">
          <CardContent className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              Preencha os dados do cliente antes de seguir para pagamento e contrato.
            </p>
            <Button asChild className="mt-6">
              <Link href={buildPublicJourneyHref("/adesao/cadastro", { tenantRef: resolvedTenantRef, planId: selectedPlanId || context.planos[0]?.id })}>
                Voltar para cadastro
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PublicJourneyShell>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    setSaving(true);
    setSubmitError("");
    try {
      const signup = draft.signup;
      if (!signup) {
        throw new Error("Cadastre os dados do cliente antes do checkout.");
      }
      const payload: PublicCheckoutInput = {
        tenantRef: resolvedTenantRef,
        planId: values.planId,
        signup,
        pagamento: {
          formaPagamento: values.formaPagamento,
          parcelas:
            values.formaPagamento === "CARTAO_CREDITO"
              ? Math.max(1, Number.parseInt(values.parcelas, 10) || 1)
              : undefined,
          observacoes: values.observacoes.trim() || undefined,
        },
        aceitarContratoAgora: values.aceitarContratoAgora,
        aceitarTermos: values.aceitarTermos,
        renovacaoAutomatica: values.renovacaoAutomatica,
        leadId: draft.trialLeadId,
      };

      const checkout = await startPublicCheckout(payload);
      persistDraft({
        tenantRef: resolvedTenantRef,
        planId: values.planId,
        checkout,
      });
      router.replace(
        buildPublicJourneyHref("/adesao/pendencias", {
          tenantRef: resolvedTenantRef,
          planId: values.planId,
          checkoutId: checkout.checkoutId,
        })
      );
    } catch (checkoutError) {
      setSubmitError(checkoutError instanceof Error ? checkoutError.message : "Falha ao concluir a adesão.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
      currentStep="CHECKOUT"
      title="Pagamento, contrato e confirmação"
      description="O checkout resolve matrícula, venda e pendências iniciais do contrato em uma única passagem."
      actions={
        <Button asChild variant="outline" className="border-border bg-transparent">
          <Link href={buildPublicJourneyHref("/adesao/cadastro", { tenantRef: resolvedTenantRef, planId: selectedPlanId })}>
            Revisar cadastro
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Resumo da contratação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedPlan && quote ? (
              <>
                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">{selectedPlan.tipo}</p>
                  <h3 className="mt-2 font-display text-3xl font-bold">{selectedPlan.nome}</h3>
                  <p className="mt-4 font-display text-4xl font-bold text-gym-accent">{formatCurrency(quote.total)}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Cliente: <span className="font-semibold text-foreground">{draft.signup.nome}</span>
                  </p>
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
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Fechamento digital</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="checkout-plan" className="text-sm font-medium">Plano</label>
                  <Controller
                    control={control}
                    name="planId"
                    render={({ field }) => (
                      <select
                        id="checkout-plan"
                        value={field.value}
                        onChange={(event) => {
                          const nextPlanId = event.target.value;
                          const nextPlan = context.planos.find((plan) => plan.id === nextPlanId);
                          const currentValues = getValues();
                          field.onChange(nextPlanId);
                          setValue("parcelas", "1");
                          setValue(
                            "formaPagamento",
                            !nextPlan?.permiteCobrancaRecorrente && currentValues.formaPagamento === "RECORRENTE"
                              ? (context.formasPagamento[0] ?? "PIX")
                              : currentValues.formaPagamento
                          );
                          setValue("renovacaoAutomatica", Boolean(nextPlan?.permiteRenovacaoAutomatica));
                        }}
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
                <div className="space-y-1.5">
                  <label htmlFor="checkout-payment" className="text-sm font-medium">Forma de pagamento</label>
                  <Controller
                    control={control}
                    name="formaPagamento"
                    render={({ field }) => (
                      <select
                        id="checkout-payment"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.value as TipoFormaPagamento)}
                        className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                      >
                        {context.formasPagamento.map((paymentType) => (
                          <option key={paymentType} value={paymentType}>
                            {paymentType.replaceAll("_", " ")}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  {errors.formaPagamento ? <p className="text-xs text-rose-300">{errors.formaPagamento.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-installments" className="text-sm font-medium">Parcelas</label>
                  <Input
                    id="checkout-installments"
                    type="number"
                    min={1}
                    {...register("parcelas")}
                    disabled={formaPagamento !== "CARTAO_CREDITO"}
                    className="border-border bg-secondary"
                  />
                  {errors.parcelas ? <p className="text-xs text-rose-300">{errors.parcelas.message}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="checkout-observacoes" className="text-sm font-medium">Observações do pagamento</label>
                  <Input
                    id="checkout-observacoes"
                    {...register("observacoes")}
                    className="border-border bg-secondary"
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register("renovacaoAutomatica")}
                    disabled={!selectedPlan?.permiteRenovacaoAutomatica}
                    className="mt-1"
                  />
                  <span>
                    Ativar renovação automática
                    <span className="block text-muted-foreground">
                      Mantém o contrato pronto para continuidade quando o plano permitir.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    {...register("aceitarContratoAgora")}
                    disabled={selectedPlan?.contratoAssinatura === "PRESENCIAL" || !contractPreview}
                    className="mt-1"
                  />
                  <span>
                    Assinar contrato agora
                    <span className="block text-muted-foreground">
                      Se não assinar agora, o fluxo segue para a área de pendências.
                    </span>
                  </span>
                </label>
                <label className="flex items-start gap-3">
                  <input type="checkbox" {...register("aceitarTermos")} className="mt-1" />
                  <span>
                    Aceito os termos da adesão e da cobrança
                    <span className="block text-muted-foreground">
                      Obrigatório para gerar venda, matrícula e contrato.
                    </span>
                  </span>
                </label>
                {errors.aceitarTermos ? <p className="text-xs text-rose-300">{errors.aceitarTermos.message}</p> : null}
              </div>

              {contractPreview ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Prévia do contrato</p>
                  <div
                    className="max-h-64 overflow-auto rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: contractPreview }}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-4 text-sm text-muted-foreground">
                  Este plano não exige contrato digital no checkout.
                </div>
              )}

              {submitError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {submitError}
                </div>
              ) : null}

              <Button type="submit" size="lg" className="w-full" disabled={saving}>
                {saving ? "Concluindo adesão..." : "Concluir adesão"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicJourneyShell>
  );
}

export default function CheckoutPublicoPage() {
  return (
    <Suspense fallback={<PublicJourneyFallback />}>
      <CheckoutPublicoPageContent />
    </Suspense>
  );
}
