"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePublicTenants } from "@/lib/query/use-public-tenants";
import { useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@/lib/forms/zod-resolver";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThermalReceipt, type ThermalReceiptItem } from "@/components/shared/thermal-receipt";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import {
  buildPublicContractPreview,
  buildPublicJourneyHref,
  getPublicPlanQuote,
  resolvePublicPlanInstallmentLimit,
  startPublicCheckout,
  type PublicCheckoutInput,
} from "@/lib/public/services";
import { publicCheckoutFormSchema } from "@/lib/forms/public-journey-schemas";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatBRL, formatCurrency } from "@/lib/shared/formatters";
import { cn } from "@/lib/utils";
import type { TipoFormaPagamento } from "@/lib/types";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

type CheckoutFormValues = {
  planId: string;
  formaPagamento: TipoFormaPagamento;
  parcelas: string;
  aceitarTermos: boolean;
};

const PAYMENT_METHOD_LABEL: Record<TipoFormaPagamento, string> = {
  DINHEIRO: "Dinheiro",
  PIX: "PIX",
  CARTAO_CREDITO: "Crédito",
  CARTAO_DEBITO: "Débito",
  BOLETO: "Boleto",
  RECORRENTE: "Recorrente",
};

function toThermalMetodo(
  value: TipoFormaPagamento,
): "DINHEIRO" | "CREDITO" | "DEBITO" | "PIX" | "RECORRENTE" {
  if (value === "CARTAO_CREDITO") return "CREDITO";
  if (value === "CARTAO_DEBITO") return "DEBITO";
  if (value === "RECORRENTE") return "RECORRENTE";
  if (value === "DINHEIRO") return "DINHEIRO";
  return "PIX";
}

function PublicJourneyFallback() {
  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
  );
}

