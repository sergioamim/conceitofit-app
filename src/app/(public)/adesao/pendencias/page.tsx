"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePublicTenants } from "@/lib/query/use-public-tenants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PublicJourneyShell } from "@/components/public/public-journey-shell";
import {
  buildPublicJourneyHref,
  confirmPublicCheckoutPayment,
  getPublicCheckoutStatus,
  requestPublicCheckoutContractOtp,
  signPublicCheckoutContract,
  type PublicCheckoutSummary,
} from "@/lib/public/services";
import { usePublicJourney } from "@/lib/public/use-public-journey";
import { sanitizeHtml } from "@/lib/sanitize";
import { formatCurrency } from "@/lib/shared/formatters";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

function PublicJourneyFallback() {
  return (
    <SuspenseFallback variant="page" message="Carregando jornada pública..." />
  );
}

function PendenciasPublicasPageContent() {
  const {
    context,
    loading,
    error,
    resolvedTenantRef,
    checkoutId,
    draft,
    persistDraft,
    resetDraft,
    planId,
  } = usePublicJourney();
  const { data: tenantOptions = [] } = usePublicTenants();
  const [summary, setSummary] = useState<PublicCheckoutSummary | null>(null);
  const [saving, setSaving] = useState<"" | "PAYMENT" | "CONTRACT">("");
  const [pageError, setPageError] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpStep, setOtpStep] = useState<"idle" | "sending" | "enter">("idle");
  // Sanitiza HTML do contrato — vem do backend mas pode conter dados de input do usuário
  const safeContractHtml = useMemo(
    () => (summary?.contractHtml ? sanitizeHtml(summary.contractHtml) : undefined),
    [summary?.contractHtml],
  );

  useEffect(() => {
    if (!context) return;
    const targetCheckoutId = checkoutId ?? draft.checkout?.checkoutId;
    if (!targetCheckoutId) {
      setSummary(null);
      return;
    }
    const currentCheckoutId = targetCheckoutId;

    let active = true;
    async function load() {
      try {
        const next = await getPublicCheckoutStatus({
          tenantRef: resolvedTenantRef,
          checkoutId: currentCheckoutId,
          adesaoToken: draft.checkout?.adesaoToken,
        });
        if (!active) return;
        setSummary(next);
        persistDraft({ checkout: next, planId: next.planoId, tenantRef: resolvedTenantRef });
      } catch (statusError) {
        if (!active) return;
        setPageError(statusError instanceof Error ? statusError.message : "Falha ao consultar pendências.");
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [checkoutId, context, draft.checkout?.adesaoToken, draft.checkout?.checkoutId, persistDraft, resolvedTenantRef]);

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
            {error || "Não foi possível carregar a área de pendências."}
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleContract() {
    if (!summary) return;
    setSaving("CONTRACT");
    setPageError("");
    try {
      const next = await signPublicCheckoutContract({
        tenantRef: resolvedTenantRef,
        checkoutId: summary.checkoutId,
        adesaoToken: summary.adesaoToken ?? draft.checkout?.adesaoToken,
        otp: otpCode,
      });
      setSummary(next);
      persistDraft({ checkout: next });
      setOtpCode("");
      setOtpMessage("");
      setOtpStep("idle");
    } catch (signError) {
      setPageError(signError instanceof Error ? signError.message : "Falha ao assinar contrato.");
    } finally {
      setSaving("");
    }
  }

  async function handleSendOtp() {
    if (!summary) return;
    setOtpStep("sending");
    setPageError("");
    try {
      const response = await requestPublicCheckoutContractOtp({
        checkoutId: summary.checkoutId,
        adesaoToken: summary.adesaoToken ?? draft.checkout?.adesaoToken,
        destino: summary.alunoEmail,
      });
      setOtpMessage(`Código enviado. Válido até ${new Date(response.otpValidoAte).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.`);
      setOtpStep("enter");
    } catch (otpError) {
      setOtpStep("idle");
      setPageError(otpError instanceof Error ? otpError.message : "Falha ao enviar código de assinatura.");
    }
  }

  async function handlePayment() {
    if (!summary) return;
    setSaving("PAYMENT");
    setPageError("");
    try {
      const next = await confirmPublicCheckoutPayment({
        tenantRef: resolvedTenantRef,
        checkoutId: summary.checkoutId,
        adesaoToken: summary.adesaoToken ?? draft.checkout?.adesaoToken,
      });
      setSummary(next);
      persistDraft({ checkout: next });
    } catch (paymentError) {
      setPageError(paymentError instanceof Error ? paymentError.message : "Falha ao confirmar pagamento.");
    } finally {
      setSaving("");
    }
  }

  return (
    <PublicJourneyShell
      context={context}
      tenants={tenantOptions.length > 0 ? tenantOptions : [context.tenant]}
      currentStep="PENDENCIAS"
      title="Acompanhe o que ainda falta"
      description="Área pública de pós-checkout para contrato, pagamento e confirmação final do funil."
      actions={
        <Button
          type="button"
          variant="outline"
          className="border-border bg-transparent"
          onClick={() => {
            resetDraft();
            setSummary(null);
          }}
        >
          Limpar jornada
        </Button>
      }
    >
      {!summary ? (
        <Card className="mx-auto max-w-2xl border-border/70 bg-card/70 backdrop-blur">
          <CardContent className="px-6 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {pageError || "Nenhum checkout público foi encontrado para esta unidade."}
            </p>
            <Button asChild className="mt-6">
              <Link href={buildPublicJourneyHref("/adesao", { tenantRef: resolvedTenantRef, planId })}>
                Voltar para a landing
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-6">
            <Card className="border-border/70 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Status atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-secondary/25 p-4">
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="mt-1 font-semibold">{summary.alunoNome}</p>
                  <p className="text-sm text-muted-foreground">{summary.alunoEmail}</p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <p className="text-sm text-muted-foreground">Pagamento</p>
                    <p className="mt-2 font-display text-3xl font-bold text-gym-accent">{summary.pagamentoStatus}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {summary.formaPagamento.replaceAll("_", " ")} • {formatCurrency(summary.total)}
                    </p>
                    {summary.pagamentoStatus !== "PAGO" ? (
                      <Button
                        type="button"
                        className="mt-4 w-full"
                        onClick={handlePayment}
                        disabled={saving === "PAYMENT"}
                      >
                        {saving === "PAYMENT" ? "Confirmando..." : "Marcar pagamento como recebido"}
                      </Button>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                    <p className="text-sm text-muted-foreground">Contrato</p>
                    <p className="mt-2 font-display text-3xl font-bold text-gym-teal">{summary.contratoStatus}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {summary.requiresContract
                        ? `Modo ${summary.contratoModo?.toLowerCase()}`
                        : "Plano sem contrato digital"}
                    </p>
                    {summary.contratoStatus === "PENDENTE_ASSINATURA" ? (
                      summary.allowDigitalSignature ? (
                        <div className="mt-4 space-y-3">
                          {otpStep === "idle" ? (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={handleSendOtp}
                              disabled={saving === "CONTRACT"}
                            >
                              Enviar código para assinatura
                            </Button>
                          ) : null}

                          {otpStep === "sending" ? (
                            <div className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                              Enviando código OTP...
                            </div>
                          ) : null}

                          {otpStep === "enter" ? (
                            <div className="space-y-3">
                              <div className="rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                                {otpMessage || "Digite o código recebido por e-mail para concluir a assinatura."}
                              </div>
                              <Input
                                type="text"
                                value={otpCode}
                                onChange={(event) => setOtpCode(event.target.value)}
                                placeholder="Código OTP"
                                inputMode="numeric"
                              />
                              <div className="flex gap-3">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="flex-1 border-border bg-transparent"
                                  onClick={handleSendOtp}
                                  disabled={saving === "CONTRACT"}
                                >
                                  Reenviar código
                                </Button>
                                <Button
                                  type="button"
                                  className="flex-1"
                                  onClick={handleContract}
                                  disabled={saving === "CONTRACT" || !otpCode.trim()}
                                >
                                  {saving === "CONTRACT" ? "Assinando..." : "Confirmar assinatura"}
                                </Button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="mt-4 rounded-xl border border-border/70 bg-background/40 px-3 py-2 text-sm text-muted-foreground">
                          Assinatura presencial exigida pela unidade.
                        </div>
                      )
                    ) : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 bg-secondary/20 p-4">
                  <p className="text-sm text-muted-foreground">Próxima ação</p>
                  <p className="mt-2 text-lg font-semibold">
                    {summary.nextAction === "CONCLUIDO"
                      ? "Funil concluído"
                      : summary.nextAction === "ASSINAR_CONTRATO"
                      ? "Assinar contrato"
                      : "Confirmar pagamento"}
                  </p>
                </div>

                {pageError ? (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                    {pageError}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/70 bg-card/70 backdrop-blur">
              <CardHeader>
                <CardTitle>Resumo do checkout</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                  <span>Plano</span>
                  <span className="font-semibold text-foreground">{summary.planoNome}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                  <span>Checkout</span>
                  <span className="font-semibold text-foreground">{summary.checkoutId}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border/70 bg-secondary/20 px-3 py-2">
                  <span>Total</span>
                  <span className="font-semibold text-foreground">{formatCurrency(summary.total)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border/70 bg-card/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Contrato e fechamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {safeContractHtml ? (
                <div
                  className="max-h-[480px] overflow-auto rounded-2xl border border-border/70 bg-secondary/20 p-4 text-sm text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: safeContractHtml }}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-border/80 px-4 py-8 text-center text-sm text-muted-foreground">
                  Este checkout não possui contrato digital para visualização.
                </div>
              )}

              {summary.nextAction === "CONCLUIDO" ? (
                <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100">
                  Contratação concluída. O cliente já pode seguir para onboarding, acesso ou contato comercial.
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button asChild className="flex-1">
                  <Link href={buildPublicJourneyHref("/adesao", { tenantRef: resolvedTenantRef })}>
                    Nova adesão
                  </Link>
                </Button>
                <Button asChild variant="outline" className="flex-1 border-border bg-transparent">
                  <Link href={buildPublicJourneyHref("/adesao/cadastro", { tenantRef: resolvedTenantRef, planId: summary.planoId })}>
                    Revisar dados
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </PublicJourneyShell>
  );
}

export default function PendenciasPublicasPage() {
  return (
    <Suspense fallback={<PublicJourneyFallback />}>
      <PendenciasPublicasPageContent />
    </Suspense>
  );
}