function CheckoutPublicoPageContent() {
  const router = useRouter();
  const { context, loading, error, resolvedTenantRef, persistDraft, draft, planId } = usePublicJourney();
  const { data: tenantOptions = [] } = usePublicTenants();
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { register, control, handleSubmit, reset, setValue, formState: { errors } } = useForm<CheckoutFormValues>({
    resolver: zodResolver(publicCheckoutFormSchema),
    defaultValues: {
      planId: "",
      formaPagamento: "PIX",
      parcelas: "1",
      aceitarTermos: false,
    },
  });

  useEffect(() => {
    if (!context) return;
    const defaultPlanId = planId ?? draft.planId ?? context.planos[0]?.id ?? "";
    const defaultForma = context.formasPagamento[0] ?? "PIX";
    reset({
      planId: defaultPlanId,
      formaPagamento: defaultForma,
      parcelas: "1",
      aceitarTermos: false,
    });
  }, [context, draft.planId, planId, reset]);

  const selectedPlanId = useWatch({ control, name: "planId" });
  const formaPagamento = useWatch({ control, name: "formaPagamento" });
  const parcelas = useWatch({ control, name: "parcelas" });
  const parcelasSelecionadas = Math.max(1, Number.parseInt(parcelas || "1", 10) || 1);
  const selectedPlan = context?.planos.find((plan) => plan.id === selectedPlanId) ?? context?.planos[0] ?? null;
  const cartaoCreditoParcelasMax = context?.cartaoCreditoParcelasMax ?? 1;
  const parcelasMaximasCartao = selectedPlan
    ? resolvePublicPlanInstallmentLimit(selectedPlan, cartaoCreditoParcelasMax)
    : 1;
  const quote = selectedPlan ? getPublicPlanQuote(selectedPlan) : null;
  const receiptItems = useMemo<ThermalReceiptItem[]>(
    () =>
      quote?.items.map((item, index) => ({
        id: `${selectedPlan?.id ?? "plan"}-${index}`,
        nome: item.descricao,
        qtd: 1,
        valorUnit: item.valor,
        valorTotal: item.valor,
      })) ?? [],
    [quote?.items, selectedPlan?.id],
  );
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
  const receiptHeader = useMemo(() => {
    const endereco = context?.tenant.endereco;
    return {
      academiaNome: context?.academia.nome ?? context?.tenant.nome ?? "Conceito Fit",
      cnpj: context?.tenant.documento ?? context?.academia.documento,
      endereco: endereco
        ? [endereco.logradouro, endereco.numero, endereco.cidade].filter(Boolean).join(", ")
        : undefined,
    };
  }, [context?.academia.documento, context?.academia.nome, context?.tenant.documento, context?.tenant.endereco, context?.tenant.nome]);

  useEffect(() => {
    if (formaPagamento !== "CARTAO_CREDITO") {
      if (parcelasSelecionadas !== 1) {
        setValue("parcelas", "1", { shouldValidate: true });
      }
      return;
    }

    if (parcelasSelecionadas > parcelasMaximasCartao) {
      setValue("parcelas", String(parcelasMaximasCartao), { shouldValidate: true });
    }
  }, [formaPagamento, parcelasMaximasCartao, parcelasSelecionadas, setValue]);

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
        planId: selectedPlan?.id ?? values.planId,
        signup,
        pagamento: {
          formaPagamento: values.formaPagamento,
          parcelas:
            values.formaPagamento === "CARTAO_CREDITO"
              ? Math.max(1, Number.parseInt(values.parcelas, 10) || 1)
              : undefined,
        },
        aceitarTermos: values.aceitarTermos,
        leadId: draft.trialLeadId,
      };

      const checkout = await startPublicCheckout(payload);
      persistDraft({
        tenantRef: resolvedTenantRef,
        planId: selectedPlan?.id ?? values.planId,
        checkout,
      });
      router.replace(
        buildPublicJourneyHref("/adesao/pendencias", {
          tenantRef: resolvedTenantRef,
          planId: selectedPlan?.id ?? values.planId,
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
      title="Carrinho e fechamento da adesão"
      description="Depois do cadastro, o cliente só confirma pagamento e aceite para fechar a contratação online do plano selecionado."
      actions={
        <Button asChild variant="outline" className="border-border bg-transparent">
          <Link href={buildPublicJourneyHref("/adesao/cadastro", { tenantRef: resolvedTenantRef, planId: selectedPlan?.id ?? selectedPlanId })}>
            Revisar cadastro
          </Link>
        </Button>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
        <div className="space-y-6">
          <Card className="border-border/70 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Itens da venda</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedPlan ? (
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Plano selecionado
                      </p>
                      <h3 className="mt-1 font-display text-2xl font-bold">{selectedPlan.nome}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedPlan.tipo} • {selectedPlan.duracaoDias} dias
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Total inicial
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-gym-accent">
                        {formatBRL(quote?.total ?? 0)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 rounded-lg border border-border bg-background/30 px-3 py-2 text-xs text-muted-foreground">
                    Nesta etapa pública o carrinho fecha apenas o plano selecionado. Serviços e produtos continuam fora desse fluxo.
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Nenhum plano selecionado para este checkout.
                </div>
              )}

              <div className="space-y-2">
                {quote?.items.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{item.descricao}</p>
                        {item.detalhes ? (
                          <p className="mt-1 text-[11px] text-muted-foreground">{item.detalhes}</p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold">{formatBRL(item.valor)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-semibold">{draft.signup.nome}</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Contato</span>
                  <span className="font-medium">{draft.signup.email}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="overflow-hidden rounded-xl border border-border">
            <ThermalReceipt
              variant="carrinho"
              items={receiptItems}
              subtotal={quote?.total ?? 0}
              total={quote?.total ?? 0}
              metodoPagamento={toThermalMetodo(formaPagamento ?? "PIX")}
              parcelamento={
                formaPagamento === "CARTAO_CREDITO" && parcelasSelecionadas > 1
                  ? {
                      n: parcelasSelecionadas,
                      valorParcela: (quote?.total ?? 0) / parcelasSelecionadas,
                    }
                  : undefined
              }
              cabecalho={receiptHeader}
            />
          </div>
        </div>

        <Card className="border-border/70 bg-card/70 backdrop-blur">
          <CardHeader>
            <CardTitle>Pagamento e fechamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
              <input type="hidden" {...register("planId")} />
              <div
                className="flex items-center justify-between border-b border-border pb-4"
                data-testid="public-checkout-total"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Total
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cobrança inicial do plano selecionado
                  </p>
                </div>
                <span className="font-mono text-[32px] font-bold leading-none text-gym-accent">
                  {formatCurrency(quote?.total ?? 0)}
                </span>
              </div>

              <fieldset className="space-y-2">
                <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Forma de pagamento
                </legend>
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Forma de pagamento">
                  {context.formasPagamento.map((paymentType) => {
                    const checked = formaPagamento === paymentType;
                    return (
                      <label
                        key={paymentType}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-secondary px-3 py-2 text-sm",
                          checked ? "border-gym-accent ring-1 ring-gym-accent" : "",
                        )}
                      >
                        <input
                          type="radio"
                          value={paymentType}
                          checked={checked}
                          onChange={() =>
                            setValue("formaPagamento", paymentType, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          className="sr-only"
                        />
                        <span>{PAYMENT_METHOD_LABEL[paymentType] ?? paymentType.replaceAll("_", " ")}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.formaPagamento ? <p className="text-xs text-rose-300">{errors.formaPagamento.message}</p> : null}
              </fieldset>

              {formaPagamento === "CARTAO_CREDITO" ? (
                <fieldset className="space-y-2">
                  <legend className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Parcelas
                  </legend>
                  <div className={cn("grid gap-1.5", parcelasMaximasCartao > 6 ? "grid-cols-6" : "grid-cols-3 sm:grid-cols-6")}>
                    {Array.from({ length: parcelasMaximasCartao }, (_, index) => index + 1).map((installment) => {
                      const checked = parcelasSelecionadas === installment;
                      return (
                        <button
                          key={installment}
                          type="button"
                          className={cn(
                            "rounded-md border border-border bg-secondary px-2 py-1.5 text-xs font-mono transition-colors",
                            checked
                              ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                              : "hover:bg-secondary/70",
                          )}
                          onClick={() =>
                            setValue("parcelas", String(installment), {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                        >
                          {installment}×
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {parcelasMaximasCartao === 1
                      ? "Este plano fecha em uma parcela no online."
                      : `O parcelamento online deste plano vai até ${parcelasMaximasCartao}x.`}
                  </p>
                  {errors.parcelas ? <p className="text-xs text-rose-300">{errors.parcelas.message}</p> : null}
                </fieldset>
              ) : null}

              <div id="termos-contratacao" className="space-y-3 rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm">
                <div className="space-y-2 rounded-xl border border-border/70 bg-background/20 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Regras desta contratação
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>Pagamento online disponível apenas por PIX ou cartão de crédito.</li>
                    <li>
                      {selectedPlan?.permiteCobrancaRecorrente || selectedPlan?.permiteRenovacaoAutomatica
                        ? "Este plano já é vendido com renovação automática."
                        : "Este plano não usa renovação automática na contratação online."}
                    </li>
                    <li>
                      {parcelasMaximasCartao === 1
                        ? "Mensal e recorrente fecham à vista no online."
                        : `O parcelamento do cartão respeita o limite deste plano, até ${parcelasMaximasCartao}x.`}
                    </li>
                    <li>
                      Se houver contrato digital, a assinatura acontece depois do pagamento, na etapa de pendências.
                    </li>
                    <li>Registramos data e hora do aceite, IP de origem e navegador da contratação.</li>
                  </ul>
                </div>
                <label className="flex items-start gap-3">
                  <input type="checkbox" {...register("aceitarTermos")} className="mt-1" />
                  <span>
                    Aceito os <Link href="#termos-contratacao" className="underline underline-offset-4">termos da adesão e da cobrança</Link>
                    <span className="block text-muted-foreground">
                      Obrigatório para gerar a adesão, seguir para pagamento e concluir eventuais pendências de contrato.
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
                  Este plano não exige contrato digital no checkout. O aceite acima cobre os termos da adesão e da cobrança online.
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
